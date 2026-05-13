package config

import (
	"os"
	"time"
)

type Config struct {
	HTTPPort                  string
	AuthServiceAddr           string
	MusicServiceAddr          string
	PlaylistServiceAddr       string
	RecommendationServiceAddr string
	PaymentServiceAddr        string
	RedisAddr                 string
	RedisPass                 string
	OTLPEndpoint              string
	RateLimitRPM              int
	ReadTimeout               time.Duration
	WriteTimeout              time.Duration
}

func Load() *Config {
	return &Config{
		HTTPPort:                  getEnv("GATEWAY_HTTP_PORT", "8080"),
		AuthServiceAddr:           getEnv("AUTH_SERVICE_ADDR", "localhost:50051"),
		MusicServiceAddr:          getEnv("MUSIC_SERVICE_ADDR", "localhost:50052"),
		PlaylistServiceAddr:       getEnv("PLAYLIST_SERVICE_ADDR", "localhost:50053"),
		RecommendationServiceAddr: getEnv("RECOMMENDATION_SERVICE_ADDR", "localhost:50055"),
		PaymentServiceAddr:        getEnv("PAYMENT_SERVICE_ADDR", "localhost:50056"),
		RedisAddr:                 getEnv("REDIS_HOST", "localhost") + ":" + getEnv("REDIS_PORT", "6379"),
		RedisPass:                 getEnv("REDIS_PASSWORD", ""),
		OTLPEndpoint:              getEnv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317"),
		RateLimitRPM:              120,
		ReadTimeout:               10 * time.Second,
		WriteTimeout:              10 * time.Second,
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
