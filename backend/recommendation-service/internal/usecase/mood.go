package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"time"

	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"

	"github.com/music-app/recommendation-service/internal/domain/entity"
)

const (
	moodCacheTTL   = time.Hour
	minPopularity  = 30
	candidateLimit = 500
	cacheTopN      = 100
)

func moodCacheKey(mood entity.Mood) string {
	return fmt.Sprintf("mood:%s:top", mood)
}

func userRecsCacheKey(userID string) string {
	return fmt.Sprintf("user:%s:recommendations", userID)
}

// GetByMood returns the tracks best matching the mood vector.
// The top-100 results are cached in Redis for 1h to avoid repeated full-table scans.
func (uc *recommendationUsecase) GetByMood(ctx context.Context, mood entity.Mood, limit int) ([]*entity.Track, error) {
	key := moodCacheKey(mood)

	cached, err := uc.redis.Get(ctx, key).Bytes()
	if err == nil {
		var tracks []*entity.Track
		if jsonErr := json.Unmarshal(cached, &tracks); jsonErr == nil {
			if limit > len(tracks) {
				limit = len(tracks)
			}
			return tracks[:limit], nil
		}
	} else if err != redis.Nil {
		uc.logger.Warn("redis get error, proceeding without cache", zap.String("key", key), zap.Error(err))
	}

	candidates, err := uc.trackRepo.GetCandidatesForMood(ctx, mood, minPopularity, candidateLimit)
	if err != nil {
		return nil, fmt.Errorf("GetCandidatesForMood: %w", err)
	}

	moodVec := entity.MoodVectors[mood]
	ranked := rankBySimilarity(candidates, moodVec)

	top := ranked
	if len(top) > cacheTopN {
		top = top[:cacheTopN]
	}

	if data, jsonErr := json.Marshal(top); jsonErr == nil {
		if setErr := uc.redis.Set(ctx, key, data, moodCacheTTL).Err(); setErr != nil {
			uc.logger.Warn("redis set error", zap.String("key", key), zap.Error(setErr))
		}
	}

	if limit > len(top) {
		limit = len(top)
	}
	return top[:limit], nil
}

// GetSimilar returns tracks with the highest cosine similarity to the given track.
// The source track itself is excluded from results.
func (uc *recommendationUsecase) GetSimilar(ctx context.Context, trackID string, limit int) ([]*entity.Track, error) {
	source, err := uc.trackRepo.GetByID(ctx, trackID)
	if err != nil {
		return nil, fmt.Errorf("GetByID: %w", err)
	}
	if source == nil {
		return nil, fmt.Errorf("track %q not found", trackID)
	}

	candidates, err := uc.trackRepo.GetTopByFeatureProximity(ctx, source.Vector(), 200)
	if err != nil {
		return nil, fmt.Errorf("GetTopByFeatureProximity: %w", err)
	}

	ranked := rankBySimilarity(candidates, source.Vector())

	result := make([]*entity.Track, 0, len(ranked))
	for _, t := range ranked {
		if t.ID != trackID {
			result = append(result, t)
		}
	}

	if limit > len(result) {
		limit = len(result)
	}
	return result[:limit], nil
}

// GetPersonal returns personalised recommendations based on the user's listening history.
// Falls back to "happy" mood recommendations for users with no play history yet.
func (uc *recommendationUsecase) GetPersonal(ctx context.Context, userID string, limit int) ([]*entity.Track, error) {
	profile, err := uc.profileRepo.Get(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("Get profile: %w", err)
	}
	if profile == nil {
		uc.logger.Info("no play history for user, falling back to happy mood", zap.String("user_id", userID))
		return uc.GetByMood(ctx, entity.MoodHappy, limit)
	}

	candidates, err := uc.trackRepo.GetTopByFeatureProximity(ctx, profile.Vector(), 200)
	if err != nil {
		return nil, fmt.Errorf("GetTopByFeatureProximity: %w", err)
	}

	ranked := rankBySimilarity(candidates, profile.Vector())

	if limit > len(ranked) {
		limit = len(ranked)
	}
	return ranked[:limit], nil
}

// RecordPlay updates the user taste profile using a weighted moving average,
// appends a play history row, and invalidates the personal recommendations cache.
func (uc *recommendationUsecase) RecordPlay(ctx context.Context, userID, trackID string) error {
	track, err := uc.trackRepo.GetByID(ctx, trackID)
	if err != nil {
		return fmt.Errorf("GetByID: %w", err)
	}
	if track == nil {
		return fmt.Errorf("track %q not found", trackID)
	}

	if _, err := uc.profileRepo.UpsertWithWeightedAverage(
		ctx, userID, track.Valence, track.Energy, track.Danceability, track.Tempo,
	); err != nil {
		return fmt.Errorf("UpsertWithWeightedAverage: %w", err)
	}

	if err := uc.profileRepo.InsertPlayHistory(ctx, userID, track.ID); err != nil {
		return fmt.Errorf("InsertPlayHistory: %w", err)
	}

	if err := uc.redis.Del(ctx, userRecsCacheKey(userID)).Err(); err != nil {
		uc.logger.Warn("redis del error", zap.String("user_id", userID), zap.Error(err))
	}

	return nil
}

// ── helpers ───────────────────────────────────────────────────────────────────

type scoredTrack struct {
	track *entity.Track
	score float64
}

// rankBySimilarity sorts tracks by cosine similarity to target, descending.
// Ties are broken by Euclidean distance (smaller = better).
func rankBySimilarity(candidates []*entity.Track, target [4]float64) []*entity.Track {
	scored := make([]scoredTrack, len(candidates))
	for i, t := range candidates {
		scored[i] = scoredTrack{track: t, score: CosineSimilarity(t.Vector(), target)}
	}
	sort.Slice(scored, func(i, j int) bool {
		if scored[i].score != scored[j].score {
			return scored[i].score > scored[j].score
		}
		return Distance(scored[i].track.Vector(), target) < Distance(scored[j].track.Vector(), target)
	})
	result := make([]*entity.Track, len(scored))
	for i, s := range scored {
		result[i] = s.track
	}
	return result
}
