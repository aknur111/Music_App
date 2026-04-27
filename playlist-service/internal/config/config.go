package config

import (
	"fmt"
	"os"
)

type Config struct {
	GRPCPort       string
	PostgresDSN    string
	RedisAddr      string
	RedisPass      string
	NatsURL        string
	OTLPEndpoint   string
	MigrationsPath string
}

func Load() *Config {
	return &Config{
		GRPCPort: getEnv("PLAYLIST_GRPC_PORT", "50053"),
		PostgresDSN: fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
			getEnv("POSTGRES_USER", "postgres"),
			getEnv("POSTGRES_PASSWORD", "postgres"),
			getEnv("POSTGRES_HOST", "localhost"),
			getEnv("PLAYLIST_DB_PORT", "5434"),
			getEnv("PLAYLIST_DB_NAME", "playlist_db"),
		),
		RedisAddr:      getEnv("REDIS_HOST", "localhost") + ":" + getEnv("REDIS_PORT", "6379"),
		RedisPass:      getEnv("REDIS_PASSWORD", ""),
		NatsURL:        getEnv("NATS_URL", "nats://localhost:4222"),
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
