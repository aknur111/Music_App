package usecase

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/music-app/payment-service/internal/domain"
	"github.com/music-app/payment-service/internal/provider"
)

var ErrPlanNotFound = errors.New("plan not found")
var ErrPaymentNotFound = errors.New("payment not found")
var ErrUnauthorized = errors.New("unauthorized")

type PlanRepository interface {
	ListActive(ctx context.Context) ([]*domain.Plan, error)
	GetBySlug(ctx context.Context, slug string) (*domain.Plan, error)
	GetByID(ctx context.Context, id string) (*domain.Plan, error)
}

type PaymentRepository interface {
	Create(ctx context.Context, p *domain.Payment) error
	GetByID(ctx context.Context, id string) (*domain.Payment, error)
	ListByUser(ctx context.Context, userID string) ([]*domain.Payment, error)
	UpdateStatus(ctx context.Context, id string, status domain.PaymentStatus, providerRef, subscriptionID string) error
	CreateAttempt(ctx context.Context, a *domain.PaymentAttempt) error
}

type SubscriptionRepository interface {
	Create(ctx context.Context, s *domain.Subscription) error
	GetActiveByUser(ctx context.Context, userID string) (*domain.Subscription, error)
	CancelUserSubscriptions(ctx context.Context, userID string) error
}

type PaymentUsecase struct {
	planRepo  PlanRepository
	payRepo   PaymentRepository
	subRepo   SubscriptionRepository
	providers map[string]provider.Provider
	defaultProviderID string
}

func NewPaymentUsecase(
	planRepo PlanRepository,
	payRepo PaymentRepository,
	subRepo SubscriptionRepository,
	providers []provider.Provider,
	defaultProviderID string,
) *PaymentUsecase {
	pm := make(map[string]provider.Provider, len(providers))
	for _, p := range providers {
		pm[p.ID()] = p
	}
	return &PaymentUsecase{
		planRepo:          planRepo,
		payRepo:           payRepo,
		subRepo:           subRepo,
		providers:         pm,
		defaultProviderID: defaultProviderID,
	}
}

func (u *PaymentUsecase) GetPlans(ctx context.Context) ([]*domain.Plan, error) {
	return u.planRepo.ListActive(ctx)
}

func (u *PaymentUsecase) CreateCheckout(ctx context.Context, userID, planSlug, returnURL, failURL string) (*domain.Payment, error) {
	plan, err := u.planRepo.GetBySlug(ctx, planSlug)
	if err != nil {
		return nil, ErrPlanNotFound
	}

	p := u.providers[u.defaultProviderID]
	if p == nil {
		return nil, fmt.Errorf("provider %q not configured", u.defaultProviderID)
	}

	now := time.Now().UTC()
	payment := &domain.Payment{
		ID:         uuid.New().String(),
		UserID:     userID,
		PlanID:     plan.ID,
		PlanName:   plan.Name,
		ProviderID: p.ID(),
		AmountKZT:  plan.PriceKZT,
		Status:     domain.PaymentCreated,
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	checkout, err := p.CreateCheckout(ctx, provider.CheckoutRequest{
		PaymentID:   payment.ID,
		UserID:      userID,
		AmountKZT:   plan.PriceKZT,
		Description: plan.Name + " — Premium Subscription",
		ReturnURL:   returnURL,
		FailURL:     failURL,
	})
	if err != nil {
		return nil, fmt.Errorf("create checkout: %w", err)
	}

	payment.ProviderRef = checkout.ProviderRef
	payment.CheckoutURL = checkout.CheckoutURL
	payment.Status = domain.PaymentPending

	if err := u.payRepo.Create(ctx, payment); err != nil {
		return nil, fmt.Errorf("store payment: %w", err)
	}

	return payment, nil
}

func (u *PaymentUsecase) GetPayment(ctx context.Context, paymentID, userID string) (*domain.Payment, error) {
	payment, err := u.payRepo.GetByID(ctx, paymentID)
	if err != nil {
		return nil, ErrPaymentNotFound
	}
	if payment.UserID != userID {
		return nil, ErrUnauthorized
	}
	return payment, nil
}

func (u *PaymentUsecase) ListMyPayments(ctx context.Context, userID string) ([]*domain.Payment, error) {
	return u.payRepo.ListByUser(ctx, userID)
}

func (u *PaymentUsecase) GetMySubscription(ctx context.Context, userID string) (*domain.Subscription, error) {
	return u.subRepo.GetActiveByUser(ctx, userID)
}

func (u *PaymentUsecase) HandleCallback(ctx context.Context, providerID, paymentID, providerRef string, success bool) error {
	payment, err := u.payRepo.GetByID(ctx, paymentID)
	if err != nil {
		return ErrPaymentNotFound
	}

	p := u.providers[providerID]
	if p == nil {
		return fmt.Errorf("unknown provider: %s", providerID)
	}

	verified, verifyErr := p.VerifyPayment(ctx, payment.ProviderRef)

	actualSuccess := success
	verifyRaw := ""
	if verifyErr == nil {
		actualSuccess = success && verified.Success
		verifyRaw = verified.Raw
	}

	attemptStatus := domain.PaymentFailed
	if actualSuccess {
		attemptStatus = domain.PaymentPaid
	}

	_ = u.payRepo.CreateAttempt(ctx, &domain.PaymentAttempt{
		ID:          uuid.New().String(),
		PaymentID:   paymentID,
		Status:      attemptStatus,
		ProviderRaw: verifyRaw,
		CreatedAt:   time.Now().UTC(),
	})

	if !actualSuccess {
		return u.payRepo.UpdateStatus(ctx, paymentID, domain.PaymentFailed, providerRef, "")
	}

	if err := u.subRepo.CancelUserSubscriptions(ctx, payment.UserID); err != nil {
		return fmt.Errorf("cancel existing subscriptions: %w", err)
	}

	plan, err := u.planRepo.GetByID(ctx, payment.PlanID)
	if err != nil {
		return fmt.Errorf("lookup plan: %w", err)
	}

	now := time.Now().UTC()
	sub := &domain.Subscription{
		ID:        uuid.New().String(),
		UserID:    payment.UserID,
		PlanID:    plan.ID,
		Status:    domain.SubscriptionActive,
		StartsAt:  &now,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if plan.DurationDays > 0 {
		exp := now.AddDate(0, 0, plan.DurationDays)
		sub.ExpiresAt = &exp
	}

	if err := u.subRepo.Create(ctx, sub); err != nil {
		return fmt.Errorf("create subscription: %w", err)
	}

	return u.payRepo.UpdateStatus(ctx, paymentID, domain.PaymentPaid, providerRef, sub.ID)
}
