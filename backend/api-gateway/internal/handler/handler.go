package handler

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"github.com/music-app/api-gateway/internal/middleware"
)

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

	GetRecommendationsByMood   func(ctx context.Context, mood string, limit int32) (interface{}, error)
	GetMoodRadio               func(ctx context.Context, mood string) (interface{}, error)
	GetSimilarTracks           func(ctx context.Context, trackID string, limit int32) (interface{}, error)
	GetPersonalRecommendations func(ctx context.Context, userID string, limit int32) (interface{}, error)
	RecordPlayback             func(ctx context.Context, userID, trackID string) error
}

func Router(clients *Clients) http.Handler {
	r := chi.NewRouter()

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	r.Handle("/metrics", promhttp.Handler())

	r.Post("/api/v1/auth/register", registerHandler(clients))
	r.Post("/api/v1/auth/login", loginHandler(clients))
	r.Post("/api/v1/auth/refresh", refreshHandler(clients))
	r.Get("/api/v1/auth/profile", profileHandler(clients))

	authMw := middleware.Auth(clients.ValidateToken)

	// ── Music endpoints ───────────────────────────────────────────────────────
	r.With(authMw).Get("/api/v1/songs", listSongsHandler(clients))
	r.With(authMw).Get("/api/v1/songs/search", searchSongsHandler(clients))
	r.With(authMw).Get("/api/v1/songs/{song_id}", getSongHandler(clients))
	r.With(authMw).Get("/api/v1/albums", listAlbumsHandler(clients))
	r.With(authMw).Get("/api/v1/albums/{album_id}", getAlbumHandler(clients))

	// ── Playlist endpoints ────────────────────────────────────────────────────
	r.With(authMw).Post("/api/v1/playlists", createPlaylistHandler(clients))
	r.With(authMw).Get("/api/v1/playlists", listPlaylistsHandler(clients))
	r.With(authMw).Get("/api/v1/playlists/{playlist_id}", getPlaylistHandler(clients))
	r.With(authMw).Post("/api/v1/playlists/{playlist_id}/songs", addSongHandler(clients))
	r.With(authMw).Delete("/api/v1/playlists/{playlist_id}/songs/{song_id}", removeSongHandler(clients))

	// ── Recommendation endpoints ──────────────────────────────────────────────
	r.Route("/api/v1/recommendations", func(r chi.Router) {
		r.Use(authMw)
		r.Get("/moods", listMoodsHandler())
		r.Get("/moods/{mood}", recommendByMoodHandler(clients))
		r.Get("/moods/{mood}/radio", moodRadioHandler(clients))
		r.Get("/similar/{track_id}", similarTracksHandler(clients))
		r.Get("/personal", personalRecsHandler(clients))
		r.Post("/playback", recordPlaybackHandler(clients))
	})

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

func profileHandler(c *Clients) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if len(authHeader) < 8 || !strings.EqualFold(authHeader[:7], "bearer ") {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "missing or invalid token"})
			return
		}
		token := authHeader[7:]

		userID, email, valid := c.ValidateToken(r.Context(), token)
		if !valid {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid or expired token"})
			return
		}

		claims := parseJWTPayload(token)
		role, _ := claims["role"].(string)
		if role == "" {
			role = "user"
		}
		name, _ := claims["name"].(string)
		if name == "" {
			name = email
		}
		iat, _ := claims["iat"].(float64)
		createdAt := time.Unix(int64(iat), 0).UTC().Format(time.RFC3339)

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"id":         userID,
			"username":   name,
			"email":      email,
			"role":       role,
			"created_at": createdAt,
			"updated_at": createdAt,
		})
	}
}

func parseJWTPayload(token string) map[string]interface{} {
	parts := strings.SplitN(token, ".", 3)
	if len(parts) != 3 {
		return nil
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil
	}
	var claims map[string]interface{}
	_ = json.Unmarshal(payload, &claims)
	return claims
}

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

// ── Recommendation handlers ───────────────────────────────────────────────────

var moodMeta = []map[string]string{
	{"key": "happy", "name": "Happy", "emoji": "😊", "description": "Bright and bouncy"},
	{"key": "sad", "name": "Sad", "emoji": "😔", "description": "Quiet reflection"},
	{"key": "energetic", "name": "Energetic", "emoji": "⚡", "description": "Pump up the volume"},
	{"key": "chill", "name": "Chill", "emoji": "🌊", "description": "Calm and easy"},
	{"key": "focus", "name": "Focus", "emoji": "🎯", "description": "Distraction-free work"},
	{"key": "workout", "name": "Workout", "emoji": "💪", "description": "High-intensity drive"},
	{"key": "romantic", "name": "Romantic", "emoji": "💕", "description": "Warm and tender"},
	{"key": "angry", "name": "Angry", "emoji": "🔥", "description": "Fast and aggressive"},
}

func listMoodsHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]interface{}{"moods": moodMeta})
	}
}

func recommendByMoodHandler(c *Clients) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if c.GetRecommendationsByMood == nil {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "recommendations unavailable"})
			return
		}
		mood := chi.URLParam(r, "mood")
		tracks, err := c.GetRecommendationsByMood(r.Context(), mood, int32(parseLimit(r, 20)))
		if err != nil {
			writeGRPCError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"tracks": tracks})
	}
}

func moodRadioHandler(c *Clients) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if c.GetMoodRadio == nil {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "recommendations unavailable"})
			return
		}
		mood := chi.URLParam(r, "mood")
		tracks, err := c.GetMoodRadio(r.Context(), mood)
		if err != nil {
			writeGRPCError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"tracks": tracks})
	}
}

func similarTracksHandler(c *Clients) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if c.GetSimilarTracks == nil {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "recommendations unavailable"})
			return
		}
		trackID := chi.URLParam(r, "track_id")
		tracks, err := c.GetSimilarTracks(r.Context(), trackID, int32(parseLimit(r, 20)))
		if err != nil {
			writeGRPCError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"tracks": tracks})
	}
}

func personalRecsHandler(c *Clients) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if c.GetPersonalRecommendations == nil {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "recommendations unavailable"})
			return
		}
		userID := middleware.GetUserID(r.Context())
		tracks, err := c.GetPersonalRecommendations(r.Context(), userID, int32(parseLimit(r, 20)))
		if err != nil {
			writeGRPCError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"tracks": tracks})
	}
}

func recordPlaybackHandler(c *Clients) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if c.RecordPlayback == nil {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "recommendations unavailable"})
			return
		}
		userID := middleware.GetUserID(r.Context())
		var body struct {
			TrackID string `json:"track_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.TrackID == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "track_id is required"})
			return
		}
		if err := c.RecordPlayback(r.Context(), userID, body.TrackID); err != nil {
			writeGRPCError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "recorded"})
	}
}

func parseLimit(r *http.Request, defaultVal int) int {
	s := r.URL.Query().Get("limit")
	if s == "" {
		return defaultVal
	}
	n, err := strconv.Atoi(s)
	if err != nil || n <= 0 {
		return defaultVal
	}
	return n
}

func parsePage(r *http.Request) int {
	s := r.URL.Query().Get("page")
	n, err := strconv.Atoi(s)
	if err != nil || n < 1 {
		return 1
	}
	return n
}

// ── Music handlers ────────────────────────────────────────────────────────────

func getSongHandler(c *Clients) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if c.GetSong == nil {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "music service unavailable"})
			return
		}
		id := chi.URLParam(r, "song_id")
		song, err := c.GetSong(r.Context(), id)
		if err != nil {
			writeGRPCError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, song)
	}
}

func listSongsHandler(c *Clients) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if c.ListSongs == nil {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "music service unavailable"})
			return
		}
		artistID := r.URL.Query().Get("artist_id")
		albumID := r.URL.Query().Get("album_id")
		result, err := c.ListSongs(r.Context(), artistID, albumID, parsePage(r), parseLimit(r, 20))
		if err != nil {
			writeGRPCError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, result)
	}
}

func searchSongsHandler(c *Clients) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if c.SearchSongs == nil {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "music service unavailable"})
			return
		}
		query := r.URL.Query().Get("q")
		if query == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "q is required"})
			return
		}
		result, err := c.SearchSongs(r.Context(), query, parsePage(r), parseLimit(r, 20))
		if err != nil {
			writeGRPCError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, result)
	}
}

func getAlbumHandler(c *Clients) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if c.GetAlbum == nil {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "music service unavailable"})
			return
		}
		id := chi.URLParam(r, "album_id")
		album, err := c.GetAlbum(r.Context(), id)
		if err != nil {
			writeGRPCError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, album)
	}
}

func listAlbumsHandler(c *Clients) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if c.ListAlbums == nil {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "music service unavailable"})
			return
		}
		artistID := r.URL.Query().Get("artist_id")
		result, err := c.ListAlbums(r.Context(), artistID, parsePage(r), parseLimit(r, 20))
		if err != nil {
			writeGRPCError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, result)
	}
}

// ── Playlist handlers ─────────────────────────────────────────────────────────

func createPlaylistHandler(c *Clients) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if c.CreatePlaylist == nil {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "playlist service unavailable"})
			return
		}
		userID := middleware.GetUserID(r.Context())
		var body struct {
			Name        string `json:"name"`
			Description string `json:"description"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Name == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "name is required"})
			return
		}
		playlist, err := c.CreatePlaylist(r.Context(), userID, body.Name, body.Description)
		if err != nil {
			writeGRPCError(w, err)
			return
		}
		writeJSON(w, http.StatusCreated, playlist)
	}
}

func getPlaylistHandler(c *Clients) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if c.GetPlaylist == nil {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "playlist service unavailable"})
			return
		}
		id := chi.URLParam(r, "playlist_id")
		userID := middleware.GetUserID(r.Context())
		playlist, err := c.GetPlaylist(r.Context(), id, userID)
		if err != nil {
			writeGRPCError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, playlist)
	}
}

func listPlaylistsHandler(c *Clients) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if c.ListPlaylists == nil {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "playlist service unavailable"})
			return
		}
		userID := middleware.GetUserID(r.Context())
		result, err := c.ListPlaylists(r.Context(), userID, parsePage(r), parseLimit(r, 20))
		if err != nil {
			writeGRPCError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, result)
	}
}

func addSongHandler(c *Clients) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if c.AddSong == nil {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "playlist service unavailable"})
			return
		}
		playlistID := chi.URLParam(r, "playlist_id")
		userID := middleware.GetUserID(r.Context())
		var body struct {
			SongID string `json:"song_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.SongID == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "song_id is required"})
			return
		}
		position, err := c.AddSong(r.Context(), playlistID, body.SongID, userID)
		if err != nil {
			writeGRPCError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"position": position})
	}
}

func removeSongHandler(c *Clients) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if c.RemoveSong == nil {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "playlist service unavailable"})
			return
		}
		playlistID := chi.URLParam(r, "playlist_id")
		songID := chi.URLParam(r, "song_id")
		userID := middleware.GetUserID(r.Context())
		if err := c.RemoveSong(r.Context(), playlistID, songID, userID); err != nil {
			writeGRPCError(w, err)
			return
		}
		writeJSON(w, http.StatusNoContent, nil)
	}
}
