package config

import (
	"fmt"
	"os"
)

type Config struct {
	GRPCPort       string
	PostgresDSN    string
	NatsURL        string
	OTLPEndpoint   string
	MigrationsPath string

	ProviderID  string
	FrontendURL string

	HalykOAuthURL     string
	HalykAPIURL       string
	HalykPortalURL    string
	HalykClientID     string
	HalykClientSecret string
	HalykTerminalID   string
	HalykCallbackURL  string
}

func Load() *Config {
	return &Config{
		GRPCPort: getEnv("PAYMENT_GRPC_PORT", "50056"),
		PostgresDSN: fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
			getEnv("POSTGRES_USER", "postgres"),
			getEnv("POSTGRES_PASSWORD", "postgres"),
			getEnv("POSTGRES_HOST", "localhost"),
			getEnv("PAYMENT_DB_PORT", "5432"),
			getEnv("PAYMENT_DB_NAME", "payment_db"),
		),
		NatsURL:        getEnv("NATS_URL", "nats://localhost:4222"),
		OTLPEndpoint:   getEnv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317"),
		MigrationsPath: getEnv("MIGRATIONS_PATH", "migrations"),

		ProviderID:  getEnv("PAYMENT_PROVIDER", "local"),
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:5173"),

		HalykOAuthURL:     getEnv("HALYK_OAUTH_URL", "https://testoauth.homebank.kz/epay2/oauth2/token"),
		HalykAPIURL:       getEnv("HALYK_API_URL", "https://testepay.homebank.kz"),
		HalykPortalURL:    getEnv("HALYK_PORTAL_URL", "https://test-epay.homebank.kz"),
		HalykClientID:     getEnv("HALYK_CLIENT_ID", ""),
		HalykClientSecret: getEnv("HALYK_CLIENT_SECRET", ""),
		HalykTerminalID:   getEnv("HALYK_TERMINAL_ID", ""),
		HalykCallbackURL:  getEnv("HALYK_CALLBACK_URL", ""),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
