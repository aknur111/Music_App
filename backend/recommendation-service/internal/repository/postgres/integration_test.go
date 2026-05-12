//go:build integration

package postgres_test

import (
	"context"
	"log"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	tcpostgres "github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"

	"github.com/music-app/recommendation-service/internal/domain/entity"
	infrapg "github.com/music-app/recommendation-service/internal/infrastructure/postgres"
	repopg "github.com/music-app/recommendation-service/internal/repository/postgres"
)

var testPool *pgxpool.Pool

func TestMain(m *testing.M) {
	ctx := context.Background()

	container, err := tcpostgres.Run(ctx,
		"postgres:16-alpine",
		tcpostgres.WithDatabase("testdb"),
		tcpostgres.WithUsername("test"),
		tcpostgres.WithPassword("test"),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2).
				WithStartupTimeout(60*time.Second),
		),
	)
	if err != nil {
		log.Fatalf("start postgres container: %v", err)
	}
	defer func() { _ = container.Terminate(ctx) }()

	dsn, err := container.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		log.Fatalf("connection string: %v", err)
	}

	if err := infrapg.RunMigrations(dsn, "../../../migrations"); err != nil {
		log.Fatalf("run migrations: %v", err)
	}

	testPool, err = infrapg.NewPool(ctx, dsn)
	if err != nil {
		log.Fatalf("new pool: %v", err)
	}
	defer testPool.Close()

	os.Exit(m.Run())
}

// ── Track repository ──────────────────────────────────────────────────────────

func TestTrackRepository_BulkInsert_Idempotent(t *testing.T) {
	repo := repopg.NewTrackRepository(testPool)
	ctx := context.Background()

	tracks := []*entity.Track{
		{SpotifyID: "sp-idem-1", Name: "Idempotent Track 1", Artists: "Artist A", Popularity: 50,
			Valence: 0.6, Energy: 0.7, Danceability: 0.5, Tempo: 120},
		{SpotifyID: "sp-idem-2", Name: "Idempotent Track 2", Artists: "Artist B", Popularity: 60,
			Valence: 0.7, Energy: 0.8, Danceability: 0.6, Tempo: 130},
	}

	n1, err := repo.BulkInsert(ctx, tracks)
	require.NoError(t, err)
	assert.Equal(t, 2, n1, "first insert should insert both tracks")

	n2, err := repo.BulkInsert(ctx, tracks)
	require.NoError(t, err)
	assert.Equal(t, 0, n2, "second insert should skip both (ON CONFLICT DO NOTHING)")
}

func TestTrackRepository_GetBySpotifyID_MissReturnsNil(t *testing.T) {
	repo := repopg.NewTrackRepository(testPool)
	ctx := context.Background()

	track, err := repo.GetBySpotifyID(ctx, "nonexistent-spotify-id")
	require.NoError(t, err)
	assert.Nil(t, track)
}

func TestTrackRepository_GetCandidatesForMood_PopularityFilter(t *testing.T) {
	repo := repopg.NewTrackRepository(testPool)
	ctx := context.Background()

	seed := []*entity.Track{
		{SpotifyID: "sp-pop-low", Name: "Low Pop", Artists: "X", Popularity: 10,
			Valence: 0.5, Energy: 0.5, Danceability: 0.5, Tempo: 120},
		{SpotifyID: "sp-pop-mid", Name: "Mid Pop", Artists: "X", Popularity: 30,
			Valence: 0.5, Energy: 0.5, Danceability: 0.5, Tempo: 120},
		{SpotifyID: "sp-pop-high", Name: "High Pop", Artists: "X", Popularity: 80,
			Valence: 0.5, Energy: 0.5, Danceability: 0.5, Tempo: 120},
	}
	_, err := repo.BulkInsert(ctx, seed)
	require.NoError(t, err)

	results, err := repo.GetCandidatesForMood(ctx, entity.MoodHappy, 30, 100)
	require.NoError(t, err)

	ids := make(map[string]bool)
	for _, r := range results {
		ids[r.SpotifyID] = true
	}
	assert.False(t, ids["sp-pop-low"], "track with popularity=10 must be excluded (min=30)")
	assert.True(t, ids["sp-pop-mid"], "track with popularity=30 must be included")
	assert.True(t, ids["sp-pop-high"], "track with popularity=80 must be included")
}

func TestTrackRepository_GetTopByFeatureProximity_BoundingBox(t *testing.T) {
	repo := repopg.NewTrackRepository(testPool)
	ctx := context.Background()

	// Query vector: [0.45, 0.50, 0.35, _]; box ±0.2 → valence∈[0.25,0.65], energy∈[0.30,0.70], dance∈[0.15,0.55]
	inBox := &entity.Track{SpotifyID: "sp-inbox", Name: "In Box", Artists: "X", Popularity: 50,
		Valence: 0.45, Energy: 0.50, Danceability: 0.35, Tempo: 123}
	outBox := &entity.Track{SpotifyID: "sp-outbox", Name: "Out Box", Artists: "X", Popularity: 50,
		Valence: 0.90, Energy: 0.90, Danceability: 0.90, Tempo: 180}

	_, err := repo.BulkInsert(ctx, []*entity.Track{inBox, outBox})
	require.NoError(t, err)

	results, err := repo.GetTopByFeatureProximity(ctx, [4]float64{0.45, 0.50, 0.35, 0.45}, 50)
	require.NoError(t, err)

	ids := make(map[string]bool)
	for _, r := range results {
		ids[r.SpotifyID] = true
	}
	assert.True(t, ids["sp-inbox"], "in-box track must appear in results")
	assert.False(t, ids["sp-outbox"], "out-of-box track must be excluded")
}

// ── Profile repository ────────────────────────────────────────────────────────

func TestProfileRepository_Get_NilWhenMissing(t *testing.T) {
	repo := repopg.NewProfileRepository(testPool)
	ctx := context.Background()

	profile, err := repo.Get(ctx, uuid.NewString())
	require.NoError(t, err)
	assert.Nil(t, profile)
}

func TestProfileRepository_UpsertWithWeightedAverage_TwoPlays(t *testing.T) {
	repo := repopg.NewProfileRepository(testPool)
	ctx := context.Background()
	userID := uuid.NewString()

	// Play 1: raw feature values become the initial averages.
	p1, err := repo.UpsertWithWeightedAverage(ctx, userID, 0.6, 0.7, 0.5, 120.0)
	require.NoError(t, err)
	require.NotNil(t, p1)
	assert.Equal(t, 1, p1.PlayCount)
	assert.InDelta(t, 0.6, p1.AvgValence, 1e-6)
	assert.InDelta(t, 0.7, p1.AvgEnergy, 1e-6)
	assert.InDelta(t, 0.5, p1.AvgDanceability, 1e-6)
	assert.InDelta(t, 120.0, p1.AvgTempo, 1e-6)

	// Play 2: new_avg = old * (1/2) + new * (1/2)
	// avg_v = 0.6*0.5 + 0.8*0.5 = 0.70
	// avg_e = 0.7*0.5 + 0.5*0.5 = 0.60
	// avg_d = 0.5*0.5 + 0.7*0.5 = 0.60
	// avg_t = 120*0.5 + 100*0.5 = 110.0
	p2, err := repo.UpsertWithWeightedAverage(ctx, userID, 0.8, 0.5, 0.7, 100.0)
	require.NoError(t, err)
	require.NotNil(t, p2)
	assert.Equal(t, 2, p2.PlayCount)
	assert.InDelta(t, 0.70, p2.AvgValence, 1e-6)
	assert.InDelta(t, 0.60, p2.AvgEnergy, 1e-6)
	assert.InDelta(t, 0.60, p2.AvgDanceability, 1e-6)
	assert.InDelta(t, 110.0, p2.AvgTempo, 1e-6)
}

func TestProfileRepository_InsertPlayHistory(t *testing.T) {
	trackRepo := repopg.NewTrackRepository(testPool)
	profileRepo := repopg.NewProfileRepository(testPool)
	ctx := context.Background()

	// Insert a track first so the foreign key on play_history.track_id is satisfied.
	seed := []*entity.Track{{
		SpotifyID: "sp-play-hist", Name: "History Track", Artists: "X",
		Popularity: 55, Valence: 0.5, Energy: 0.5, Danceability: 0.5, Tempo: 120,
	}}
	_, err := trackRepo.BulkInsert(ctx, seed)
	require.NoError(t, err)

	track, err := trackRepo.GetBySpotifyID(ctx, "sp-play-hist")
	require.NoError(t, err)
	require.NotNil(t, track, "track must exist after BulkInsert")

	err = profileRepo.InsertPlayHistory(ctx, uuid.NewString(), track.ID)
	assert.NoError(t, err)
}
