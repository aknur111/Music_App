package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/music-app/payment-service/internal/domain"
)

type PlanRepository struct {
	db *pgxpool.Pool
}

func NewPlanRepository(db *pgxpool.Pool) *PlanRepository {
	return &PlanRepository{db: db}
}

func (r *PlanRepository) ListActive(ctx context.Context) ([]*domain.Plan, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, slug, name, description, price_kzt, duration_days, is_active, created_at, updated_at
		FROM plans
		WHERE is_active = true
		ORDER BY price_kzt ASC
	`)
	if err != nil {
		return nil, fmt.Errorf("plan repo list active: %w", err)
	}
	defer rows.Close()

	var plans []*domain.Plan
	for rows.Next() {
		p := &domain.Plan{}
		if err := rows.Scan(
			&p.ID, &p.Slug, &p.Name, &p.Description,
			&p.PriceKZT, &p.DurationDays, &p.IsActive,
			&p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("plan repo scan: %w", err)
		}
		plans = append(plans, p)
	}
	return plans, nil
}

func (r *PlanRepository) GetBySlug(ctx context.Context, slug string) (*domain.Plan, error) {
	p := &domain.Plan{}
	err := r.db.QueryRow(ctx, `
		SELECT id, slug, name, description, price_kzt, duration_days, is_active, created_at, updated_at
		FROM plans
		WHERE slug = $1 AND is_active = true
	`, slug).Scan(
		&p.ID, &p.Slug, &p.Name, &p.Description,
		&p.PriceKZT, &p.DurationDays, &p.IsActive,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("plan repo get by slug: %w", err)
	}
	return p, nil
}

func (r *PlanRepository) GetByID(ctx context.Context, id string) (*domain.Plan, error) {
	p := &domain.Plan{}
	err := r.db.QueryRow(ctx, `
		SELECT id, slug, name, description, price_kzt, duration_days, is_active, created_at, updated_at
		FROM plans
		WHERE id = $1
	`, id).Scan(
		&p.ID, &p.Slug, &p.Name, &p.Description,
		&p.PriceKZT, &p.DurationDays, &p.IsActive,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("plan repo get by id: %w", err)
	}
	return p, nil
}
