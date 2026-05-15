package main

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	pb "github.com/music-app/payment-service/gen/payment"
	"github.com/music-app/payment-service/internal/config"
	deliveryGRPC "github.com/music-app/payment-service/internal/delivery/grpc"
	infraPG "github.com/music-app/payment-service/internal/infrastructure/postgres"
	"github.com/music-app/payment-service/internal/provider"
	"github.com/music-app/payment-service/internal/provider/halyk"
	"github.com/music-app/payment-service/internal/provider/local"
	repoPG "github.com/music-app/payment-service/internal/repository/postgres"
	"github.com/music-app/payment-service/internal/usecase"
)

func main() {
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	cfg := config.Load()

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

	planRepo := repoPG.NewPlanRepository(db)
	payRepo := repoPG.NewPaymentRepository(db)
	subRepo := repoPG.NewSubscriptionRepository(db)

	providers := buildProviders(cfg, logger)

	uc := usecase.NewPaymentUsecase(planRepo, payRepo, subRepo, providers, cfg.ProviderID)

	grpcServer := grpc.NewServer(
		grpc.StatsHandler(otelgrpc.NewServerHandler()),
	)
	pb.RegisterPaymentServiceServer(grpcServer, deliveryGRPC.NewServer(uc))
	reflection.Register(grpcServer)

	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.GRPCPort))
	if err != nil {
		logger.Fatal("listen", zap.Error(err))
	}

	go func() {
		mux := http.NewServeMux()
		mux.Handle("/metrics", promhttp.Handler())
		logger.Info("payment-service metrics starting", zap.String("port", "9096"))
		if err := http.ListenAndServe(":9096", mux); err != nil {
			logger.Error("metrics server", zap.Error(err))
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		logger.Info("payment-service starting",
			zap.String("port", cfg.GRPCPort),
			zap.String("provider", cfg.ProviderID),
		)
		if err := grpcServer.Serve(lis); err != nil {
			logger.Fatal("grpc serve", zap.Error(err))
		}
	}()

	<-quit
	logger.Info("shutting down payment-service")
	grpcServer.GracefulStop()
}

func buildProviders(cfg *config.Config, logger *zap.Logger) []provider.Provider {
	if cfg.HalykClientID != "" {
		logger.Info("using halyk payment provider",
			zap.String("oauth_url", cfg.HalykOAuthURL),
			zap.String("api_url", cfg.HalykAPIURL),
			zap.String("portal_url", cfg.HalykPortalURL),
		)
		return []provider.Provider{
			halyk.New(halyk.Config{
				OAuthURL:     cfg.HalykOAuthURL,
				APIURL:       cfg.HalykAPIURL,
				PortalURL:    cfg.HalykPortalURL,
				ClientID:     cfg.HalykClientID,
				ClientSecret: cfg.HalykClientSecret,
				TerminalID:   cfg.HalykTerminalID,
				CallbackURL:  cfg.HalykCallbackURL,
			}, logger),
		}
	}
	logger.Info("using local (dev) payment provider — set HALYK_CLIENT_ID to use Halyk ePay")
	return []provider.Provider{local.New(cfg.FrontendURL)}
}
