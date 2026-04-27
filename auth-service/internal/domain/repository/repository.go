package repository

import (
	"context"

	"github.com/music-app/auth-service/internal/domain/entity"
)

//go:generate mockgen -source=repository.go -destination=../../usecase/mocks/mock_repository.go -package=mocks

type UserRepository interface {
	Create(ctx context.Context, user *entity.User) error
	FindByID(ctx context.Context, id string) (*entity.User, error)
	FindByEmail(ctx context.Context, email string) (*entity.User, error)
	Update(ctx context.Context, user *entity.User) error
	SoftDelete(ctx context.Context, id string) error
}

type RefreshTokenRepository interface {
	Save(ctx context.Context, token *entity.RefreshToken) error
	FindByHash(ctx context.Context, tokenHash string) (*entity.RefreshToken, error)
	DeleteByUserID(ctx context.Context, userID string) error
	DeleteByHash(ctx context.Context, tokenHash string) error
}

type TokenBlacklist interface {
	Add(ctx context.Context, jti string, ttlSeconds int64) error
	Exists(ctx context.Context, jti string) (bool, error)
}
