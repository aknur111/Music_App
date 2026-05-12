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
	if u.Role == "" {
		u.Role = "user"
	}
	_, err := r.db.Exec(ctx,
		`INSERT INTO users
		   (id, name, email, password_hash, role, email_verified,
		    email_verify_token, email_verify_expiry, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
		u.ID, u.Name, u.Email, u.PasswordHash, u.Role, u.EmailVerified,
		u.EmailVerifyToken, u.EmailVerifyExpiry, u.CreatedAt, u.UpdatedAt,
	)
	return err
}

func (r *userRepository) FindByID(ctx context.Context, id string) (*entity.User, error) {
	row := r.db.QueryRow(ctx,
		`SELECT id, name, email, password_hash, COALESCE(role, 'user'), email_verified,
		        email_verify_token, email_verify_expiry,
		        password_reset_token, password_reset_expiry,
		        created_at, updated_at
		 FROM users WHERE id = $1 AND deleted_at IS NULL`, id,
	)
	return scanUser(row)
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	row := r.db.QueryRow(ctx,
		`SELECT id, name, email, password_hash, COALESCE(role, 'user'), email_verified,
		        email_verify_token, email_verify_expiry,
		        password_reset_token, password_reset_expiry,
		        created_at, updated_at
		 FROM users WHERE email = $1 AND deleted_at IS NULL`, email,
	)
	return scanUser(row)
}

func (r *userRepository) FindByEmailVerifyToken(ctx context.Context, token string) (*entity.User, error) {
	row := r.db.QueryRow(ctx,
		`SELECT id, name, email, password_hash, COALESCE(role, 'user'), email_verified,
		        email_verify_token, email_verify_expiry,
		        password_reset_token, password_reset_expiry,
		        created_at, updated_at
		 FROM users WHERE email_verify_token = $1 AND deleted_at IS NULL`, token,
	)
	return scanUser(row)
}

func (r *userRepository) FindByPasswordResetToken(ctx context.Context, token string) (*entity.User, error) {
	row := r.db.QueryRow(ctx,
		`SELECT id, name, email, password_hash, COALESCE(role, 'user'), email_verified,
		        email_verify_token, email_verify_expiry,
		        password_reset_token, password_reset_expiry,
		        created_at, updated_at
		 FROM users WHERE password_reset_token = $1 AND deleted_at IS NULL`, token,
	)
	return scanUser(row)
}

func (r *userRepository) Update(ctx context.Context, u *entity.User) error {
	u.UpdatedAt = time.Now().UTC()
	_, err := r.db.Exec(ctx,
		`UPDATE users SET
		   name=$1, email=$2, password_hash=$3, email_verified=$4,
		   email_verify_token=$5, email_verify_expiry=$6,
		   password_reset_token=$7, password_reset_expiry=$8,
		   updated_at=$9
		 WHERE id=$10`,
		u.Name, u.Email, u.PasswordHash, u.EmailVerified,
		u.EmailVerifyToken, u.EmailVerifyExpiry,
		u.PasswordResetToken, u.PasswordResetExpiry,
		u.UpdatedAt, u.ID,
	)
	return err
}

func (r *userRepository) SoftDelete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `UPDATE users SET deleted_at=$1 WHERE id=$2`, time.Now().UTC(), id)
	return err
}

func scanUser(row pgx.Row) (*entity.User, error) {
	u := &entity.User{}
	err := row.Scan(
		&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Role, &u.EmailVerified,
		&u.EmailVerifyToken, &u.EmailVerifyExpiry,
		&u.PasswordResetToken, &u.PasswordResetExpiry,
		&u.CreatedAt, &u.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return u, nil
}
