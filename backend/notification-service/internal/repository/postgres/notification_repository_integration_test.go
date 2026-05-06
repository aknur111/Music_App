//go:build integration

package postgres_test

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	tcpostgres "github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"

	"github.com/music-app/notification-service/internal/domain/entity"
	infraPG "github.com/music-app/notification-service/internal/infrastructure/postgres"
	repoPG "github.com/music-app/notification-service/internal/repository/postgres"
)

func startPostgres(t *testing.T) string {
	t.Helper()
	ctx := context.Background()

	pg, err := tcpostgres.RunContainer(ctx,
		testcontainers.WithImage("postgres:16-alpine"),
		tcpostgres.WithDatabase("notif_test"),
		tcpostgres.WithUsername("postgres"),
		tcpostgres.WithPassword("postgres"),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2).WithStartupTimeout(30*time.Second),
		),
	)
	require.NoError(t, err)
	t.Cleanup(func() { _ = pg.Terminate(ctx) })

	host, err := pg.Host(ctx)
	require.NoError(t, err)
	port, err := pg.MappedPort(ctx, "5432")
	require.NoError(t, err)

	return fmt.Sprintf("postgres://postgres:postgres@%s:%s/notif_test?sslmode=disable", host, port.Port())
}

func TestNotificationRepository_Integration(t *testing.T) {
	dsn := startPostgres(t)
	ctx := context.Background()

	// Run migrations so the table exists.
	require.NoError(t, infraPG.RunMigrations(dsn, "../../../migrations"))

	pool, err := infraPG.NewPool(ctx, dsn)
	require.NoError(t, err)
	defer pool.Close()

	repo := repoPG.NewNotificationRepository(pool)

	t.Run("upsert and exists", func(t *testing.T) {
		now := time.Now().UTC().Truncate(time.Second)
		sentAt := now

		log := &entity.NotificationLog{
			ID:             "00000000-0000-0000-0000-000000000001",
			EventID:        "evt-integration-1",
			EventType:      "user.registered",
			RecipientEmail: "test@example.com",
			Subject:        "Welcome",
			Status:         entity.StatusSent,
			RetryCount:     0,
			SentAt:         &sentAt,
			CreatedAt:      now,
		}

		err := repo.Upsert(ctx, log)
		require.NoError(t, err)

		exists, err := repo.ExistsByEventID(ctx, "evt-integration-1", "user.registered")
		require.NoError(t, err)
		require.True(t, exists)
	})

	t.Run("upsert on conflict updates status", func(t *testing.T) {
		now := time.Now().UTC().Truncate(time.Second)

		// Insert as pending first.
		pending := &entity.NotificationLog{
			ID:             "00000000-0000-0000-0000-000000000002",
			EventID:        "evt-integration-2",
			EventType:      "song.uploaded",
			RecipientEmail: "artist@example.com",
			Subject:        "Song live",
			Status:         entity.StatusPending,
			CreatedAt:      now,
		}
		require.NoError(t, repo.Upsert(ctx, pending))

		// Should NOT appear as "sent" yet.
		exists, err := repo.ExistsByEventID(ctx, "evt-integration-2", "song.uploaded")
		require.NoError(t, err)
		require.False(t, exists)

		// Now update to sent.
		sentAt := now
		pending.Status = entity.StatusSent
		pending.SentAt = &sentAt
		require.NoError(t, repo.Upsert(ctx, pending))

		exists, err = repo.ExistsByEventID(ctx, "evt-integration-2", "song.uploaded")
		require.NoError(t, err)
		require.True(t, exists)
	})

	t.Run("failed status does not count as exists", func(t *testing.T) {
		now := time.Now().UTC().Truncate(time.Second)
		log := &entity.NotificationLog{
			ID:             "00000000-0000-0000-0000-000000000003",
			EventID:        "evt-integration-3",
			EventType:      "user.password_reset",
			RecipientEmail: "fail@example.com",
			Subject:        "Reset",
			Status:         entity.StatusFailed,
			ErrorMessage:   "smtp error",
			RetryCount:     3,
			CreatedAt:      now,
		}
		require.NoError(t, repo.Upsert(ctx, log))

		exists, err := repo.ExistsByEventID(ctx, "evt-integration-3", "user.password_reset")
		require.NoError(t, err)
		require.False(t, exists)
	})
}
