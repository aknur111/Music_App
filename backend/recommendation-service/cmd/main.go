package main

import (
	"go.uber.org/zap"

	"github.com/music-app/recommendation-service/internal/config"
)

func main() {
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	cfg := config.Load()
	logger.Info("recommendation-service starting", zap.String("grpc_port", cfg.GRPCPort))
}
