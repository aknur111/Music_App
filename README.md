# Aura — Music Streaming Platform

A full-stack music streaming platform built with Go microservices and a React frontend. The project demonstrates production-style backend architecture: each domain owns its own database, services communicate over gRPC, events flow through NATS JetStream, and the entire stack ships as a single `docker compose up`.

## Architecture

![System Architecture](image/Screenshot%202026-05-15%20at%2011.45.13.png)

---

## Features

**Music**
- Browse and search songs, albums, and artists
- Full-text search backed by PostgreSQL
- Redis cache-aside for individual song lookups
- Audio playback with previous / next track controls

**Playlists**
- Create, update, and delete personal playlists
- Add and remove tracks; collaborator support
- Playlist cache invalidation on mutation

**Recommendations**
- 8 mood categories (happy, sad, energetic, chill, focus, workout, romantic, angry)
- Cosine-similarity ranking over 89,741 seeded Spotify tracks
- **Mood Radio** — 30-track arc: warm-up → peak → cool-down
- **My Wave** — blended personal taste + optional mood bias
- Personal recommendations updated on every playback via weighted moving average
- Similar-track lookup and trending tracks

**Payments & Subscriptions**
- Free / Premium Monthly / Premium Yearly plans
- Local dev mode (instant approval, no external call)
- Halyk ePay sandbox integration (OAuth2 + invoice creation)
- Payment history and active subscription tracking

**Auth**
- JWT access + refresh token rotation
- Token blacklisting in Redis on logout
- Password reset flow via email
- Role-based routing (user / admin)

**Notifications**
- NATS JetStream consumers trigger transactional emails
- Welcome email on registration, password-reset email
- HTML email templates rendered server-side

**Observability**
- Distributed tracing with OpenTelemetry → Jaeger
- Metrics scraping with Prometheus
- Log aggregation with Loki
- Grafana dashboards provisioned from config (auto-loaded on startup)

**Admin panel** (role-gated UI)
- User analytics, track analytics, service health, system metrics

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend language | Go 1.25 |
| Service communication | gRPC / Protocol Buffers |
| HTTP gateway | Chi router |
| Databases | PostgreSQL 16 (one per service) |
| Cache | Redis 7 |
| Message broker | NATS 2.10 JetStream |
| Migrations | golang-migrate |
| Tracing | OpenTelemetry → Jaeger |
| Metrics | Prometheus + Grafana |
| Logging | Uber Zap → Loki |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| State management | Zustand |
| Animations | Framer Motion |
| Containerisation | Docker + Docker Compose |
| Testing | testify, gomock, testcontainers-go |

---

## Services

| Service | gRPC port | Description |
|---|---|---|
| api-gateway | — (HTTP :8080) | REST entry point; JWT validation; routes to all downstream services |
| auth-service | :50051 | Registration, login, logout, token refresh, password reset |
| music-service | :50052 | Songs, albums, artists; Redis cache-aside |
| playlist-service | :50053 | Playlist CRUD, song association, collaborators |
| notification-service | :50054 | NATS consumer; SMTP email delivery |
| recommendation-service | :50055 | Mood, similarity, personal, wave, trending recommendations |
| payment-service | :50056 | Plans, checkout (local/Halyk), subscription lifecycle |

### Infrastructure

| Component | Port | Purpose |
|---|---|---|
| PostgreSQL (auth) | 5436 | auth-service database |
| PostgreSQL (music) | 5433 | music-service database |
| PostgreSQL (playlist) | 5434 | playlist-service database |
| PostgreSQL (notification) | 5435 | notification-service database |
| PostgreSQL (recommendation) | 5437 | recommendation-service database |
| PostgreSQL (payment) | 5438 | payment-service database |
| Redis | 6379 | Token blacklist, song cache, recommendation cache |
| NATS | 4222 | Event bus (JetStream) |
| Jaeger | 16686 | Distributed trace UI |
| Prometheus | 9090 | Metrics scraping |
| Loki | 3100 | Log aggregation |
| Grafana | 3000 | Dashboards (traces, metrics, logs) |

---

## Repository Structure

```
music_app/
├── backend/
│   ├── api-gateway/            REST gateway; all HTTP handlers; JWT middleware
│   ├── auth-service/           User auth; JWT; Redis blacklist; NATS publisher
│   ├── music-service/          Songs, albums, artists; Redis cache; NATS publisher
│   ├── playlist-service/       Playlists; collaborators; NATS publisher
│   ├── notification-service/   NATS consumer; SMTP; HTML templates
│   ├── recommendation-service/ Mood + similarity + personal recs; 89 K track dataset
│   ├── payment-service/        Plans; Halyk/local checkout; subscription management
│   ├── proto/                  Shared .proto definitions (6 services)
│   ├── observability/          Prometheus, Grafana, Loki, OTEL Collector config
│   ├── tests/integration/      Cross-service integration tests
│   ├── docker-compose.yml
│   ├── Makefile
│   └── go.work                 Go workspace (all modules)
├── frontend/
│   ├── src/
│   │   ├── pages/              Route pages (app, admin, auth, billing)
│   │   ├── store/              Zustand stores (auth, player, favorites, subscription)
│   │   ├── services/           API service clients (axios)
│   │   ├── hooks/              useAuth, usePlayer, useDebounce
│   │   ├── layouts/            MainLayout, AdminLayout, AuthLayout
│   │   └── lib/                audioEngine, api client, utilities
│   ├── Dockerfile
│   └── vite.config.ts
├── image/                      Architecture diagram
└── README.md
```

Each backend service follows the same layered layout:

```
internal/
  domain/         Entities and repository interfaces (no framework imports)
  usecase/        Business logic; orchestrates repositories and providers
  repository/     PostgreSQL and Redis adapters
  delivery/
    grpc/         gRPC server handlers
    nats/         Event publishers and subscribers
  infrastructure/ DB pool, migration runner
```

---

## Running Locally

### Prerequisites

- Docker and Docker Compose
- Go 1.25 (only needed to run outside Docker or run tests)
- Node 20 (only needed for local frontend dev)

### 1. Configure environment

```bash
cd backend
cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD, JWT_SECRET, and SMTP_* for emails
```

### 2. Start the full stack

```bash
cd backend
make up
# equivalent to: docker compose up -d --build
```

All services, databases, and observability tools start in dependency order. Migrations run automatically on each service's first boot.

### 3. Seed the recommendation dataset

The recommendation engine requires a Spotify Tracks dataset (~89 K tracks).

1. Download from [Kaggle — Spotify Tracks Dataset](https://www.kaggle.com/datasets/maharshipandya/-spotify-tracks-dataset/data)
2. Save as `backend/recommendation-service/data/spotify_tracks.csv`
3. Run the seeder:

```bash
cd backend
make seed-recommendations
```

Expected: `inserted 89741 tracks (24259 skipped as duplicates)`.

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

The frontend proxies all API calls to `http://localhost:8080` (api-gateway).

### Useful make targets

```bash
make up                # Start all services
make down              # Stop and remove all containers + volumes
make infra-up          # Start only infrastructure (DBs, Redis, NATS, observability)
make test              # Run all unit tests across every service
make test-integration  # Run integration tests (requires Docker)
make test-cover        # Generate per-service HTML coverage reports
make proto             # Regenerate gRPC stubs from .proto files
make lint              # golangci-lint across all services
make build             # Build all service binaries locally
```

---

## Frontend Pages

| Path | Description |
|---|---|
| `/` | Landing / marketing page |
| `/login`, `/register` | Authentication |
| `/forgot-password`, `/reset-password` | Password reset flow |
| `/home` | Dashboard — personal recs, trending |
| `/tracks` | Full track browser |
| `/artists`, `/albums`, `/albums/:id` | Catalogue browsing |
| `/discover/moods` | Mood grid |
| `/discover/moods/:mood` | Mood detail with track list |
| `/wave` | My Wave — personalised stream |
| `/library`, `/playlists/:id` | Personal library and playlist detail |
| `/favorites` | Liked tracks |
| `/premium` | Subscription plans and checkout |
| `/billing/success`, `/billing/failure` | Payment return pages |
| `/admin` | Admin overview (role-gated) |
| `/admin/users`, `/admin/tracks` | User and track analytics |
| `/admin/health`, `/admin/metrics` | Service health and system metrics |

---

## Environment Variables

The single `backend/.env` file is shared across all services via Docker Compose's `env_file` directive.

| Variable | Default | Purpose |
|---|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` | `postgres` | Shared DB credentials |
| `JWT_SECRET` | *(must change)* | HMAC key for JWT signing |
| `JWT_ACCESS_TTL` | `15m` | Access token lifetime |
| `JWT_REFRESH_TTL` | `168h` | Refresh token lifetime |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` | — | Email delivery (Gmail SMTP) |
| `PAYMENT_PROVIDER` | `local` | `local` for dev, `halyk` for sandbox/prod |
| `HALYK_CLIENT_ID` | — | Halyk ePay client ID |
| `HALYK_CLIENT_SECRET` | — | Halyk ePay client secret |
| `HALYK_TERMINAL_ID` | — | Halyk merchant terminal ID |
| `HALYK_CALLBACK_URL` | — | Webhook URL Halyk posts payment results to |
| `FRONTEND_URL` | `http://localhost:5173` | Used by local payment provider for redirects |
| `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD` | `admin` | Grafana login |

---

## gRPC API Surface

### AuthService (:50051)
| RPC | Description |
|---|---|
| `Register` | Create user account; publishes `user.registered` to NATS |
| `Login` | Issue JWT access + refresh token pair |
| `Logout` | Blacklist access token in Redis |
| `RefreshToken` | Rotate the refresh token |
| `ValidateToken` | Verify and decode a token (called by gateway on every request) |
| `RequestPasswordReset` | Publish `user.password_reset` event to NATS |

### MusicService (:50052)
| RPC | Description |
|---|---|
| `GetSong` | Fetch one song (Redis cache-aside, TTL 5 min) |
| `ListSongs` | Paginated song list filtered by artist or album |
| `SearchSongs` | Full-text search |
| `GetAlbum` | Album with its song list |
| `ListAlbums` | Paginated album list |
| `GetArtist` / `ListArtists` / `SearchArtists` | Artist lookup |

### PlaylistService (:50053)
| RPC | Description |
|---|---|
| `CreatePlaylist` | Create a new playlist |
| `GetPlaylist` | Fetch playlist with songs |
| `ListUserPlaylists` | All playlists for a user (Redis cached) |
| `AddSongToPlaylist` | Add track; validates song via music-service |
| `RemoveSongFromPlaylist` | Remove track |
| `UpdatePlaylist` | Rename / re-describe |
| `DeletePlaylist` | Delete playlist |
| `AddCollaborator` | Grant another user edit access |

### RecommendationService (:50055)
| RPC | Description |
|---|---|
| `GetRecommendationsByMood` | Top tracks for a mood via cosine similarity |
| `GetMoodRadio` | 30-track arc playlist (warm-up / peak / cool-down) |
| `GetSimilarTracks` | Tracks closest to a given track's audio features |
| `GetPersonalRecommendations` | Tracks ranked against user's taste profile |
| `GetTrendingTracks` | Most-played tracks globally |
| `GetMyWave` | Blended personal + mood-bias stream |
| `RecordPlayback` | Record a play event; updates taste profile |
| `RateTrack` | Like (5) or dislike (1) a track |

### PaymentService (:50056)
| RPC | Description |
|---|---|
| `GetPlans` | List all active subscription plans |
| `CreateCheckout` | Create a payment and return a checkout URL |
| `GetPayment` | Fetch a specific payment record |
| `ListMyPayments` | All payments for the authenticated user |
| `GetMySubscription` | Current active subscription |
| `HandleCallback` | Process provider webhook (verify + activate subscription) |

### NATS Events
| Subject | Publisher | Consumer |
|---|---|---|
| `music.user.registered` | auth-service | notification-service |
| `music.user.password_reset` | auth-service | notification-service |
| `music.song.uploaded` | music-service | notification-service |
| `music.playlist.song_added` | playlist-service | notification-service |

---

## Observability

All services export OpenTelemetry traces to Jaeger, Prometheus metrics on a `/metrics` endpoint, and structured JSON logs captured by Loki.

| Tool | URL | Credentials |
|---|---|---|
| Grafana | http://localhost:3000 | `admin` / `admin` (configurable) |
| Jaeger | http://localhost:16686 | — |
| Prometheus | http://localhost:9090 | — |
| NATS monitoring | http://localhost:8222 | — |

Grafana dashboards are provisioned automatically on startup from `backend/observability/grafana/`. No manual import is needed.

---

## Payment Flow

### Local / Dev mode (`PAYMENT_PROVIDER=local`)

Checkout completes immediately with a simulated redirect. No external network call is made. Suitable for local development without Halyk credentials.

### Halyk ePay sandbox (`PAYMENT_PROVIDER=halyk`)

1. User selects a plan and POSTs to `POST /api/v1/payments/checkout`
2. payment-service acquires an OAuth2 bearer token from `testoauth.homebank.kz`
3. payment-service POSTs to `testepay.homebank.kz/api/invoice/create` with amount, currency, terminal, and callback URL
4. The returned invoice ID is stored; the user is redirected to `test-epay.homebank.kz/?invoice=<id>`
5. After the user pays, Halyk POSTs to `HALYK_CALLBACK_URL`
6. payment-service verifies the payment status, cancels any previous subscription, and creates a new active one

The callback URL must be publicly reachable (e.g. via ngrok) when testing against the Halyk sandbox.

---

## Recommendation Flow

The recommendation-service holds 89,741 unique tracks seeded from a Spotify audio-features dataset. Each track carries continuous audio attributes: valence, energy, danceability, tempo, acousticness, instrumentalness, loudness, speechiness.

**Mood matching** maps each of the 8 moods to a target feature vector. Candidate tracks are fetched from Postgres filtered by a minimum popularity threshold, then re-ranked in Go using cosine similarity.

**Personal recommendations** maintain a per-user taste profile stored as the weighted moving average of the audio features of every track the user has played. On each playback event (`RecordPlayback`), the profile is updated atomically in a single SQL upsert.

**My Wave** blends the personal profile (60 %) with an optional mood bias vector (40 %) and runs cosine similarity over the full catalogue, excluding recently played tracks.

**Mood Radio** builds a 30-track arc:
- 10 warm-up tracks — mid-similarity, ascending similarity order
- 10 peak tracks — highest similarity, ranked by popularity
- 10 cool-down tracks — mid-similarity, descending similarity order

Results at each layer are cached in Redis (mood top-100 at 1-hour TTL; personal recs invalidated on each play).

---

## Engineering Highlights

- **True service isolation** — each service has its own PostgreSQL database, its own Go module, and its own Docker image. There are no shared database schemas.
- **go.work workspace** — all services share a single workspace for consistent tooling while keeping independent `go.mod` files.
- **Context-propagated tracing** — every gRPC call and outbound HTTP request carries an OpenTelemetry span, giving end-to-end trace visibility in Jaeger from a single browser request.
- **Dual payment provider** — a pluggable `Provider` interface allows switching between the local stub and Halyk ePay at runtime via a single environment variable, with no code change required.
- **Cosine similarity in Go** — the recommendation engine performs vector ranking in-process (no ML runtime dependency). The dataset lives in Postgres; the maths runs in the service.
- **Testcontainers integration tests** — repository-layer tests spin up real Postgres containers, run migrations, and exercise actual SQL — no in-memory fakes.
- **Grafana auto-provisioning** — all dashboards and data sources are declared as YAML and loaded at container start, so monitoring is live immediately after `make up`.

---

## Known Limitations

- `music.track.played` NATS event is not yet emitted by music-service. Use the `RecordPlayback` gRPC endpoint directly as a workaround.
- Sad and angry moods return less-extreme tracks than intended because the dataset has few popular tracks with very low valence. Result quality improves with lower popularity thresholds.
- Halyk callback requires a public URL; local sandbox testing requires a tunnel (e.g. ngrok).
- No collaborative filtering — recommendations are purely audio-feature-based.
- No genre affinity per mood — `GetCandidatesForMood` filters only by popularity, not genre.
- Email delivery requires valid SMTP credentials; the notification-service logs and skips delivery if SMTP is unconfigured.

---

## Future Improvements

- Emit `music.track.played` from music-service so recommendation profiles update via events rather than direct gRPC calls
- Add collaborative filtering (neighbourhood-based or matrix factorisation) once sufficient play history accumulates
- Genre-aware mood matching using the `genre` column in the recommendation dataset
- Kubernetes manifests for production deployment
- CI/CD pipeline (GitHub Actions) with per-service test and build jobs
- Rate limiting per user at the api-gateway layer
- WebSocket or SSE for real-time "now playing" and notification delivery
