package config

import (
	"fmt"
	"os"
)

type Config struct {
	GRPCPort       string
	PostgresDSN    string
	RedisAddr      string
	RedisPassword  string
	NatsURL        string
	OTLPEndpoint   string
	MigrationsPath string
}

func Load() *Config {
	return &Config{
		GRPCPort: getEnv("RECOMMENDATION_GRPC_PORT", "50055"),
		PostgresDSN: fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
			getEnv("POSTGRES_USER", "postgres"),
			getEnv("POSTGRES_PASSWORD", "postgres"),
			getEnv("POSTGRES_HOST", "localhost"),
			getEnv("RECOMMENDATION_DB_PORT", "5437"),
			getEnv("RECOMMENDATION_DB_NAME", "recommendation_db"),
		),
		RedisAddr:      fmt.Sprintf("%s:%s", getEnv("REDIS_HOST", "localhost"), getEnv("REDIS_PORT", "6379")),
		RedisPassword:  getEnv("REDIS_PASSWORD", ""),
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
