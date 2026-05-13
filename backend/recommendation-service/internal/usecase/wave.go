package usecase

import (
	"context"
	"fmt"

	"github.com/music-app/recommendation-service/internal/domain/entity"
)

const waveCandidates = 500

// GetMyWave builds a personalised infinite-radio queue.
// It blends the user's taste profile (60%) with an optional mood bias (40%).
// New users with no play history fall back to the mood bias, or "happy" if none given.
// Tracks in excludeIDs are skipped, and no two consecutive tracks share the same artist.
func (uc *recommendationUsecase) GetMyWave(ctx context.Context, userID, moodBias string, limit int, excludeIDs []string) ([]*entity.Track, error) {
	if limit <= 0 {
		limit = 30
	}

	targetVector, err := uc.buildWaveVector(ctx, userID, moodBias)
	if err != nil {
		return nil, err
	}

	candidates, err := uc.trackRepo.GetTopByFeatureProximity(ctx, targetVector, waveCandidates)
	if err != nil {
		return nil, fmt.Errorf("GetTopByFeatureProximity: %w", err)
	}

	ranked := rankBySimilarity(candidates, targetVector)

	excludeSet := make(map[string]bool, len(excludeIDs))
	for _, id := range excludeIDs {
		excludeSet[id] = true
	}

	result := make([]*entity.Track, 0, limit)
	lastArtist := ""
	for _, t := range ranked {
		if excludeSet[t.ID] {
			continue
		}
		if t.Artists == lastArtist && len(result) > 0 {
			continue
		}
		result = append(result, t)
		lastArtist = t.Artists
		if len(result) >= limit {
			break
		}
	}

	return result, nil
}

func (uc *recommendationUsecase) buildWaveVector(ctx context.Context, userID, moodBias string) ([4]float64, error) {
	profile, _ := uc.profileRepo.Get(ctx, userID)

	if profile != nil {
		vec := profile.Vector()
		if moodBias != "" {
			if mood, err := entity.ParseMood(moodBias); err == nil {
				moodVec := entity.MoodVectors[mood]
				for i := range vec {
					vec[i] = 0.6*vec[i] + 0.4*moodVec[i]
				}
			}
		}
		return vec, nil
	}

	// no history yet — use mood bias or happy as seed
	if moodBias != "" {
		if mood, err := entity.ParseMood(moodBias); err == nil {
			return entity.MoodVectors[mood], nil
		}
	}
	return entity.MoodVectors[entity.MoodHappy], nil
}
