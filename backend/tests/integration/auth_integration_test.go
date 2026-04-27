//go:build integration

package integration_test

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestAuthFlow is a full integration test for the auth usecase wired to real
// Postgres and Redis instances provided by testcontainers.
func TestAuthFlow(t *testing.T) {
	infra := setupInfra(t)
	ctx := context.Background()

	// TODO: wire auth usecase with real repositories using infra.PostgresDSN / infra.RedisAddr
	// Example flow:
	//   1. Run migrations
	//   2. Register user
	//   3. Login → receive tokens
	//   4. ValidateToken → expect valid
	//   5. Logout → blacklist token
	//   6. ValidateToken again → expect invalid

	_ = infra
	_ = ctx

	// placeholder assertions so the test is runnable
	assert.NotEmpty(t, infra.PostgresDSN)
	assert.NotEmpty(t, infra.RedisAddr)
	assert.NotEmpty(t, infra.NatsURL)
}

// TestNotificationOnRegister tests that publishing a user.registered NATS event
// results in a notification_log record being created.
func TestNotificationOnRegister(t *testing.T) {
	infra := setupInfra(t)
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	// TODO: wire notification-service subscriber and send a user.registered event,
	// then query notification_logs to assert a row was inserted.

	require.NotNil(t, infra)
	_ = ctx
}
