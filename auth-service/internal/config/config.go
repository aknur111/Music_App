package config

import (
	"fmt"
	"os"
	"time"
)

type Config struct {
	GRPCPort    string
	PostgresDSN string
	RedisAddr   string
	RedisPass   string
	NatsURL     string
	JWTSecret   string
	AccessTTL   time.Duration
	RefreshTTL  time.Duration
	OTLPEndpoint string
	MigrationsPath string
}

func Load() *Config {
	accessTTL, _ := time.ParseDuration(getEnv("JWT_ACCESS_TTL", "15m"))
	refreshTTL, _ := time.ParseDuration(getEnv("JWT_REFRESH_TTL", "168h"))

	return &Config{
		GRPCPort: getEnv("AUTH_GRPC_PORT", "50051"),
		PostgresDSN: fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
			getEnv("POSTGRES_USER", "postgres"),
			getEnv("POSTGRES_PASSWORD", "postgres"),
			getEnv("POSTGRES_HOST", "localhost"),
			getEnv("AUTH_DB_PORT", "5432"),
			getEnv("AUTH_DB_NAME", "auth_db"),
		),
		RedisAddr:      getEnv("REDIS_HOST", "localhost") + ":" + getEnv("REDIS_PORT", "6379"),
		RedisPass:      getEnv("REDIS_PASSWORD", ""),
		NatsURL:        getEnv("NATS_URL", "nats://localhost:4222"),
		JWTSecret:      getEnv("JWT_SECRET", "change-me"),
		AccessTTL:      accessTTL,
		RefreshTTL:     refreshTTL,
		OTLPEndpoint:   getEnv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317"),
		MigrationsPath: getEnv("MIGRATIONS_PATH", "migrations"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
