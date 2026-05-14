//go:build integration

package postgres_test

import (
	"context"
	"path/filepath"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/music-app/playlist-service/internal/domain/entity"
	"github.com/music-app/playlist-service/internal/infrastructure/postgres"
	repo "github.com/music-app/playlist-service/internal/repository/postgres"
	"github.com/music-app/tests"
)

func TestPlaylistRepository_Integration(t *testing.T) {
	ctx := context.Background()
	infra := tests.SetupInfra(t)

	migPath, err := filepath.Abs("../../../migrations")
	require.NoError(t, err, "failed to get absolute path for migrations")
	err = postgres.RunMigrations(infra.PostgresDSN, migPath)
	require.NoError(t, err, "failed to run migrations")

	pool, err := postgres.NewPool(ctx, infra.PostgresDSN)
	require.NoError(t, err, "failed to connect to db")
	defer pool.Close()

	r := repo.NewPlaylistRepository(pool)
	userID := uuid.NewString()

	t.Run("Create and Get Playlist", func(t *testing.T) {
		p := &entity.Playlist{
			ID:        uuid.NewString(),
			UserID:    userID,
			Name:      "Test Playlist",
			CreatedAt: time.Now().UTC(),
			UpdatedAt: time.Now().UTC(),
		}

		err := r.Create(ctx, p)
		assert.NoError(t, err)

		found, err := r.GetByID(ctx, p.ID, userID)
		assert.NoError(t, err)
		assert.NotNil(t, found)
		assert.Equal(t, "Test Playlist", found.Name)
	})

	t.Run("Collaborator Access", func(t *testing.T) {
		ownerID := uuid.NewString()
		collabID := uuid.NewString()
		p := &entity.Playlist{
			ID: uuid.NewString(), UserID: ownerID, Name: "Collab Mix",
		}
		_ = r.Create(ctx, p)

		err := r.AddCollaborator(ctx, p.ID, ownerID, collabID)
		assert.NoError(t, err)

		found, err := r.GetByID(ctx, p.ID, collabID)
		assert.NoError(t, err)
		assert.NotNil(t, found)
	})

	t.Run("Add Song and Increment Count", func(t *testing.T) {
		pID := uuid.NewString()
		_ = r.Create(ctx, &entity.Playlist{ID: pID, UserID: userID, Name: "Songs"})

		ps := &entity.PlaylistSong{
			PlaylistID: pID,
			SongID:     uuid.NewString(),
			Title:      "Heavy Metal",
			DurationS:  300,
		}

		pos, err := r.AddSong(ctx, ps)
		assert.NoError(t, err)
		assert.Equal(t, 1, pos)

		updated, _ := r.GetByID(ctx, pID, userID)
		assert.Equal(t, 1, updated.SongCount)
	})
}
