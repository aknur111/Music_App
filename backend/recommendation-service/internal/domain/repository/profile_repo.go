package repository

import (
	"context"

	"github.com/music-app/recommendation-service/internal/domain/entity"
)

// ProfileRepository defines persistence operations for user taste profiles
// and play history.
type ProfileRepository interface {
	// Get returns the taste profile for userID.
	// Returns nil, nil (no error) when the user has no profile yet.
	Get(ctx context.Context, userID string) (*entity.UserTasteProfile, error)

	// UpsertWithWeightedAverage atomically updates the taste profile using a
	// weighted moving average: new_avg = old_avg * (n/(n+1)) + new_value/(n+1)
	// where n = current play_count. Inserts a new row with sensible defaults
	// on first play. Returns the updated profile.
	UpsertWithWeightedAverage(
		ctx context.Context,
		userID string,
		valence, energy, danceability, tempo float64,
	) (*entity.UserTasteProfile, error)

	// InsertPlayHistory records that userID played trackID.
	InsertPlayHistory(ctx context.Context, userID, trackID string) error
}
