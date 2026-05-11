package main

import (
	"context"
	"fmt"
	"html/template"
	"net"
	"os"
	"os/signal"
	"syscall"
	"time"

	"net/http"

	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	pb "github.com/music-app/notification-service/gen/notification"
	"github.com/music-app/notification-service/internal/config"
	deliveryGRPC "github.com/music-app/notification-service/internal/delivery/grpc"
	deliveryNATS "github.com/music-app/notification-service/internal/delivery/nats"
	infraNATS "github.com/music-app/notification-service/internal/infrastructure/nats"
	infraPG "github.com/music-app/notification-service/internal/infrastructure/postgres"
	repoPG "github.com/music-app/notification-service/internal/repository/postgres"
	"github.com/music-app/notification-service/internal/smtp"
	"github.com/music-app/notification-service/internal/usecase"
)

func main() {
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	cfg := config.Load()

	// ── Postgres ──────────────────────────────────────────────────────────────
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	db, err := infraPG.NewPool(ctx, cfg.PostgresDSN)
	if err != nil {
		logger.Fatal("postgres connect", zap.Error(err))
	}
	defer db.Close()

	if err := infraPG.RunMigrations(cfg.PostgresDSN, cfg.MigrationsPath); err != nil {
		logger.Fatal("migrations", zap.Error(err))
	}

	// ── NATS ──────────────────────────────────────────────────────────────────
	nc, js, err := infraNATS.Connect(cfg.NatsURL)
	if err != nil {
		logger.Fatal("nats connect", zap.Error(err))
	}
	defer nc.Close()

	// ── Email templates ───────────────────────────────────────────────────────
	tmpl, err := template.ParseGlob(cfg.TemplatesPath + "/*.html")
	if err != nil {
		logger.Fatal("parse email templates", zap.Error(err))
	}

	// ── Wire up service ───────────────────────────────────────────────────────
	emailSender := smtp.NewSender(smtp.Config{
		Host:     cfg.SMTPHost,
		Port:     cfg.SMTPPort,
		User:     cfg.SMTPUser,
		Password: cfg.SMTPPassword,
		From:     cfg.SMTPFrom,
	})

	notificationRepo := repoPG.NewNotificationRepository(db)
	uc := usecase.NewNotificationUsecase(notificationRepo, emailSender, tmpl, logger)

	// ── NATS subscriber ───────────────────────────────────────────────────────
	subscriber := deliveryNATS.NewSubscriber(js, uc, logger)
	if err := subscriber.Subscribe(); err != nil {
		logger.Fatal("nats subscribe", zap.Error(err))
	}

	// ── gRPC server ───────────────────────────────────────────────────────────
	grpcServer := grpc.NewServer(
		grpc.StatsHandler(otelgrpc.NewServerHandler()),
	)
	pb.RegisterNotificationServiceServer(grpcServer, deliveryGRPC.NewServer(uc))
	reflection.Register(grpcServer)

	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.GRPCPort))
	if err != nil {
		logger.Fatal("listen", zap.Error(err))
	}

	go func() {
		mux := http.NewServeMux()
		mux.Handle("/metrics", promhttp.Handler())
		logger.Info("notification-service metrics starting", zap.String("port", "9090"))
		if err := http.ListenAndServe(":9090", mux); err != nil {
			logger.Error("metrics server", zap.Error(err))
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		logger.Info("notification-service started", zap.String("grpc_port", cfg.GRPCPort))
		if err := grpcServer.Serve(lis); err != nil {
			logger.Fatal("grpc serve", zap.Error(err))
		}
	}()

	<-quit
	logger.Info("shutting down notification-service")
	grpcServer.GracefulStop()
}
