# Music App — Frontend

> Not yet implemented. This directory is a placeholder for the frontend application.

## Planned Stack

- **Framework:** React (Vite) or Next.js
- **Language:** TypeScript
- **State management:** Zustand or Redux Toolkit
- **HTTP client:** Axios (consuming the api-gateway REST endpoints)
- **Styling:** Tailwind CSS

## API Gateway

The frontend connects to the REST API exposed by `backend/api-gateway` on `http://localhost:8080`.

Key endpoints:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login, receive JWT tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/songs` | List songs |
| GET | `/api/v1/songs/search?q=` | Search songs |
| GET | `/api/v1/playlists` | List user playlists |
| POST | `/api/v1/playlists` | Create playlist |
| POST | `/api/v1/playlists/:id/songs` | Add song to playlist |

## Setup (once implemented)

```bash
cd frontend
npm install
npm run dev
```
