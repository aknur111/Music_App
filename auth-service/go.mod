module github.com/music-app/auth-service

go 1.22

require (
	github.com/golang-jwt/jwt/v5 v5.2.1
	github.com/golang-migrate/migrate/v4 v4.17.1
	github.com/google/uuid v1.6.0
	github.com/jackc/pgx/v5 v5.5.5
	github.com/nats-io/nats.go v1.34.1
	github.com/redis/go-redis/v9 v9.5.1
	github.com/stretchr/testify v1.9.0
	go.opentelemetry.io/otel v1.25.0
	go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc v1.25.0
	go.opentelemetry.io/otel/sdk v1.25.0
	go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc v0.50.0
	go.uber.org/zap v1.27.0
	golang.org/x/crypto v0.22.0
	google.golang.org/grpc v1.63.2
	google.golang.org/protobuf v1.34.0
	github.com/prometheus/client_golang v1.19.0
	github.com/stretchr/mock v0.0.0-20200414221442-81e8c18c0afa
)
