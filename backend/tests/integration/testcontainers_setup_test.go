//go:build integration

package integration_test

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/modules/redis"
	"github.com/testcontainers/testcontainers-go/wait"
)

type TestInfra struct {
	PostgresDSN string
	RedisAddr   string
	NatsURL     string
}

func setupInfra(t *testing.T) *TestInfra {
	t.Helper()
	ctx := context.Background()

	// ── PostgreSQL ────────────────────────────────────────────────────────────
	pgContainer, err := postgres.RunContainer(ctx,
		testcontainers.WithImage("postgres:16-alpine"),
		postgres.WithDatabase("testdb"),
		postgres.WithUsername("postgres"),
		postgres.WithPassword("postgres"),
		testcontainers.WithWaitStrategy(wait.ForLog("database system is ready to accept connections").
			WithOccurrence(2).WithStartupTimeout(30*time.Second)),
	)
	require.NoError(t, err)
	t.Cleanup(func() { _ = pgContainer.Terminate(ctx) })

	pgHost, err := pgContainer.Host(ctx)
	require.NoError(t, err)
	pgPort, err := pgContainer.MappedPort(ctx, "5432")
	require.NoError(t, err)
	pgDSN := fmt.Sprintf("postgres://postgres:postgres@%s:%s/testdb?sslmode=disable", pgHost, pgPort.Port())

	// ── Redis ─────────────────────────────────────────────────────────────────
	redisContainer, err := redis.RunContainer(ctx,
		testcontainers.WithImage("redis:7-alpine"),
	)
	require.NoError(t, err)
	t.Cleanup(func() { _ = redisContainer.Terminate(ctx) })

	redisAddr, err := redisContainer.ConnectionString(ctx)
	require.NoError(t, err)

	// ── NATS ──────────────────────────────────────────────────────────────────
	natsContainer, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: testcontainers.ContainerRequest{
			Image:        "nats:2.10-alpine",
			Cmd:          []string{"-js"},
			ExposedPorts: []string{"4222/tcp"},
			WaitingFor:   wait.ForLog("Server is ready"),
		},
		Started: true,
	})
	require.NoError(t, err)
	t.Cleanup(func() { _ = natsContainer.Terminate(ctx) })

	natsHost, err := natsContainer.Host(ctx)
	require.NoError(t, err)
	natsPort, err := natsContainer.MappedPort(ctx, "4222")
	require.NoError(t, err)
	natsURL := fmt.Sprintf("nats://%s:%s", natsHost, natsPort.Port())

	return &TestInfra{
		PostgresDSN: pgDSN,
		RedisAddr:   redisAddr,
		NatsURL:     natsURL,
	}
}
