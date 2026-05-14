package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/music-app/payment-service/internal/domain"
)

type PaymentRepository struct {
	db *pgxpool.Pool
}

func NewPaymentRepository(db *pgxpool.Pool) *PaymentRepository {
	return &PaymentRepository{db: db}
}

func (r *PaymentRepository) Create(ctx context.Context, p *domain.Payment) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO payments (id, user_id, plan_id, provider_id, provider_ref, amount_kzt, status, checkout_url, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`, p.ID, p.UserID, p.PlanID, p.ProviderID, p.ProviderRef,
		p.AmountKZT, string(p.Status), p.CheckoutURL, p.CreatedAt, p.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("payment repo create: %w", err)
	}
	return nil
}

func (r *PaymentRepository) GetByID(ctx context.Context, id string) (*domain.Payment, error) {
	p := &domain.Payment{}
	err := r.db.QueryRow(ctx, `
		SELECT p.id, p.user_id, p.plan_id, pl.name, p.subscription_id,
		       p.provider_id, p.provider_ref, p.amount_kzt, p.status,
		       p.checkout_url, p.created_at, p.updated_at
		FROM payments p
		JOIN plans pl ON pl.id = p.plan_id
		WHERE p.id = $1
	`, id).Scan(
		&p.ID, &p.UserID, &p.PlanID, &p.PlanName, &p.SubscriptionID,
		&p.ProviderID, &p.ProviderRef, &p.AmountKZT, &p.Status,
		&p.CheckoutURL, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("payment repo get by id: %w", err)
	}
	return p, nil
}

func (r *PaymentRepository) ListByUser(ctx context.Context, userID string) ([]*domain.Payment, error) {
	rows, err := r.db.Query(ctx, `
		SELECT p.id, p.user_id, p.plan_id, pl.name, p.subscription_id,
		       p.provider_id, p.provider_ref, p.amount_kzt, p.status,
		       p.checkout_url, p.created_at, p.updated_at
		FROM payments p
		JOIN plans pl ON pl.id = p.plan_id
		WHERE p.user_id = $1
		ORDER BY p.created_at DESC
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("payment repo list by user: %w", err)
	}
	defer rows.Close()

	var payments []*domain.Payment
	for rows.Next() {
		p := &domain.Payment{}
		if err := rows.Scan(
			&p.ID, &p.UserID, &p.PlanID, &p.PlanName, &p.SubscriptionID,
			&p.ProviderID, &p.ProviderRef, &p.AmountKZT, &p.Status,
			&p.CheckoutURL, &p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("payment repo list scan: %w", err)
		}
		payments = append(payments, p)
	}
	return payments, nil
}

func (r *PaymentRepository) UpdateStatus(ctx context.Context, id string, status domain.PaymentStatus, providerRef, subscriptionID string) error {
	if subscriptionID != "" {
		_, err := r.db.Exec(ctx, `
			UPDATE payments
			SET status = $1, provider_ref = $2, subscription_id = $3, updated_at = NOW()
			WHERE id = $4
		`, string(status), providerRef, subscriptionID, id)
		return err
	}
	_, err := r.db.Exec(ctx, `
		UPDATE payments
		SET status = $1, provider_ref = $2, updated_at = NOW()
		WHERE id = $3
	`, string(status), providerRef, id)
	return err
}

func (r *PaymentRepository) CreateAttempt(ctx context.Context, a *domain.PaymentAttempt) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO payment_attempts (id, payment_id, status, provider_raw, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`, a.ID, a.PaymentID, string(a.Status), a.ProviderRaw, a.CreatedAt)
	return err
}
