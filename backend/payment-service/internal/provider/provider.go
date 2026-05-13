package provider

import "context"

type CheckoutRequest struct {
	PaymentID   string
	UserID      string
	AmountKZT   int64
	Description string
	ReturnURL   string
	FailURL     string
}

type CheckoutResponse struct {
	ProviderRef string
	CheckoutURL string
}

type VerifyResponse struct {
	Success bool
	Status  string
	Raw     string
}

type Provider interface {
	ID() string
	CreateCheckout(ctx context.Context, req CheckoutRequest) (CheckoutResponse, error)
	VerifyPayment(ctx context.Context, providerRef string) (VerifyResponse, error)
	RefundPayment(ctx context.Context, providerRef string) error
}
