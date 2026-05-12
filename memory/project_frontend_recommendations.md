---
name: project-frontend-recommendations
description: Frontend recommendations UI — architecture decisions, dataset mismatch solution, file map
metadata:
  type: project
---

Feature branch: `feature/frontend-recommendations`

Recommendation service returns Spotify-dataset tracks (metadata only, no audio). Frontend music uses Jamendo (CC audio). **No ID overlap** — enrichment is done by Jamendo name-search at fetch time.

**Key decisions:**
- `recommendation.service.ts` maps TrackProto → Track, then fires `fetchTracks({ search: name, limit: 1 })` per track in parallel (Promise.allSettled) to enrich `coverUrl`/`audioUrl`. Enrichment is best-effort.
- `Track` type extended with optional Spotify audio features (`valence`, `energy`, `danceability`, `tempo`, `acousticness`, `instrumentalness`, `loudness`, `speechiness`, `spotifyId`).
- `recordPlayback` fires fire-and-forget (no await, errors via console.error).
- `TrackCard` gains two new optional props: `showSimilarButton` (default false) and `onPlay` callback. Existing usage unaffected.
- `SimilarTracksModal` rendered inside `TrackCard` return via a Fragment; opened via `setSimilarOpen(true)`.
- Sidebar Discover entry updated: Compass → Sparkles icon, path `/discover` → `/discover/moods`.

**Files created/modified:**
- `frontend/src/types/recommendation.ts` — MoodMeta
- `frontend/src/types/music.ts` — Track extended
- `frontend/src/types/index.ts` — MoodMeta exported
- `frontend/src/services/recommendation.service.ts`
- `frontend/src/services/index.ts` — RecommendationService exported
- `frontend/src/app/router.tsx` — /discover/moods + /discover/moods/:mood routes
- `frontend/src/components/layout/Sidebar.tsx` — Discover nav item updated
- `frontend/src/pages/app/DiscoverMoodsPage.tsx` — mood grid
- `frontend/src/pages/app/MoodDetailPage.tsx` — top tracks + radio tabs
- `frontend/src/components/shared/SimilarTracksModal.tsx` — modal
- `frontend/src/components/shared/TrackCard.tsx` — showSimilarButton + onPlay props

**How to apply:** When continuing this feature, check these files first. [[recommendation-service implementation]]
