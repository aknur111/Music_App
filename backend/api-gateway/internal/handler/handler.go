package handler

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// Clients holds gRPC client stubs injected at startup.
// The concrete types are the generated pb.*ServiceClient types;
// using interfaces here avoids importing generated code into this package.
type Clients struct {
	ValidateToken   func(ctx context.Context, token string) (userID, email string, valid bool)
	RegisterUser    func(ctx context.Context, name, email, password string) (userID string, err error)
	LoginUser       func(ctx context.Context, email, password string) (access, refresh string, expiresAt int64, err error)
	LogoutUser      func(ctx context.Context, token string) error
	RefreshToken    func(ctx context.Context, refreshToken string) (access, refresh string, expiresAt int64, err error)
	GetSong         func(ctx context.Context, id string) (interface{}, error)
	ListSongs       func(ctx context.Context, artistID, albumID string, page, limit int) (interface{}, error)
	SearchSongs     func(ctx context.Context, query string, page, limit int) (interface{}, error)
	GetAlbum        func(ctx context.Context, id string) (interface{}, error)
	ListAlbums      func(ctx context.Context, artistID string, page, limit int) (interface{}, error)
	CreatePlaylist  func(ctx context.Context, userID, name, desc string) (interface{}, error)
	GetPlaylist     func(ctx context.Context, id, userID string) (interface{}, error)
	ListPlaylists   func(ctx context.Context, userID string, page, limit int) (interface{}, error)
	AddSong         func(ctx context.Context, playlistID, songID, userID string) (int, error)
	RemoveSong      func(ctx context.Context, playlistID, songID, userID string) error
}

func Router(clients *Clients) http.Handler {
	r := chi.NewRouter()

	// health
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	// auth (public)
	r.Post("/api/v1/auth/register", registerHandler(clients))
	r.Post("/api/v1/auth/login", loginHandler(clients))
	r.Post("/api/v1/auth/refresh", refreshHandler(clients))

	// protected routes are added in main with Auth middleware applied
	return r
}

func registerHandler(c *Clients) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Name     string `json:"name"`
			Email    string `json:"email"`
			Password string `json:"password"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		userID, err := c.RegisterUser(r.Context(), req.Name, req.Email, req.Password)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		writeJSON(w, http.StatusCreated, map[string]string{"user_id": userID})
	}
}

func loginHandler(c *Clients) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		access, refresh, expiresAt, err := c.LoginUser(r.Context(), req.Email, req.Password)
		if err != nil {
			http.Error(w, "invalid credentials", http.StatusUnauthorized)
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"access_token":  access,
			"refresh_token": refresh,
			"expires_at":    expiresAt,
		})
	}
}

func refreshHandler(c *Clients) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			RefreshToken string `json:"refresh_token"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		access, refresh, expiresAt, err := c.RefreshToken(r.Context(), req.RefreshToken)
		if err != nil {
			http.Error(w, "invalid refresh token", http.StatusUnauthorized)
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"access_token":  access,
			"refresh_token": refresh,
			"expires_at":    expiresAt,
		})
	}
}

func writeJSON(w http.ResponseWriter, code int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}
