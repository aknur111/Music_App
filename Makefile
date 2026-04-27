.PHONY: proto up down test test-unit test-integration migrate lint tidy

SERVICES := auth-service music-service playlist-service notification-service api-gateway
PROTO_DIR := proto
PROTO_OUT := .

# ── Protobuf ────────────────────────────────────────────────────────────────
proto:
	@echo "Generating protobuf stubs..."
	@for svc in auth music playlist notification; do \
		protoc \
			--go_out=$(PROTO_OUT) \
			--go_opt=paths=source_relative \
			--go-grpc_out=$(PROTO_OUT) \
			--go-grpc_opt=paths=source_relative \
			-I $(PROTO_DIR) \
			$(PROTO_DIR)/$$svc/$$svc.proto; \
	done
	@echo "Done."

# ── Docker ──────────────────────────────────────────────────────────────────
up:
	docker compose up -d --build

down:
	docker compose down -v

infra-up:
	docker compose up -d postgres-auth postgres-music postgres-playlist postgres-notification redis nats jaeger prometheus loki grafana

infra-down:
	docker compose down postgres-auth postgres-music postgres-playlist postgres-notification redis nats jaeger prometheus loki grafana

# ── Migrations ──────────────────────────────────────────────────────────────
migrate-up:
	@for svc in auth-service music-service playlist-service notification-service; do \
		echo "Running migrations for $$svc..."; \
		$(MAKE) -C $$svc migrate-up; \
	done

migrate-down:
	@for svc in auth-service music-service playlist-service notification-service; do \
		echo "Rolling back migrations for $$svc..."; \
		$(MAKE) -C $$svc migrate-down; \
	done

# ── Testing ─────────────────────────────────────────────────────────────────
test:
	go test ./... -v -count=1

test-unit:
	go test ./... -v -count=1 -short

test-integration:
	go test ./tests/integration/... -v -count=1 -tags=integration

test-cover:
	go test ./... -coverprofile=coverage.out
	go tool cover -html=coverage.out -o coverage.html

# ── Code Quality ─────────────────────────────────────────────────────────────
lint:
	golangci-lint run ./...

tidy:
	@for svc in $(SERVICES); do \
		echo "Tidying $$svc..."; \
		cd $$svc && go mod tidy && cd ..; \
	done
	go work sync

fmt:
	gofmt -w ./...

vet:
	@for svc in $(SERVICES); do \
		echo "Vetting $$svc..."; \
		cd $$svc && go vet ./... && cd ..; \
	done

# ── Build ────────────────────────────────────────────────────────────────────
build:
	@for svc in $(SERVICES); do \
		echo "Building $$svc..."; \
		cd $$svc && go build -o bin/$$svc ./cmd/... && cd ..; \
	done

# ── Mock generation ──────────────────────────────────────────────────────────
mocks:
	@echo "Generating mocks..."
	@for svc in auth-service music-service playlist-service notification-service; do \
		cd $$svc && go generate ./... && cd ..; \
	done

help:
	@echo ""
	@echo "Available targets:"
	@echo "  proto              Regenerate gRPC stubs from .proto files"
	@echo "  up                 Start all services with docker compose"
	@echo "  down               Stop and remove all containers + volumes"
	@echo "  infra-up           Start only infrastructure (postgres, redis, nats, observability)"
	@echo "  migrate-up         Run all service migrations"
	@echo "  migrate-down       Roll back all service migrations"
	@echo "  test               Run all tests"
	@echo "  test-unit          Run unit tests only"
	@echo "  test-integration   Run integration tests"
	@echo "  test-cover         Generate coverage report"
	@echo "  lint               Run golangci-lint"
	@echo "  tidy               Run go mod tidy for all services"
	@echo "  build              Build all service binaries"
	@echo "  mocks              Regenerate gomock mocks"
	@echo ""
