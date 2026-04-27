module github.com/music-app/api-gateway

go 1.22

require (
	github.com/go-chi/chi/v5 v5.0.12
	github.com/redis/go-redis/v9 v9.5.1
	github.com/stretchr/testify v1.9.0
	go.opentelemetry.io/otel v1.25.0
	go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc v1.25.0
	go.opentelemetry.io/otel/sdk v1.25.0
	go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc v0.50.0
	go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp v0.50.0
	go.uber.org/zap v1.27.0
	google.golang.org/grpc v1.63.2
	google.golang.org/protobuf v1.34.0
	github.com/prometheus/client_golang v1.19.0
)
