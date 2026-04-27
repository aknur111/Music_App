# Music App — Go Microservices

A course project demonstrating a production-style Go microservices architecture for a music streaming platform.

## Services

| Service | Port (gRPC) | Port (HTTP) | Description |
|---|---|---|---|
| api-gateway | — | 8080 | REST entry point, JWT validation, rate limiting |
| auth-service | 50051 | — | Registration, login, token management |
| music-service | 50052 | — | Songs, albums, artists |
| playlist-service | 50053 | — | Playlist CRUD, song association |
| notification-service | 50054 | — | NATS consumer, SMTP email sender |

## Tech Stack

- **Language:** Go 1.22
- **Transport:** gRPC (protobuf), HTTP/REST (Chi)
- **Database:** PostgreSQL (per-service schema)
- **Cache:** Redis
- **Message Queue:** NATS JetStream
- **Migrations:** golang-migrate
- **Observability:** OpenTelemetry → Jaeger, Prometheus → Grafana, Zap → Loki
- **Testing:** testify, gomock, testcontainers-go

## Quick Start

```bash
# Copy environment config
cp .env.example .env

# Start all infrastructure + services
make up

# Run all tests
make test

# Regenerate protobuf stubs
make proto
```

## Architecture

```
Client (HTTP)
    │
    ▼
api-gateway (:8080)
    ├── gRPC → auth-service (:50051)
    ├── gRPC → music-service (:50052)
    └── gRPC → playlist-service (:50053)

auth-service ──NATS──► notification-service (:50054)
playlist-service ──NATS──► notification-service
music-service ──NATS──► notification-service
```

## Project Layout

```
music-app/
├── proto/                  shared .proto definitions
├── api-gateway/
├── auth-service/
├── music-service/
├── playlist-service/
├── notification-service/
├── observability/          Prometheus, Grafana, Loki, OTEL config
├── docker-compose.yml
├── Makefile
└── go.work
```

Each service follows clean architecture:
```
internal/
  domain/         entities + repository interfaces (no external deps)
  usecase/        business logic
  repository/     postgres/redis adapters
  delivery/
    grpc/         gRPC server handlers
    nats/         event publishers / subscribers
  infrastructure/ DB connections, migrations runner
```

## gRPC Endpoints (17 total)

### AuthService
1. `Register` — create user, publish user.registered event
2. `Login` — issue JWT access + refresh tokens
3. `Logout` — blacklist token in Redis
4. `RefreshToken` — rotate refresh token
5. `ValidateToken` — called by gateway on every request
6. `RequestPasswordReset` — publish user.password_reset event

### MusicService
7. `GetSong` — single song (Redis cache-aside)
8. `ListSongs` — paginated song list
9. `SearchSongs` — full-text search
10. `GetAlbum` — album with song list
11. `ListAlbums` — paginated album list

### PlaylistService
12. `CreatePlaylist` — transactional insert
13. `GetPlaylist` — playlist with songs
14. `ListUserPlaylists` — user's playlists (Redis cached)
15. `AddSongToPlaylist` — validates song via music-service gRPC, transactional
16. `RemoveSongFromPlaylist` — transactional delete

### NotificationService
17. `SendDirectEmail` — direct email trigger

## NATS Events

| Subject | Publisher | Consumer |
|---|---|---|
| `music.user.registered` | auth-service | notification-service |
| `music.user.password_reset` | auth-service | notification-service |
| `music.song.uploaded` | music-service | notification-service |
| `music.playlist.song_added` | playlist-service | notification-service |
