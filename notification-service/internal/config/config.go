package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	GRPCPort       string
	PostgresDSN    string
	NatsURL        string
	OTLPEndpoint   string
	MigrationsPath string
	SMTPHost       string
	SMTPPort       int
	SMTPUser       string
	SMTPPassword   string
	SMTPFrom       string
}

func Load() *Config {
	smtpPort, _ := strconv.Atoi(getEnv("SMTP_PORT", "587"))
	return &Config{
		GRPCPort: getEnv("NOTIFICATION_GRPC_PORT", "50054"),
		PostgresDSN: fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
			getEnv("POSTGRES_USER", "postgres"),
			getEnv("POSTGRES_PASSWORD", "postgres"),
			getEnv("POSTGRES_HOST", "localhost"),
			getEnv("NOTIFICATION_DB_PORT", "5435"),
			getEnv("NOTIFICATION_DB_NAME", "notification_db"),
		),
		NatsURL:        getEnv("NATS_URL", "nats://localhost:4222"),
		OTLPEndpoint:   getEnv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317"),
		MigrationsPath: getEnv("MIGRATIONS_PATH", "migrations"),
		SMTPHost:       getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:       smtpPort,
		SMTPUser:       getEnv("SMTP_USER", ""),
		SMTPPassword:   getEnv("SMTP_PASSWORD", ""),
		SMTPFrom:       getEnv("SMTP_FROM", "Music App <no-reply@musicapp.dev>"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
