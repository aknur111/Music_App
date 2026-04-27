package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"go.uber.org/zap"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"

	"github.com/music-app/api-gateway/internal/client"
	"github.com/music-app/api-gateway/internal/config"
	"github.com/music-app/api-gateway/internal/handler"
	"github.com/music-app/api-gateway/internal/middleware"
)

func main() {
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	cfg := config.Load()

	// ── gRPC connections ──────────────────────────────────────────────────────
	authConn, err := client.NewGRPCConn(cfg.AuthServiceAddr)
	if err != nil {
		logger.Fatal("auth-service connect", zap.Error(err))
	}
	defer authConn.Close()

	musicConn, err := client.NewGRPCConn(cfg.MusicServiceAddr)
	if err != nil {
		logger.Fatal("music-service connect", zap.Error(err))
	}
	defer musicConn.Close()

	playlistConn, err := client.NewGRPCConn(cfg.PlaylistServiceAddr)
	if err != nil {
		logger.Fatal("playlist-service connect", zap.Error(err))
	}
	defer playlistConn.Close()

	// ── Build client adapter (wires proto stubs to handler.Clients) ───────────
	// TODO: import generated pb stubs and wire concrete implementations.
	// Connections are established here; stub wiring happens once proto is generated.
	_ = authConn
	_ = musicConn
	_ = playlistConn

	clients := &handler.Clients{
		ValidateToken: func(ctx context.Context, token string) (string, string, bool) {
			return "", "", false // replaced after proto gen
		},
	}

	// ── HTTP router ───────────────────────────────────────────────────────────
	r := chi.NewRouter()
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.Recoverer)
	r.Use(middleware.Logger(logger))

	r.Mount("/", handler.Router(clients))

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.HTTPPort),
		Handler:      r,
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		logger.Info("api-gateway starting", zap.String("port", cfg.HTTPPort))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("http serve", zap.Error(err))
		}
	}()

	<-quit
	logger.Info("shutting down api-gateway")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(shutdownCtx)
}
