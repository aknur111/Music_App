.PHONY: proto proto-recommendation proto-payment up down test test-unit test-integration migrate lint tidy fmt vet build mocks seed-recommendations help

SERVICES := auth-service music-service playlist-service notification-service recommendation-service api-gateway
PROTO_DIR := proto
GOPATH_BIN := $(shell go env GOPATH)/bin
export PATH := $(GOPATH_BIN):$(PATH)

proto:
	@echo "Generating protobuf stubs..."
	@mkdir -p auth-service/gen/auth music-service/gen/music playlist-service/gen/playlist notification-service/gen/notification
	protoc \
		--go_out=auth-service/gen \
		--go_opt=paths=source_relative \
		--go-grpc_out=auth-service/gen \
		--go-grpc_opt=paths=source_relative \
		-I $(PROTO_DIR) \
		$(PROTO_DIR)/auth/auth.proto
	protoc \
		--go_out=music-service/gen \
		--go_opt=paths=source_relative \
		--go-grpc_out=music-service/gen \
		--go-grpc_opt=paths=source_relative \
		-I $(PROTO_DIR) \
		$(PROTO_DIR)/music/music.proto
	protoc \
		--go_out=playlist-service/gen \
		--go_opt=paths=source_relative \
		--go-grpc_out=playlist-service/gen \
		--go-grpc_opt=paths=source_relative \
		-I $(PROTO_DIR) \
		$(PROTO_DIR)/playlist/playlist.proto
	protoc \
		--go_out=notification-service/gen \
		--go_opt=paths=source_relative \
		--go-grpc_out=notification-service/gen \
		--go-grpc_opt=paths=source_relative \
		-I $(PROTO_DIR) \
		$(PROTO_DIR)/notification/notification.proto
	@$(MAKE) proto-recommendation
	@$(MAKE) proto-payment
	@echo "Done."

proto-recommendation:
	@echo "Generating recommendation protobuf stubs..."
	@mkdir -p recommendation-service/gen/recommendation
	protoc \
		--go_out=recommendation-service/gen \
		--go_opt=paths=source_relative \
		--go-grpc_out=recommendation-service/gen \
		--go-grpc_opt=paths=source_relative \
		-I $(PROTO_DIR) \
		$(PROTO_DIR)/recommendation/recommendation.proto

proto-payment:
	@echo "Generating payment protobuf stubs..."
	@mkdir -p payment-service/gen/payment
	protoc \
		--go_out=payment-service/gen \
		--go_opt=paths=source_relative \
		--go-grpc_out=payment-service/gen \
		--go-grpc_opt=paths=source_relative \
		-I $(PROTO_DIR) \
		$(PROTO_DIR)/payment/payment.proto

up:
	docker compose up -d --build

down:
	docker compose down -v

infra-up:
	docker compose up -d postgres-auth postgres-music postgres-playlist postgres-notification postgres-recommendation redis nats jaeger prometheus loki grafana

infra-down:
	docker compose stop postgres-auth postgres-music postgres-playlist postgres-notification postgres-recommendation redis nats jaeger prometheus loki grafana

migrate-up:
	@for svc in auth-service music-service playlist-service notification-service recommendation-service; do \
		echo "Running migrations for $$svc..."; \
		(cd $$svc && go run ./cmd/... -migrate-only) || true; \
	done

migrate-down:
	@echo "Run per-service: cd <service> && migrate -path migrations -database <DSN> down"

test:
	@for svc in $(SERVICES); do \
		echo "Testing $$svc..."; \
		(cd $$svc && go test ./... -v -count=1) || exit 1; \
	done

test-unit:
	@for svc in $(SERVICES); do \
		echo "Testing (unit) $$svc..."; \
		(cd $$svc && go test ./... -v -count=1 -short) || exit 1; \
	done

test-integration:
	(cd tests/integration && go test ./... -v -count=1 -tags=integration)
	@echo "Running per-service integration tests..."
	(cd notification-service && go test -tags=integration -v -count=1 ./...)
	(cd recommendation-service && go test -tags=integration -v -count=1 ./...)

test-cover:
	@for svc in $(SERVICES); do \
		(cd $$svc && go test ./... -coverprofile=coverage.out && go tool cover -html=coverage.out -o coverage.html) || true; \
	done

lint:
	@for svc in $(SERVICES); do \
		echo "Linting $$svc..."; \
		(cd $$svc && golangci-lint run ./...) || exit 1; \
	done

tidy:
	@for svc in $(SERVICES); do \
		echo "Tidying $$svc..."; \
		(cd $$svc && go mod tidy) || exit 1; \
	done
	(cd tests/integration && go mod tidy) || true
	go work sync

fmt:
	@for svc in $(SERVICES); do \
		(cd $$svc && gofmt -w .); \
	done

vet:
	@for svc in $(SERVICES); do \
		echo "Vetting $$svc..."; \
		(cd $$svc && go vet ./...) || exit 1; \
	done

build:
	@for svc in $(SERVICES); do \
		echo "Building $$svc..."; \
		(cd $$svc && mkdir -p bin && go build -o bin/$$svc ./cmd/...) || exit 1; \
	done

seed-recommendations:
	@echo "Seeding recommendation-service tracks from CSV..."
	(cd recommendation-service && go run ./cmd/seed/...)

mocks:
	@echo "Generating mocks..."
	@for svc in auth-service music-service playlist-service notification-service; do \
		(cd $$svc && go generate ./...); \
	done

help:
	@echo ""
	@echo "Available targets:"
	@echo "  proto              Regenerate gRPC stubs from .proto files"
	@echo "  up                 Start all services with docker compose"
	@echo "  down               Stop and remove all containers + volumes"
	@echo "  infra-up           Start only infrastructure (postgres, redis, nats, observability)"
	@echo "  test               Run all unit tests"
	@echo "  test-integration   Run integration tests (needs docker)"
	@echo "  test-cover         Generate coverage report per service"
	@echo "  lint               Run golangci-lint"
	@echo "  tidy               Run go mod tidy for all services"
	@echo "  build              Build all service binaries"
	@echo "  mocks              Regenerate gomock mocks"
	@echo ""
