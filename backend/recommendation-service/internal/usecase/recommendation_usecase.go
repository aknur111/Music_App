package usecase

import (
	"context"

	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"

	"github.com/music-app/recommendation-service/internal/domain/entity"
	"github.com/music-app/recommendation-service/internal/domain/repository"
)

// RecommendationUsecase is the public interface for this service's business logic.
type RecommendationUsecase interface {
	GetByMood(ctx context.Context, mood entity.Mood, limit int) ([]*entity.Track, error)
	GetSimilar(ctx context.Context, trackID string, limit int) ([]*entity.Track, error)
	GetPersonal(ctx context.Context, userID string, limit int) ([]*entity.Track, error)
	BuildMoodRadio(ctx context.Context, mood entity.Mood) ([]*entity.Track, error)
	RecordPlay(ctx context.Context, userID, trackID string) error
	GetTrending(ctx context.Context, limit int) ([]*entity.Track, error)
	RateTrack(ctx context.Context, userID, trackID string, rating int32) error
	GetMyWave(ctx context.Context, userID, moodBias string, limit int, excludeIDs []string) ([]*entity.Track, error)
}

type recommendationUsecase struct {
	trackRepo   repository.TrackRepository
	profileRepo repository.ProfileRepository
	redis       *redis.Client
	logger      *zap.Logger
}

// New wires up the usecase with its dependencies.
func New(
	trackRepo repository.TrackRepository,
	profileRepo repository.ProfileRepository,
	rdb *redis.Client,
	logger *zap.Logger,
) RecommendationUsecase {
	return &recommendationUsecase{
		trackRepo:   trackRepo,
		profileRepo: profileRepo,
		redis:       rdb,
		logger:      logger,
	}
}
