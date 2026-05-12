package usecase_test

import (
	"context"
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"

	"github.com/music-app/recommendation-service/internal/domain/entity"
	"github.com/music-app/recommendation-service/internal/usecase"
)

// Focus mood vector: [0.45, 0.50, 0.35, 0.45]
// tempo=123 BPM → tempo_norm=(123-60)/140=0.45 → HIGH track matches exactly (sim=1.0)
// v=0.10+i*0.01, e=0.70, d=0.80, tempo=60 BPM → MID band (sim ≈ 0.717–0.783)
// v=0.90, e=0.05, d=0.80, tempo=67 BPM → LOW band (sim ≈ 0.689)

func makeHighTrack(i int) *entity.Track {
	return &entity.Track{
		ID: fmt.Sprintf("high-%02d", i), SpotifyID: fmt.Sprintf("sp-h%02d", i),
		Valence: 0.45, Energy: 0.50, Danceability: 0.35, Tempo: 123,
		Popularity: 50 + i,
	}
}

func makeMidTrack(i int) *entity.Track {
	// Valence shifts i*0.01 so each track has a distinct cosine similarity.
	return &entity.Track{
		ID: fmt.Sprintf("mid-%02d", i), SpotifyID: fmt.Sprintf("sp-m%02d", i),
		Valence: 0.10 + float64(i)*0.01, Energy: 0.70, Danceability: 0.80, Tempo: 60,
		Popularity: 40,
	}
}

func makeLowTrack(i int) *entity.Track {
	return &entity.Track{
		ID: fmt.Sprintf("low-%02d", i), SpotifyID: fmt.Sprintf("sp-l%02d", i),
		Valence: 0.90, Energy: 0.05, Danceability: 0.80, Tempo: 67,
		Popularity: 30 + i,
	}
}

func buildCandidates(nHigh, nMid, nLow int) []*entity.Track {
	var all []*entity.Track
	for i := 0; i < nHigh; i++ {
		all = append(all, makeHighTrack(i))
	}
	for i := 0; i < nMid; i++ {
		all = append(all, makeMidTrack(i))
	}
	for i := 0; i < nLow; i++ {
		all = append(all, makeLowTrack(i))
	}
	return all
}

// newRadioUsecase wires up a usecase with GetCandidatesForMood mocked for MoodFocus.
// radioMinPop=20, radioCandidates=2000 are the constants inside mood_radio.go.
func newRadioUsecase(t *testing.T, candidates []*entity.Track) usecase.RecommendationUsecase {
	t.Helper()
	trackRepo := &mockTrackRepo{}
	profileRepo := &mockProfileRepo{}
	uc, _ := newTestUsecase(t, trackRepo, profileRepo)
	trackRepo.On("GetCandidatesForMood", mock.Anything, entity.MoodFocus, 20, 2000).Return(candidates, nil)
	return uc
}

// TestBuildMoodRadio_ExactlyThirtyTracks ensures the playlist always has 30 tracks.
func TestBuildMoodRadio_ExactlyThirtyTracks(t *testing.T) {
	uc := newRadioUsecase(t, buildCandidates(10, 20, 10))
	result, err := uc.BuildMoodRadio(context.Background(), entity.MoodFocus)
	require.NoError(t, err)
	assert.Len(t, result, 30)
}

// TestBuildMoodRadio_BellCurveProperty ensures peak avg similarity > warm-up and cool-down avgs.
func TestBuildMoodRadio_BellCurveProperty(t *testing.T) {
	uc := newRadioUsecase(t, buildCandidates(10, 20, 10))
	result, err := uc.BuildMoodRadio(context.Background(), entity.MoodFocus)
	require.NoError(t, err)
	require.Len(t, result, 30)

	moodVec := entity.MoodVectors[entity.MoodFocus]
	var warmup, peak, cooldown float64
	for i := 0; i < 10; i++ {
		warmup += usecase.CosineSimilarity(result[i].Vector(), moodVec)
	}
	for i := 10; i < 20; i++ {
		peak += usecase.CosineSimilarity(result[i].Vector(), moodVec)
	}
	for i := 20; i < 30; i++ {
		cooldown += usecase.CosineSimilarity(result[i].Vector(), moodVec)
	}
	warmup /= 10
	peak /= 10
	cooldown /= 10

	assert.Greater(t, peak, warmup, "peak avg sim must exceed warm-up avg sim")
	assert.Greater(t, peak, cooldown, "peak avg sim must exceed cool-down avg sim")
}

// TestBuildMoodRadio_WarmUpSortedAscending verifies tracks 1–10 are ordered by rising similarity.
func TestBuildMoodRadio_WarmUpSortedAscending(t *testing.T) {
	uc := newRadioUsecase(t, buildCandidates(10, 20, 10))
	result, err := uc.BuildMoodRadio(context.Background(), entity.MoodFocus)
	require.NoError(t, err)
	require.Len(t, result, 30)

	moodVec := entity.MoodVectors[entity.MoodFocus]
	for i := 0; i < 9; i++ {
		simA := usecase.CosineSimilarity(result[i].Vector(), moodVec)
		simB := usecase.CosineSimilarity(result[i+1].Vector(), moodVec)
		assert.LessOrEqual(t, simA, simB+1e-9, "warm-up not ascending at index %d→%d", i, i+1)
	}
}

// TestBuildMoodRadio_CoolDownSortedDescending verifies tracks 21–30 are ordered by falling similarity.
func TestBuildMoodRadio_CoolDownSortedDescending(t *testing.T) {
	uc := newRadioUsecase(t, buildCandidates(10, 20, 10))
	result, err := uc.BuildMoodRadio(context.Background(), entity.MoodFocus)
	require.NoError(t, err)
	require.Len(t, result, 30)

	moodVec := entity.MoodVectors[entity.MoodFocus]
	for i := 20; i < 29; i++ {
		simA := usecase.CosineSimilarity(result[i].Vector(), moodVec)
		simB := usecase.CosineSimilarity(result[i+1].Vector(), moodVec)
		assert.GreaterOrEqual(t, simA+1e-9, simB, "cool-down not descending at index %d→%d", i, i+1)
	}
}

// TestBuildMoodRadio_FallbackHighBandInsufficient verifies 30 tracks are returned even when high
// band has fewer than 10 tracks and peak is supplemented from the mid band.
func TestBuildMoodRadio_FallbackHighBandInsufficient(t *testing.T) {
	// Only 5 HIGH tracks — peak segment must fall back to top-mid-band tracks.
	uc := newRadioUsecase(t, buildCandidates(5, 20, 10))
	result, err := uc.BuildMoodRadio(context.Background(), entity.MoodFocus)
	require.NoError(t, err)
	assert.Len(t, result, 30, "playlist must still be 30 tracks when high band is sparse")
}
