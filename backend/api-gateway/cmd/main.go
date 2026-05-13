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

	authpb "github.com/music-app/auth-service/gen/auth"

	"github.com/music-app/api-gateway/internal/client"
	"github.com/music-app/api-gateway/internal/config"
	"github.com/music-app/api-gateway/internal/handler"
	"github.com/music-app/api-gateway/internal/middleware"
)

func main() {
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	cfg := config.Load()

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

	recommConn, err := client.NewGRPCConn(cfg.RecommendationServiceAddr)
	if err != nil {
		logger.Fatal("recommendation-service connect", zap.Error(err))
	}
	defer recommConn.Close()

	paymentConn, err := client.NewGRPCConn(cfg.PaymentServiceAddr)
	if err != nil {
		logger.Fatal("payment-service connect", zap.Error(err))
	}
	defer paymentConn.Close()

	authClient := authpb.NewAuthServiceClient(authConn)
	musicClient := client.NewMusicClient(musicConn)
	playlistClient := client.NewPlaylistClient(playlistConn)
	recommClient := client.NewRecommendationClient(recommConn)
	paymentClient := client.NewPaymentClient(paymentConn)

	clients := &handler.Clients{
		RegisterUser: func(ctx context.Context, name, email, password string) (string, error) {
			resp, err := authClient.Register(ctx, &authpb.RegisterRequest{
				Name:     name,
				Email:    email,
				Password: password,
			})
			if err != nil {
				return "", err
			}
			return resp.UserId, nil
		},

		LoginUser: func(ctx context.Context, email, password string) (string, string, int64, error) {
			resp, err := authClient.Login(ctx, &authpb.LoginRequest{
				Email:    email,
				Password: password,
			})
			if err != nil {
				return "", "", 0, err
			}
			return resp.AccessToken, resp.RefreshToken, resp.ExpiresAt, nil
		},

		LogoutUser: func(ctx context.Context, token string) error {
			_, err := authClient.Logout(ctx, &authpb.LogoutRequest{
				AccessToken: token,
			})
			return err
		},

		RefreshToken: func(ctx context.Context, refreshToken string) (string, string, int64, error) {
			resp, err := authClient.RefreshToken(ctx, &authpb.RefreshTokenRequest{
				RefreshToken: refreshToken,
			})
			if err != nil {
				return "", "", 0, err
			}
			return resp.AccessToken, resp.RefreshToken, resp.ExpiresAt, nil
		},

		ValidateToken: func(ctx context.Context, token string) (string, string, bool) {
			resp, err := authClient.ValidateToken(ctx, &authpb.ValidateTokenRequest{
				AccessToken: token,
			})
			if err != nil || !resp.Valid {
				return "", "", false
			}
			return resp.UserId, resp.Email, resp.Valid
		},

		GetSong:       musicClient.GetSong,
		ListSongs:     musicClient.ListSongs,
		SearchSongs:   musicClient.SearchSongs,
		GetArtist:     musicClient.GetArtist,
		ListArtists:   musicClient.ListArtists,
		SearchArtists: musicClient.SearchArtists,
		UploadSong:    musicClient.UploadSong,

		CreatePlaylist: playlistClient.CreatePlaylist,
		GetPlaylist:    playlistClient.GetPlaylist,
		ListPlaylists:  playlistClient.ListPlaylists,
		AddSong:        playlistClient.AddSong,
		RemoveSong:     playlistClient.RemoveSong,
		UpdatePlaylist: playlistClient.UpdatePlaylist,
		DeletePlaylist: playlistClient.DeletePlaylist,

		GetRecommendationsByMood:   recommClient.GetByMood,
		GetMoodRadio:               recommClient.GetMoodRadio,
		GetSimilarTracks:           recommClient.GetSimilar,
		GetPersonalRecommendations: recommClient.GetPersonal,
		RecordPlayback:             recommClient.RecordPlayback,
		GetTrendingTracks:          recommClient.GetTrending,
		RateTrack:                  recommClient.RateTrack,
		GetMyWave:                  recommClient.GetMyWave,

		GetPlans:            paymentClient.GetPlans,
		CreateCheckout:      paymentClient.CreateCheckout,
		GetPayment:          paymentClient.GetPayment,
		ListMyPayments:      paymentClient.ListMyPayments,
		GetMySubscription:   paymentClient.GetMySubscription,
		HandleCallback:      paymentClient.HandleCallback,
	}

	r := chi.NewRouter()
	r.Use(middleware.CORS)
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.Recoverer)
	r.Use(middleware.Logger(logger))
	r.Use(middleware.Metrics)

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