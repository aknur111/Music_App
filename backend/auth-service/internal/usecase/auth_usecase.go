package usecase

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/music-app/auth-service/internal/domain/entity"
	"github.com/music-app/auth-service/internal/domain/repository"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserNotFound       = errors.New("user not found")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrTokenInvalid       = errors.New("token invalid or expired")
	ErrEmailTaken         = errors.New("email already registered")
	ErrEmailNotVerified   = errors.New("email not verified")
)

type AuthUsecase interface {
	Register(ctx context.Context, name, email, password string) (*entity.User, error)
	Login(ctx context.Context, email, password string) (accessToken, refreshToken string, expiresAt int64, err error)
	Logout(ctx context.Context, accessToken string) error
	RefreshToken(ctx context.Context, refreshToken string) (newAccess, newRefresh string, expiresAt int64, err error)
	ValidateToken(ctx context.Context, accessToken string) (userID, email string, err error)
	RequestPasswordReset(ctx context.Context, email string) error
	VerifyEmail(ctx context.Context, token string) error
	ResetPassword(ctx context.Context, token, newPassword string) error
	GetProfile(ctx context.Context, userID string) (*entity.User, error)
}

type EventPublisher interface {
	PublishUserRegistered(ctx context.Context, userID, email, name string) error
	PublishPasswordReset(ctx context.Context, userID, email, resetToken string) error
}

type authUsecase struct {
	users      repository.UserRepository
	tokens     repository.RefreshTokenRepository
	blacklist  repository.TokenBlacklist
	publisher  EventPublisher
	jwtSecret  []byte
	accessTTL  time.Duration
	refreshTTL time.Duration
}

func NewAuthUsecase(
	users repository.UserRepository,
	tokens repository.RefreshTokenRepository,
	blacklist repository.TokenBlacklist,
	publisher EventPublisher,
	jwtSecret string,
	accessTTL, refreshTTL time.Duration,
) AuthUsecase {
	return &authUsecase{
		users:      users,
		tokens:     tokens,
		blacklist:  blacklist,
		publisher:  publisher,
		jwtSecret:  []byte(jwtSecret),
		accessTTL:  accessTTL,
		refreshTTL: refreshTTL,
	}
}

func (u *authUsecase) Register(ctx context.Context, name, email, password string) (*entity.User, error) {
	existing, _ := u.users.FindByEmail(ctx, email)
	if existing != nil {
		return nil, ErrEmailTaken
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	verifyToken := uuid.NewString()
	expiry := time.Now().Add(24 * time.Hour).UTC()

	role := "user"
	if adminEmail := os.Getenv("ADMIN_EMAIL"); adminEmail != "" && email == adminEmail {
		role = "admin"
	}

	user := &entity.User{
		ID:                uuid.NewString(),
		Name:              name,
		Email:             email,
		Role:              role,
		PasswordHash:      string(hash),
		EmailVerified:     false,
		EmailVerifyToken:  verifyToken,
		EmailVerifyExpiry: &expiry,
		CreatedAt:         time.Now().UTC(),
		UpdatedAt:         time.Now().UTC(),
	}

	if err := u.users.Create(ctx, user); err != nil {
		return nil, err
	}

	_ = u.publisher.PublishUserRegistered(ctx, user.ID, user.Email, user.Name)
	return user, nil
}

func (u *authUsecase) Login(ctx context.Context, email, password string) (string, string, int64, error) {
	user, err := u.users.FindByEmail(ctx, email)
	if err != nil || user == nil {
		return "", "", 0, ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return "", "", 0, ErrInvalidCredentials
	}

	return u.issueTokenPair(ctx, user)
}

func (u *authUsecase) issueTokenPair(ctx context.Context, user *entity.User) (string, string, int64, error) {
	accessToken, err := u.generateAccessToken(user)
	if err != nil {
		return "", "", 0, err
	}

	rawRefresh := uuid.NewString()
	rt := &entity.RefreshToken{
		ID:        uuid.NewString(),
		UserID:    user.ID,
		TokenHash: sha256Hex(rawRefresh),
		ExpiresAt: time.Now().Add(u.refreshTTL),
		CreatedAt: time.Now().UTC(),
	}
	if err := u.tokens.Save(ctx, rt); err != nil {
		return "", "", 0, err
	}

	return accessToken, rawRefresh, time.Now().Add(u.accessTTL).Unix(), nil
}

func (u *authUsecase) Logout(ctx context.Context, accessToken string) error {
	claims, err := u.parseToken(accessToken)
	if err != nil {
		return ErrTokenInvalid
	}
	jti, _ := claims["jti"].(string)
	exp, _ := claims["exp"].(float64)
	ttl := int64(exp) - time.Now().Unix()
	if ttl <= 0 {
		return nil
	}
	return u.blacklist.Add(ctx, jti, ttl)
}

func (u *authUsecase) RefreshToken(ctx context.Context, rawRefresh string) (string, string, int64, error) {
	lookupHash := sha256Hex(rawRefresh)

	stored, err := u.tokens.FindByHash(ctx, lookupHash)
	if err != nil || stored == nil || time.Now().After(stored.ExpiresAt) {
		return "", "", 0, ErrTokenInvalid
	}

	user, err := u.users.FindByID(ctx, stored.UserID)
	if err != nil || user == nil {
		return "", "", 0, ErrUserNotFound
	}

	_ = u.tokens.DeleteByHash(ctx, lookupHash)
	return u.issueTokenPair(ctx, user)
}

func (u *authUsecase) ValidateToken(ctx context.Context, accessToken string) (string, string, error) {
	claims, err := u.parseToken(accessToken)
	if err != nil {
		return "", "", ErrTokenInvalid
	}

	jti, _ := claims["jti"].(string)
	exists, _ := u.blacklist.Exists(ctx, jti)
	if exists {
		return "", "", ErrTokenInvalid
	}

	userID, _ := claims["sub"].(string)
	email, _ := claims["email"].(string)
	return userID, email, nil
}

func (u *authUsecase) RequestPasswordReset(ctx context.Context, email string) error {
	user, err := u.users.FindByEmail(ctx, email)
	if err != nil || user == nil {
		return nil
	}

	resetToken := uuid.NewString()
	expiry := time.Now().Add(30 * time.Minute).UTC()
	user.PasswordResetToken = resetToken
	user.PasswordResetExpiry = &expiry
	user.UpdatedAt = time.Now().UTC()

	if err := u.users.Update(ctx, user); err != nil {
		return err
	}

	_ = u.publisher.PublishPasswordReset(ctx, user.ID, user.Email, resetToken)
	return nil
}

func (u *authUsecase) VerifyEmail(ctx context.Context, token string) error {
	user, err := u.users.FindByEmailVerifyToken(ctx, token)
	if err != nil || user == nil {
		return ErrTokenInvalid
	}
	if user.EmailVerifyExpiry != nil && time.Now().After(*user.EmailVerifyExpiry) {
		return ErrTokenInvalid
	}

	user.EmailVerified = true
	user.EmailVerifyToken = ""
	user.EmailVerifyExpiry = nil
	user.UpdatedAt = time.Now().UTC()

	return u.users.Update(ctx, user)
}

func (u *authUsecase) ResetPassword(ctx context.Context, token, newPassword string) error {
	user, err := u.users.FindByPasswordResetToken(ctx, token)
	if err != nil || user == nil {
		return ErrTokenInvalid
	}
	if user.PasswordResetExpiry != nil && time.Now().After(*user.PasswordResetExpiry) {
		return ErrTokenInvalid
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user.PasswordHash = string(hash)
	user.PasswordResetToken = ""
	user.PasswordResetExpiry = nil
	user.UpdatedAt = time.Now().UTC()

	_ = u.tokens.DeleteByUserID(ctx, user.ID)

	return u.users.Update(ctx, user)
}

func (u *authUsecase) GetProfile(ctx context.Context, userID string) (*entity.User, error) {
	user, err := u.users.FindByID(ctx, userID)
	if err != nil || user == nil {
		return nil, ErrUserNotFound
	}
	return user, nil
}

func (u *authUsecase) generateAccessToken(user *entity.User) (string, error) {
	role := user.Role
	if role == "" {
		role = "user"
	}
	claims := jwt.MapClaims{
		"sub":   user.ID,
		"email": user.Email,
		"name":  user.Name,
		"role":  role,
		"jti":   uuid.NewString(),
		"exp":   time.Now().Add(u.accessTTL).Unix(),
		"iat":   time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(u.jwtSecret)
}

func (u *authUsecase) parseToken(tokenString string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrTokenInvalid
		}
		return u.jwtSecret, nil
	})
	if err != nil || !token.Valid {
		return nil, ErrTokenInvalid
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, ErrTokenInvalid
	}
	return claims, nil
}

func sha256Hex(s string) string {
	h := sha256.Sum256([]byte(s))
	return hex.EncodeToString(h[:])
}
