package repository

import (
	"context"

	"github.com/music-app/recommendation-service/internal/domain/entity"
)

// TrackRepository defines persistence operations for tracks.
type TrackRepository interface {
	// GetByID returns a track by its internal UUID.
	GetByID(ctx context.Context, id string) (*entity.Track, error)

	// GetBySpotifyID returns a track by its Spotify track_id string.
	GetBySpotifyID(ctx context.Context, spotifyID string) (*entity.Track, error)

	// BulkInsert inserts tracks using pgx CopyFrom for speed.
	// Rows with duplicate spotify_id are silently skipped (ON CONFLICT DO NOTHING).
	// Returns the number of rows actually inserted.
	BulkInsert(ctx context.Context, tracks []*entity.Track) (int, error)

	// GetCandidatesForMood returns up to limit tracks with popularity >= minPopularity,
	// ordered by popularity DESC. The usecase layer applies cosine similarity
	// ranking on top of this pre-filtered set.
	GetCandidatesForMood(ctx context.Context, mood entity.Mood, minPopularity int, limit int) ([]*entity.Track, error)

	// GetTopByFeatureProximity returns up to limit tracks using the composite
	// (valence, energy, danceability) index for a rough database-side filter.
	// The usecase layer re-ranks by full cosine similarity against vector.
	GetTopByFeatureProximity(ctx context.Context, vector [4]float64, limit int) ([]*entity.Track, error)
}
