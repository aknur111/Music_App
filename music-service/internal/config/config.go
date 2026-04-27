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
		GRPCPort: getEnv("MUSIC_GRPC_PORT", "50052"),
		PostgresDSN: fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
			getEnv("POSTGRES_USER", "postgres"),
			getEnv("POSTGRES_PASSWORD", "postgres"),
			getEnv("POSTGRES_HOST", "localhost"),
			getEnv("MUSIC_DB_PORT", "5433"),
			getEnv("MUSIC_DB_NAME", "music_db"),
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
