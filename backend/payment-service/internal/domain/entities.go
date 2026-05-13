package domain

import "time"

type PlanSlug string

const (
	PlanFree           PlanSlug = "free"
	PlanPremiumMonthly PlanSlug = "premium_monthly"
	PlanPremiumYearly  PlanSlug = "premium_yearly"
)

type SubscriptionStatus string

const (
	SubscriptionPending  SubscriptionStatus = "pending"
	SubscriptionActive   SubscriptionStatus = "active"
	SubscriptionExpired  SubscriptionStatus = "expired"
	SubscriptionCanceled SubscriptionStatus = "canceled"
)

type PaymentStatus string

const (
	PaymentCreated  PaymentStatus = "created"
	PaymentPending  PaymentStatus = "pending"
	PaymentPaid     PaymentStatus = "paid"
	PaymentFailed   PaymentStatus = "failed"
	PaymentRefunded PaymentStatus = "refunded"
)

type Plan struct {
	ID           string
	Slug         string
	Name         string
	Description  string
	PriceKZT     int64
	DurationDays int
	IsActive     bool
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type Subscription struct {
	ID        string
	UserID    string
	PlanID    string
	PlanSlug  string
	PlanName  string
	Status    SubscriptionStatus
	StartsAt  *time.Time
	ExpiresAt *time.Time
	CreatedAt time.Time
	UpdatedAt time.Time
}

type Payment struct {
	ID             string
	UserID         string
	PlanID         string
	PlanName       string
	SubscriptionID *string
	ProviderID     string
	ProviderRef    string
	AmountKZT      int64
	Status         PaymentStatus
	CheckoutURL    string
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

type PaymentAttempt struct {
	ID          string
	PaymentID   string
	Status      PaymentStatus
	ProviderRaw string
	CreatedAt   time.Time
}
