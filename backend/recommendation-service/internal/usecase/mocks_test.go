package usecase_test

import (
	"context"

	"github.com/stretchr/testify/mock"

	"github.com/music-app/recommendation-service/internal/domain/entity"
)

// ── TrackRepository mock ─────────────────────────────────────────────────────

type mockTrackRepo struct{ mock.Mock }

func (m *mockTrackRepo) GetByID(ctx context.Context, id string) (*entity.Track, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Track), args.Error(1)
}

func (m *mockTrackRepo) GetBySpotifyID(ctx context.Context, spotifyID string) (*entity.Track, error) {
	args := m.Called(ctx, spotifyID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Track), args.Error(1)
}

func (m *mockTrackRepo) BulkInsert(ctx context.Context, tracks []*entity.Track) (int, error) {
	args := m.Called(ctx, tracks)
	return args.Int(0), args.Error(1)
}

func (m *mockTrackRepo) GetCandidatesForMood(ctx context.Context, mood entity.Mood, minPopularity, limit int) ([]*entity.Track, error) {
	args := m.Called(ctx, mood, minPopularity, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*entity.Track), args.Error(1)
}

func (m *mockTrackRepo) GetTopByFeatureProximity(ctx context.Context, vector [4]float64, limit int) ([]*entity.Track, error) {
	args := m.Called(ctx, vector, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*entity.Track), args.Error(1)
}

// ── ProfileRepository mock ───────────────────────────────────────────────────

type mockProfileRepo struct{ mock.Mock }

func (m *mockProfileRepo) Get(ctx context.Context, userID string) (*entity.UserTasteProfile, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.UserTasteProfile), args.Error(1)
}

func (m *mockProfileRepo) UpsertWithWeightedAverage(
	ctx context.Context, userID string, valence, energy, danceability, tempo float64,
) (*entity.UserTasteProfile, error) {
	args := m.Called(ctx, userID, valence, energy, danceability, tempo)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.UserTasteProfile), args.Error(1)
}

func (m *mockProfileRepo) InsertPlayHistory(ctx context.Context, userID, trackID string) error {
	args := m.Called(ctx, userID, trackID)
	return args.Error(0)
}
