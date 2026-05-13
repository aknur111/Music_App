package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/music-app/payment-service/internal/domain"
)

type SubscriptionRepository struct {
	db *pgxpool.Pool
}

func NewSubscriptionRepository(db *pgxpool.Pool) *SubscriptionRepository {
	return &SubscriptionRepository{db: db}
}

func (r *SubscriptionRepository) Create(ctx context.Context, s *domain.Subscription) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO subscriptions (id, user_id, plan_id, status, starts_at, expires_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`, s.ID, s.UserID, s.PlanID, string(s.Status), s.StartsAt, s.ExpiresAt, s.CreatedAt, s.UpdatedAt)
	if err != nil {
		return fmt.Errorf("subscription repo create: %w", err)
	}
	return nil
}

func (r *SubscriptionRepository) GetActiveByUser(ctx context.Context, userID string) (*domain.Subscription, error) {
	s := &domain.Subscription{}
	err := r.db.QueryRow(ctx, `
		SELECT s.id, s.user_id, s.plan_id, pl.slug, pl.name,
		       s.status, s.starts_at, s.expires_at, s.created_at, s.updated_at
		FROM subscriptions s
		JOIN plans pl ON pl.id = s.plan_id
		WHERE s.user_id = $1
		  AND s.status = 'active'
		  AND (s.expires_at IS NULL OR s.expires_at > NOW())
		ORDER BY s.created_at DESC
		LIMIT 1
	`, userID).Scan(
		&s.ID, &s.UserID, &s.PlanID, &s.PlanSlug, &s.PlanName,
		&s.Status, &s.StartsAt, &s.ExpiresAt, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("subscription repo get active by user: %w", err)
	}
	return s, nil
}

func (r *SubscriptionRepository) CancelUserSubscriptions(ctx context.Context, userID string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE subscriptions
		SET status = 'canceled', updated_at = NOW()
		WHERE user_id = $1 AND status = 'active'
	`, userID)
	return err
}
