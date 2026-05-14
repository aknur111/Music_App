package local

import (
	"context"
	"fmt"

	"github.com/music-app/payment-service/internal/provider"
)

type localProvider struct {
	frontendURL string
}

func New(frontendURL string) provider.Provider {
	return &localProvider{frontendURL: frontendURL}
}

func (l *localProvider) ID() string { return "local" }

func (l *localProvider) CreateCheckout(_ context.Context, req provider.CheckoutRequest) (provider.CheckoutResponse, error) {
	checkoutURL := fmt.Sprintf("%s/billing/dev-checkout?payment_id=%s", l.frontendURL, req.PaymentID)
	return provider.CheckoutResponse{
		ProviderRef: "local-" + req.PaymentID,
		CheckoutURL: checkoutURL,
	}, nil
}

func (l *localProvider) VerifyPayment(_ context.Context, _ string) (provider.VerifyResponse, error) {
	return provider.VerifyResponse{
		Success: true,
		Status:  "local_verified",
		Raw:     `{"status":"local_verified"}`,
	}, nil
}

func (l *localProvider) RefundPayment(_ context.Context, _ string) error {
	return nil
}
