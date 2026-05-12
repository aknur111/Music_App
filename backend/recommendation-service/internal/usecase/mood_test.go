package usecase_test

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"

	"github.com/music-app/recommendation-service/internal/domain/entity"
	"github.com/music-app/recommendation-service/internal/usecase"
)

func newTestUsecase(t *testing.T, trackRepo *mockTrackRepo, profileRepo *mockProfileRepo) (usecase.RecommendationUsecase, *miniredis.Miniredis) {
	t.Helper()
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	uc := usecase.New(trackRepo, profileRepo, rdb, zap.NewNop())
	return uc, mr
}

// TestGetByMood_CacheHit verifies the usecase returns cached tracks and never queries the DB.
func TestGetByMood_CacheHit(t *testing.T) {
	trackRepo := &mockTrackRepo{}
	profileRepo := &mockProfileRepo{}
	uc, mr := newTestUsecase(t, trackRepo, profileRepo)

	tracks := []*entity.Track{{ID: "t1", Name: "Cached Track"}}
	data, err := json.Marshal(tracks)
	require.NoError(t, err)
	require.NoError(t, mr.Set("mood:happy:top", string(data)))

	result, err := uc.GetByMood(context.Background(), entity.MoodHappy, 10)
	require.NoError(t, err)
	require.Len(t, result, 1)
	assert.Equal(t, "t1", result[0].ID)
	trackRepo.AssertNotCalled(t, "GetCandidatesForMood", mock.Anything, mock.Anything, mock.Anything, mock.Anything)
}

// TestGetByMood_CacheMissPopulatesCache verifies DB is queried on cache miss and result is cached.
func TestGetByMood_CacheMissPopulatesCache(t *testing.T) {
	trackRepo := &mockTrackRepo{}
	profileRepo := &mockProfileRepo{}
	uc, mr := newTestUsecase(t, trackRepo, profileRepo)

	candidates := []*entity.Track{{ID: "db1", Name: "DB Track", Popularity: 70}}
	trackRepo.On("GetCandidatesForMood", mock.Anything, entity.MoodHappy, 30, 500).Return(candidates, nil)

	result, err := uc.GetByMood(context.Background(), entity.MoodHappy, 10)
	require.NoError(t, err)
	require.Len(t, result, 1)
	assert.Equal(t, "db1", result[0].ID)

	// Key must now be populated in Redis.
	val, err := mr.Get("mood:happy:top")
	require.NoError(t, err, "cache key should exist after miss+DB fetch")
	assert.NotEmpty(t, val)

	trackRepo.AssertExpectations(t)
}

// TestGetByMood_EmptyCandidates verifies an empty DB result returns gracefully.
func TestGetByMood_EmptyCandidates(t *testing.T) {
	trackRepo := &mockTrackRepo{}
	profileRepo := &mockProfileRepo{}
	uc, _ := newTestUsecase(t, trackRepo, profileRepo)

	trackRepo.On("GetCandidatesForMood", mock.Anything, entity.MoodSad, 30, 500).Return([]*entity.Track{}, nil)

	result, err := uc.GetByMood(context.Background(), entity.MoodSad, 10)
	require.NoError(t, err)
	assert.Empty(t, result)
	trackRepo.AssertExpectations(t)
}

// TestGetSimilar_ExcludesSourceTrack verifies the source track is stripped from results.
func TestGetSimilar_ExcludesSourceTrack(t *testing.T) {
	trackRepo := &mockTrackRepo{}
	profileRepo := &mockProfileRepo{}
	uc, _ := newTestUsecase(t, trackRepo, profileRepo)

	source := &entity.Track{ID: "src", SpotifyID: "sp-src", Valence: 0.5, Energy: 0.5, Danceability: 0.5, Tempo: 120}
	other := &entity.Track{ID: "other", SpotifyID: "sp-other", Valence: 0.51, Energy: 0.51, Danceability: 0.51, Tempo: 121}

	trackRepo.On("GetByID", mock.Anything, "src").Return(source, nil)
	trackRepo.On("GetTopByFeatureProximity", mock.Anything, source.Vector(), 200).Return([]*entity.Track{source, other}, nil)

	result, err := uc.GetSimilar(context.Background(), "src", 10)
	require.NoError(t, err)
	for _, t2 := range result {
		assert.NotEqual(t, "src", t2.ID, "source track must be excluded")
	}
	trackRepo.AssertExpectations(t)
}

// TestGetSimilar_SourceNotFound verifies an error is returned when the track is missing.
func TestGetSimilar_SourceNotFound(t *testing.T) {
	trackRepo := &mockTrackRepo{}
	profileRepo := &mockProfileRepo{}
	uc, _ := newTestUsecase(t, trackRepo, profileRepo)

	trackRepo.On("GetByID", mock.Anything, "missing").Return(nil, nil)

	_, err := uc.GetSimilar(context.Background(), "missing", 10)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "not found")
}

// TestGetPersonal_NilProfileFallsBackToHappy verifies new users receive happy-mood tracks.
func TestGetPersonal_NilProfileFallsBackToHappy(t *testing.T) {
	trackRepo := &mockTrackRepo{}
	profileRepo := &mockProfileRepo{}
	uc, _ := newTestUsecase(t, trackRepo, profileRepo)

	profileRepo.On("Get", mock.Anything, "new-user").Return(nil, nil)
	happyTracks := []*entity.Track{{ID: "h1", Popularity: 80, Valence: 0.85, Energy: 0.75, Danceability: 0.80, Tempo: 144}}
	trackRepo.On("GetCandidatesForMood", mock.Anything, entity.MoodHappy, 30, 500).Return(happyTracks, nil)

	result, err := uc.GetPersonal(context.Background(), "new-user", 5)
	require.NoError(t, err)
	assert.NotEmpty(t, result)
	profileRepo.AssertExpectations(t)
	trackRepo.AssertExpectations(t)
}

// TestGetPersonal_ExistingProfileUsesProfileVector verifies the profile vector drives candidate fetch.
func TestGetPersonal_ExistingProfileUsesProfileVector(t *testing.T) {
	trackRepo := &mockTrackRepo{}
	profileRepo := &mockProfileRepo{}
	uc, _ := newTestUsecase(t, trackRepo, profileRepo)

	profile := &entity.UserTasteProfile{
		UserID: "existing", AvgValence: 0.7, AvgEnergy: 0.8, AvgDanceability: 0.6, AvgTempo: 120, PlayCount: 5,
	}
	profileRepo.On("Get", mock.Anything, "existing").Return(profile, nil)
	candidates := []*entity.Track{{ID: "p1", Valence: 0.7, Energy: 0.8, Danceability: 0.6, Tempo: 120, Popularity: 60}}
	trackRepo.On("GetTopByFeatureProximity", mock.Anything, profile.Vector(), 200).Return(candidates, nil)

	result, err := uc.GetPersonal(context.Background(), "existing", 5)
	require.NoError(t, err)
	assert.NotEmpty(t, result)
	profileRepo.AssertExpectations(t)
	trackRepo.AssertExpectations(t)
}

// TestRecordPlay_TrackNotFoundReturnsErrorWithoutProfileUpdate ensures early exit on missing track.
func TestRecordPlay_TrackNotFoundReturnsErrorWithoutProfileUpdate(t *testing.T) {
	trackRepo := &mockTrackRepo{}
	profileRepo := &mockProfileRepo{}
	uc, _ := newTestUsecase(t, trackRepo, profileRepo)

	trackRepo.On("GetByID", mock.Anything, "ghost").Return(nil, nil)

	err := uc.RecordPlay(context.Background(), "user1", "ghost")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "not found")
	profileRepo.AssertNotCalled(t, "UpsertWithWeightedAverage",
		mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything)
}
