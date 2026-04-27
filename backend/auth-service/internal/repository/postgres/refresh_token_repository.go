package postgres

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/music-app/auth-service/internal/domain/entity"
	"github.com/music-app/auth-service/internal/domain/repository"
)

type refreshTokenRepository struct {
	db *pgxpool.Pool
}

func NewRefreshTokenRepository(db *pgxpool.Pool) repository.RefreshTokenRepository {
	return &refreshTokenRepository{db: db}
}

func (r *refreshTokenRepository) Save(ctx context.Context, t *entity.RefreshToken) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at)
		 VALUES ($1, $2, $3, $4, $5)`,
		t.ID, t.UserID, t.TokenHash, t.ExpiresAt, t.CreatedAt,
	)
	return err
}

func (r *refreshTokenRepository) FindByHash(ctx context.Context, tokenHash string) (*entity.RefreshToken, error) {
	row := r.db.QueryRow(ctx,
		`SELECT id, user_id, token_hash, expires_at, created_at
		 FROM refresh_tokens WHERE token_hash = $1`, tokenHash,
	)
	t := &entity.RefreshToken{}
	err := row.Scan(&t.ID, &t.UserID, &t.TokenHash, &t.ExpiresAt, &t.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return t, err
}

func (r *refreshTokenRepository) DeleteByUserID(ctx context.Context, userID string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM refresh_tokens WHERE user_id = $1`, userID)
	return err
}

func (r *refreshTokenRepository) DeleteByHash(ctx context.Context, tokenHash string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM refresh_tokens WHERE token_hash = $1`, tokenHash)
	return err
}
