package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/music-app/auth-service/internal/domain/entity"
	"github.com/music-app/auth-service/internal/domain/repository"
)

type userRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) repository.UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, u *entity.User) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6)`,
		u.ID, u.Name, u.Email, u.PasswordHash, u.CreatedAt, u.UpdatedAt,
	)
	return err
}

func (r *userRepository) FindByID(ctx context.Context, id string) (*entity.User, error) {
	row := r.db.QueryRow(ctx,
		`SELECT id, name, email, password_hash, created_at, updated_at
		 FROM users WHERE id = $1 AND deleted_at IS NULL`, id,
	)
	return scanUser(row)
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	row := r.db.QueryRow(ctx,
		`SELECT id, name, email, password_hash, created_at, updated_at
		 FROM users WHERE email = $1 AND deleted_at IS NULL`, email,
	)
	return scanUser(row)
}

func (r *userRepository) Update(ctx context.Context, u *entity.User) error {
	u.UpdatedAt = time.Now().UTC()
	_, err := r.db.Exec(ctx,
		`UPDATE users SET name=$1, email=$2, password_hash=$3, updated_at=$4 WHERE id=$5`,
		u.Name, u.Email, u.PasswordHash, u.UpdatedAt, u.ID,
	)
	return err
}

func (r *userRepository) SoftDelete(ctx context.Context, id string) error {
	now := time.Now().UTC()
	_, err := r.db.Exec(ctx, `UPDATE users SET deleted_at=$1 WHERE id=$2`, now, id)
	return err
}

func scanUser(row pgx.Row) (*entity.User, error) {
	u := &entity.User{}
	err := row.Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.CreatedAt, &u.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return u, nil
}
