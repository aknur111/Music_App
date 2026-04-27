package main

import (
	"context"
	"fmt"
	"net"
	"os"
	"os/signal"
	"syscall"
	"time"

	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	"github.com/nats-io/nats.go"

	pb "github.com/music-app/auth-service/gen/auth"
	"github.com/music-app/auth-service/internal/config"
	deliveryGRPC "github.com/music-app/auth-service/internal/delivery/grpc"
	deliveryNATS "github.com/music-app/auth-service/internal/delivery/nats"
	infraPG "github.com/music-app/auth-service/internal/infrastructure/postgres"
	infraRedis "github.com/music-app/auth-service/internal/infrastructure/redis"
	repoPG "github.com/music-app/auth-service/internal/repository/postgres"
	repoRedis "github.com/music-app/auth-service/internal/repository/redis"
	"github.com/music-app/auth-service/internal/usecase"
)

func main() {
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	cfg := config.Load()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// ── Postgres ──────────────────────────────────────────────────────────────
	db, err := infraPG.NewPool(ctx, cfg.PostgresDSN)
	if err != nil {
		logger.Fatal("postgres connect", zap.Error(err))
	}
	defer db.Close()

	if err := infraPG.RunMigrations(cfg.PostgresDSN, cfg.MigrationsPath); err != nil {
		logger.Fatal("migrations", zap.Error(err))
	}

	// ── Redis ─────────────────────────────────────────────────────────────────
	redisClient, err := infraRedis.NewClient(cfg.RedisAddr, cfg.RedisPass, 0)
	if err != nil {
		logger.Fatal("redis connect", zap.Error(err))
	}
	defer redisClient.Close()

	// ── NATS ──────────────────────────────────────────────────────────────────
	nc, err := nats.Connect(cfg.NatsURL)
	if err != nil {
		logger.Fatal("nats connect", zap.Error(err))
	}
	defer nc.Close()

	js, err := nc.JetStream()
	if err != nil {
		logger.Fatal("jetstream context", zap.Error(err))
	}

	// ensure stream exists
	_, _ = js.AddStream(&nats.StreamConfig{
		Name:     "MUSIC_EVENTS",
		Subjects: []string{"music.>"},
	})

	// ── Wire dependencies ─────────────────────────────────────────────────────
	userRepo := repoPG.NewUserRepository(db)
	tokenRepo := repoPG.NewRefreshTokenRepository(db)
	blacklist := repoRedis.NewTokenBlacklist(redisClient)
	publisher := deliveryNATS.NewPublisher(js)

	uc := usecase.NewAuthUsecase(
		userRepo, tokenRepo, blacklist, publisher,
		cfg.JWTSecret, cfg.AccessTTL, cfg.RefreshTTL,
	)

	// ── gRPC server ───────────────────────────────────────────────────────────
	grpcServer := grpc.NewServer(
		grpc.StatsHandler(otelgrpc.NewServerHandler()),
	)
	pb.RegisterAuthServiceServer(grpcServer, deliveryGRPC.NewServer(uc))
	reflection.Register(grpcServer)

	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.GRPCPort))
	if err != nil {
		logger.Fatal("listen", zap.Error(err))
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		logger.Info("auth-service starting", zap.String("port", cfg.GRPCPort))
		if err := grpcServer.Serve(lis); err != nil {
			logger.Fatal("grpc serve", zap.Error(err))
		}
	}()

	<-quit
	logger.Info("shutting down auth-service")
	grpcServer.GracefulStop()
}
