package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// Clients holds gRPC client stubs injected at startup.
type Clients struct {
	ValidateToken func(ctx context.Context, token string) (userID, email string, valid bool)
	RegisterUser  func(ctx context.Context, name, email, password string) (userID string, err error)
	LoginUser     func(ctx context.Context, email, password string) (access, refresh string, expiresAt int64, err error)
	LogoutUser    func(ctx context.Context, token string) error
	RefreshToken  func(ctx context.Context, refreshToken string) (access, refresh string, expiresAt int64, err error)
	GetSong       func(ctx context.Context, id string) (interface{}, error)
	ListSongs     func(ctx context.Context, artistID, albumID string, page, limit int) (interface{}, error)
	SearchSongs   func(ctx context.Context, query string, page, limit int) (interface{}, error)
	GetAlbum      func(ctx context.Context, id string) (interface{}, error)
	ListAlbums    func(ctx context.Context, artistID string, page, limit int) (interface{}, error)
	CreatePlaylist func(ctx context.Context, userID, name, desc string) (interface{}, error)
	GetPlaylist    func(ctx context.Context, id, userID string) (interface{}, error)
	ListPlaylists  func(ctx context.Context, userID string, page, limit int) (interface{}, error)
	AddSong        func(ctx context.Context, playlistID, songID, userID string) (int, error)
	RemoveSong     func(ctx context.Context, playlistID, songID, userID string) error
}

func Router(clients *Clients) http.Handler {
	r := chi.NewRouter()

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	// auth (public)
	r.Post("/api/v1/auth/register", registerHandler(clients))
	r.Post("/api/v1/auth/login", loginHandler(clients))
	r.Post("/api/v1/auth/refresh", refreshHandler(clients))

	return r
}

func registerHandler(c *Clients) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if c.RegisterUser == nil {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "registration service unavailable"})
			return
		}

		var req struct {
			Name     string `json:"name"`
			Email    string `json:"email"`
			Password string `json:"password"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
			return
		}
		if req.Name == "" || req.Email == "" || req.Password == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "name, email and password are required"})
			return
		}

		userID, err := c.RegisterUser(r.Context(), req.Name, req.Email, req.Password)
		if err != nil {
			writeGRPCError(w, err)
			return
		}
		writeJSON(w, http.StatusCreated, map[string]string{"user_id": userID})
	}
}

func loginHandler(c *Clients) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if c.LoginUser == nil {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "login service unavailable"})
			return
		}

		var req struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
			return
		}

		access, refresh, expiresAt, err := c.LoginUser(r.Context(), req.Email, req.Password)
		if err != nil {
			writeGRPCError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"access_token":  access,
			"refresh_token": refresh,
			"expires_at":    time.Unix(expiresAt, 0).UTC().Format(time.RFC3339),
		})
	}
}

func refreshHandler(c *Clients) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if c.RefreshToken == nil {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "refresh service unavailable"})
			return
		}

		var req struct {
			RefreshToken string `json:"refresh_token"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
			return
		}

		access, refresh, expiresAt, err := c.RefreshToken(r.Context(), req.RefreshToken)
		if err != nil {
			writeGRPCError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"access_token":  access,
			"refresh_token": refresh,
			"expires_at":    time.Unix(expiresAt, 0).UTC().Format(time.RFC3339),
		})
	}
}

// writeGRPCError maps a gRPC status error to an HTTP JSON response.
func writeGRPCError(w http.ResponseWriter, err error) {
	st, _ := status.FromError(err)
	var code int
	switch st.Code() {
	case codes.AlreadyExists:
		code = http.StatusConflict
	case codes.NotFound:
		code = http.StatusNotFound
	case codes.Unauthenticated:
		code = http.StatusUnauthorized
	case codes.PermissionDenied:
		code = http.StatusForbidden
	case codes.InvalidArgument:
		code = http.StatusBadRequest
	case codes.ResourceExhausted:
		code = http.StatusTooManyRequests
	default:
		code = http.StatusInternalServerError
	}
	writeJSON(w, code, map[string]string{"error": st.Message()})
}

func writeJSON(w http.ResponseWriter, code int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}
