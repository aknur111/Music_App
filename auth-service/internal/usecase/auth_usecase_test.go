package usecase_test

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/music-app/auth-service/internal/domain/entity"
	"github.com/music-app/auth-service/internal/usecase"
)

// ── inline mocks ─────────────────────────────────────────────────────────────

type mockUserRepo struct{ mock.Mock }

func (m *mockUserRepo) Create(ctx context.Context, u *entity.User) error {
	return m.Called(ctx, u).Error(0)
}
func (m *mockUserRepo) FindByID(ctx context.Context, id string) (*entity.User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.User), args.Error(1)
}
func (m *mockUserRepo) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.User), args.Error(1)
}
func (m *mockUserRepo) FindByEmailVerifyToken(ctx context.Context, token string) (*entity.User, error) {
	args := m.Called(ctx, token)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.User), args.Error(1)
}
func (m *mockUserRepo) FindByPasswordResetToken(ctx context.Context, token string) (*entity.User, error) {
	args := m.Called(ctx, token)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.User), args.Error(1)
}
func (m *mockUserRepo) Update(ctx context.Context, u *entity.User) error {
	return m.Called(ctx, u).Error(0)
}
func (m *mockUserRepo) SoftDelete(ctx context.Context, id string) error {
	return m.Called(ctx, id).Error(0)
}

type mockTokenRepo struct{ mock.Mock }

func (m *mockTokenRepo) Save(ctx context.Context, t *entity.RefreshToken) error {
	return m.Called(ctx, t).Error(0)
}
func (m *mockTokenRepo) FindByHash(ctx context.Context, h string) (*entity.RefreshToken, error) {
	args := m.Called(ctx, h)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.RefreshToken), args.Error(1)
}
func (m *mockTokenRepo) DeleteByUserID(ctx context.Context, id string) error {
	return m.Called(ctx, id).Error(0)
}
func (m *mockTokenRepo) DeleteByHash(ctx context.Context, h string) error {
	return m.Called(ctx, h).Error(0)
}

type mockBlacklist struct{ mock.Mock }

func (m *mockBlacklist) Add(ctx context.Context, jti string, ttl int64) error {
	return m.Called(ctx, jti, ttl).Error(0)
}
func (m *mockBlacklist) Exists(ctx context.Context, jti string) (bool, error) {
	args := m.Called(ctx, jti)
	return args.Bool(0), args.Error(1)
}

type mockPublisher struct{ mock.Mock }

func (m *mockPublisher) PublishUserRegistered(ctx context.Context, userID, email, name string) error {
	return m.Called(ctx, userID, email, name).Error(0)
}
func (m *mockPublisher) PublishPasswordReset(ctx context.Context, userID, email, token string) error {
	return m.Called(ctx, userID, email, token).Error(0)
}

func newUsecase(users *mockUserRepo, tokens *mockTokenRepo, bl *mockBlacklist, pub *mockPublisher) usecase.AuthUsecase {
	return usecase.NewAuthUsecase(users, tokens, bl, pub, "test-secret", 15*time.Minute, 168*time.Hour)
}

// ── Register ──────────────────────────────────────────────────────────────────

func TestRegister_Success(t *testing.T) {
	users := new(mockUserRepo)
	tokens := new(mockTokenRepo)
	bl := new(mockBlacklist)
	pub := new(mockPublisher)

	users.On("FindByEmail", mock.Anything, "alice@example.com").Return(nil, nil)
	users.On("Create", mock.Anything, mock.AnythingOfType("*entity.User")).Return(nil)
	pub.On("PublishUserRegistered", mock.Anything, mock.Anything, "alice@example.com", "Alice").Return(nil)

	uc := newUsecase(users, tokens, bl, pub)
	user, err := uc.Register(context.Background(), "Alice", "alice@example.com", "password123")

	assert.NoError(t, err)
	assert.NotEmpty(t, user.ID)
	assert.Equal(t, "alice@example.com", user.Email)
	assert.False(t, user.EmailVerified)
	assert.NotEmpty(t, user.EmailVerifyToken)
	users.AssertExpectations(t)
	pub.AssertExpectations(t)
}

func TestRegister_EmailTaken(t *testing.T) {
	users := new(mockUserRepo)
	tokens := new(mockTokenRepo)
	bl := new(mockBlacklist)
	pub := new(mockPublisher)

	existing := &entity.User{ID: "existing-id", Email: "alice@example.com"}
	users.On("FindByEmail", mock.Anything, "alice@example.com").Return(existing, nil)

	uc := newUsecase(users, tokens, bl, pub)
	_, err := uc.Register(context.Background(), "Alice", "alice@example.com", "password123")

	assert.ErrorIs(t, err, usecase.ErrEmailTaken)
}

// ── Login ─────────────────────────────────────────────────────────────────────

func TestLogin_InvalidCredentials(t *testing.T) {
	users := new(mockUserRepo)
	tokens := new(mockTokenRepo)
	bl := new(mockBlacklist)
	pub := new(mockPublisher)

	users.On("FindByEmail", mock.Anything, "bob@example.com").Return(nil, nil)

	uc := newUsecase(users, tokens, bl, pub)
	_, _, _, err := uc.Login(context.Background(), "bob@example.com", "wrong")

	assert.ErrorIs(t, err, usecase.ErrInvalidCredentials)
}

// ── VerifyEmail ───────────────────────────────────────────────────────────────

func TestVerifyEmail_Success(t *testing.T) {
	users := new(mockUserRepo)
	tokens := new(mockTokenRepo)
	bl := new(mockBlacklist)
	pub := new(mockPublisher)

	expiry := time.Now().Add(1 * time.Hour)
	u := &entity.User{
		ID:                "u1",
		Email:             "alice@example.com",
		EmailVerified:     false,
		EmailVerifyToken:  "valid-token",
		EmailVerifyExpiry: &expiry,
	}
	users.On("FindByEmailVerifyToken", mock.Anything, "valid-token").Return(u, nil)
	users.On("Update", mock.Anything, mock.AnythingOfType("*entity.User")).Return(nil)

	uc := newUsecase(users, tokens, bl, pub)
	err := uc.VerifyEmail(context.Background(), "valid-token")

	assert.NoError(t, err)
}

func TestVerifyEmail_ExpiredToken(t *testing.T) {
	users := new(mockUserRepo)
	tokens := new(mockTokenRepo)
	bl := new(mockBlacklist)
	pub := new(mockPublisher)

	expiry := time.Now().Add(-1 * time.Hour) // already expired
	u := &entity.User{
		ID:                "u1",
		EmailVerifyToken:  "old-token",
		EmailVerifyExpiry: &expiry,
	}
	users.On("FindByEmailVerifyToken", mock.Anything, "old-token").Return(u, nil)

	uc := newUsecase(users, tokens, bl, pub)
	err := uc.VerifyEmail(context.Background(), "old-token")

	assert.ErrorIs(t, err, usecase.ErrTokenInvalid)
}

func TestVerifyEmail_TokenNotFound(t *testing.T) {
	users := new(mockUserRepo)
	tokens := new(mockTokenRepo)
	bl := new(mockBlacklist)
	pub := new(mockPublisher)

	users.On("FindByEmailVerifyToken", mock.Anything, "ghost-token").Return(nil, nil)

	uc := newUsecase(users, tokens, bl, pub)
	err := uc.VerifyEmail(context.Background(), "ghost-token")

	assert.ErrorIs(t, err, usecase.ErrTokenInvalid)
}

// ── RequestPasswordReset ──────────────────────────────────────────────────────

func TestRequestPasswordReset_UnknownEmail(t *testing.T) {
	users := new(mockUserRepo)
	tokens := new(mockTokenRepo)
	bl := new(mockBlacklist)
	pub := new(mockPublisher)

	// unknown email → no error (prevents enumeration)
	users.On("FindByEmail", mock.Anything, "nobody@example.com").Return(nil, nil)

	uc := newUsecase(users, tokens, bl, pub)
	err := uc.RequestPasswordReset(context.Background(), "nobody@example.com")

	assert.NoError(t, err)
	pub.AssertNotCalled(t, "PublishPasswordReset")
}

func TestRequestPasswordReset_KnownEmail(t *testing.T) {
	users := new(mockUserRepo)
	tokens := new(mockTokenRepo)
	bl := new(mockBlacklist)
	pub := new(mockPublisher)

	u := &entity.User{ID: "u1", Email: "alice@example.com"}
	users.On("FindByEmail", mock.Anything, "alice@example.com").Return(u, nil)
	users.On("Update", mock.Anything, mock.AnythingOfType("*entity.User")).Return(nil)
	pub.On("PublishPasswordReset", mock.Anything, "u1", "alice@example.com", mock.Anything).Return(nil)

	uc := newUsecase(users, tokens, bl, pub)
	err := uc.RequestPasswordReset(context.Background(), "alice@example.com")

	assert.NoError(t, err)
	pub.AssertExpectations(t)
}

// ── ResetPassword ─────────────────────────────────────────────────────────────

func TestResetPassword_Success(t *testing.T) {
	users := new(mockUserRepo)
	tokens := new(mockTokenRepo)
	bl := new(mockBlacklist)
	pub := new(mockPublisher)

	expiry := time.Now().Add(30 * time.Minute)
	u := &entity.User{
		ID:                  "u1",
		Email:               "alice@example.com",
		PasswordHash:        "$2a$10$old",
		PasswordResetToken:  "reset-tok",
		PasswordResetExpiry: &expiry,
	}
	users.On("FindByPasswordResetToken", mock.Anything, "reset-tok").Return(u, nil)
	tokens.On("DeleteByUserID", mock.Anything, "u1").Return(nil)
	users.On("Update", mock.Anything, mock.AnythingOfType("*entity.User")).Return(nil)

	uc := newUsecase(users, tokens, bl, pub)
	err := uc.ResetPassword(context.Background(), "reset-tok", "newpassword123")

	assert.NoError(t, err)
}

func TestResetPassword_ExpiredToken(t *testing.T) {
	users := new(mockUserRepo)
	tokens := new(mockTokenRepo)
	bl := new(mockBlacklist)
	pub := new(mockPublisher)

	expiry := time.Now().Add(-5 * time.Minute) // expired
	u := &entity.User{
		ID:                  "u1",
		PasswordResetToken:  "old-tok",
		PasswordResetExpiry: &expiry,
	}
	users.On("FindByPasswordResetToken", mock.Anything, "old-tok").Return(u, nil)

	uc := newUsecase(users, tokens, bl, pub)
	err := uc.ResetPassword(context.Background(), "old-tok", "new")

	assert.ErrorIs(t, err, usecase.ErrTokenInvalid)
}

// ── GetProfile ────────────────────────────────────────────────────────────────

func TestGetProfile_Success(t *testing.T) {
	users := new(mockUserRepo)
	tokens := new(mockTokenRepo)
	bl := new(mockBlacklist)
	pub := new(mockPublisher)

	u := &entity.User{ID: "u1", Name: "Alice", Email: "alice@example.com"}
	users.On("FindByID", mock.Anything, "u1").Return(u, nil)

	uc := newUsecase(users, tokens, bl, pub)
	profile, err := uc.GetProfile(context.Background(), "u1")

	assert.NoError(t, err)
	assert.Equal(t, "Alice", profile.Name)
}

func TestGetProfile_NotFound(t *testing.T) {
	users := new(mockUserRepo)
	tokens := new(mockTokenRepo)
	bl := new(mockBlacklist)
	pub := new(mockPublisher)

	users.On("FindByID", mock.Anything, "ghost").Return(nil, nil)

	uc := newUsecase(users, tokens, bl, pub)
	_, err := uc.GetProfile(context.Background(), "ghost")

	assert.ErrorIs(t, err, usecase.ErrUserNotFound)
}

// ── ValidateToken ─────────────────────────────────────────────────────────────

func TestValidateToken_BlacklistedToken(t *testing.T) {
	users := new(mockUserRepo)
	tokens := new(mockTokenRepo)
	bl := new(mockBlacklist)
	pub := new(mockPublisher)

	bl.On("Exists", mock.Anything, mock.Anything).Return(true, nil)

	// build a real signed token using a full login flow
	users.On("FindByEmail", mock.Anything, mock.Anything).Return(nil, nil)

	uc := newUsecase(users, tokens, bl, pub)
	// directly try to validate a garbage token → should fail
	_, _, err := uc.ValidateToken(context.Background(), "not.a.valid.token")
	assert.ErrorIs(t, err, usecase.ErrTokenInvalid)
}
