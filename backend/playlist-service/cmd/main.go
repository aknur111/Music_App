package main

import (
	"context"
	"fmt"
	"github.com/music-app/playlist-service/internal/infrastructure/grpcclient"
	"google.golang.org/grpc/credentials/insecure"
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
	goredis "github.com/redis/go-redis/v9"

	pb "github.com/NoneNon9/Music-app-gen/playlist"
	"github.com/music-app/playlist-service/internal/config"
	deliveryGRPC "github.com/music-app/playlist-service/internal/delivery/grpc"
	deliveryNATS "github.com/music-app/playlist-service/internal/delivery/nats"
	infraPG "github.com/music-app/playlist-service/internal/infrastructure/postgres"
	repoPG "github.com/music-app/playlist-service/internal/repository/postgres"
	repoRedis "github.com/music-app/playlist-service/internal/repository/redis"
	"github.com/music-app/playlist-service/internal/usecase"
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

	redisClient := goredis.NewClient(&goredis.Options{Addr: cfg.RedisAddr, Password: cfg.RedisPass})
	defer redisClient.Close()

	nc, err := nats.Connect(cfg.NatsURL)
	if err != nil {
		logger.Fatal("nats connect", zap.Error(err))
	}
	defer nc.Close()

	js, err := nc.JetStream()
	if err != nil {
		logger.Fatal("jetstream context", zap.Error(err))
	}

	musicConn, err := grpc.NewClient(
		cfg.MusicServiceAddr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithStatsHandler(otelgrpc.NewClientHandler()),
	)
	if err != nil {
		logger.Fatal("music service dial", zap.Error(err))
	}
	defer musicConn.Close()

	playlistRepo := repoPG.NewPlaylistRepository(db)
	cache := repoRedis.NewPlaylistCache(redisClient)
	publisher := deliveryNATS.NewPublisher(js)
	musicClientAdapter := grpcclient.NewMusicClient(musicConn)

	uc := usecase.NewPlaylistUsecase(playlistRepo, cache, publisher, musicClientAdapter)

	grpcServer := grpc.NewServer(
		grpc.StatsHandler(otelgrpc.NewServerHandler()),
	)
	pb.RegisterPlaylistServiceServer(grpcServer, deliveryGRPC.NewServer(uc))
	reflection.Register(grpcServer)

	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.GRPCPort))
	if err != nil {
		logger.Fatal("listen", zap.Error(err))
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		logger.Info("playlist-service starting", zap.String("port", cfg.GRPCPort))
		if err := grpcServer.Serve(lis); err != nil {
			logger.Fatal("grpc serve", zap.Error(err))
		}
	}()

	<-quit
	logger.Info("shutting down playlist-service")
	grpcServer.GracefulStop()
}
