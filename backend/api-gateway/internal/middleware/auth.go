package middleware

import (
	"context"
	"net/http"
	"strings"

	"google.golang.org/grpc"
)

type contextKey string

const (
	UserIDKey contextKey = "user_id"
	EmailKey  contextKey = "email"
)

type tokenValidator interface {
	ValidateToken(ctx context.Context, in *validateTokenRequest, opts ...grpc.CallOption) (*validateTokenResponse, error)
}

type validateTokenRequest struct {
	AccessToken string
}

type validateTokenResponse struct {
	Valid   bool
	UserID  string
	Email   string
}

// Auth returns middleware that validates JWT tokens by calling auth-service.
// The conn parameter should be a *authpb.AuthServiceClient — kept as interface
// here to avoid a proto import cycle at the middleware layer.
func Auth(validate func(ctx context.Context, token string) (userID, email string, valid bool)) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := extractBearer(r.Header.Get("Authorization"))
			if token == "" {
				http.Error(w, "missing authorization header", http.StatusUnauthorized)
				return
			}

			userID, email, valid := validate(r.Context(), token)
			if !valid {
				http.Error(w, "invalid or expired token", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), UserIDKey, userID)
			ctx = context.WithValue(ctx, EmailKey, email)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func extractBearer(header string) string {
	if !strings.HasPrefix(header, "Bearer ") {
		return ""
	}
	return strings.TrimPrefix(header, "Bearer ")
}

func GetUserID(ctx context.Context) string {
	if v, ok := ctx.Value(UserIDKey).(string); ok {
		return v
	}
	return ""
}
