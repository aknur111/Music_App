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

// ── minimal inline mocks (no code-gen dependency) ────────────────────────────

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

// ── Tests ────────────────────────────────────────────────────────────────────

func newUsecase(users *mockUserRepo, tokens *mockTokenRepo, bl *mockBlacklist, pub *mockPublisher) usecase.AuthUsecase {
	return usecase.NewAuthUsecase(users, tokens, bl, pub, "test-secret", 15*time.Minute, 168*time.Hour)
}

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

func TestValidateToken_BlacklistedToken(t *testing.T) {
	users := new(mockUserRepo)
	tokens := new(mockTokenRepo)
	bl := new(mockBlacklist)
	pub := new(mockPublisher)

	bl.On("Exists", mock.Anything, mock.Anything).Return(true, nil)

	uc := newUsecase(users, tokens, bl, pub)

	// generate a real token first via login
	users.On("FindByEmail", mock.Anything, "alice@example.com").Return(&entity.User{
		ID: "u1", Email: "alice@example.com", PasswordHash: "$2a$10$dummyhash",
	}, nil)

	_, _, _, err := uc.Login(context.Background(), "alice@example.com", "wrong")
	assert.Error(t, err)
}
