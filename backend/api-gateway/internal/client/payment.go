package client

import (
	"context"

	paymentpb "github.com/music-app/payment-service/gen/payment"
	"google.golang.org/grpc"
)

type PaymentClient struct {
	grpc paymentpb.PaymentServiceClient
}

func NewPaymentClient(conn *grpc.ClientConn) *PaymentClient {
	return &PaymentClient{grpc: paymentpb.NewPaymentServiceClient(conn)}
}

func (c *PaymentClient) GetPlans(ctx context.Context) (interface{}, error) {
	return c.grpc.GetPlans(ctx, &paymentpb.GetPlansRequest{})
}

func (c *PaymentClient) CreateCheckout(ctx context.Context, userID, planSlug, returnURL, failURL string) (interface{}, error) {
	return c.grpc.CreateCheckout(ctx, &paymentpb.CreateCheckoutRequest{
		UserId:    userID,
		PlanSlug:  planSlug,
		ReturnUrl: returnURL,
		FailUrl:   failURL,
	})
}

func (c *PaymentClient) GetPayment(ctx context.Context, paymentID, userID string) (interface{}, error) {
	return c.grpc.GetPayment(ctx, &paymentpb.GetPaymentRequest{
		PaymentId: paymentID,
		UserId:    userID,
	})
}

func (c *PaymentClient) ListMyPayments(ctx context.Context, userID string) (interface{}, error) {
	return c.grpc.ListMyPayments(ctx, &paymentpb.ListMyPaymentsRequest{UserId: userID})
}

func (c *PaymentClient) GetMySubscription(ctx context.Context, userID string) (interface{}, error) {
	return c.grpc.GetMySubscription(ctx, &paymentpb.GetMySubscriptionRequest{UserId: userID})
}

func (c *PaymentClient) HandleCallback(ctx context.Context, providerID, paymentID, providerRef string, success bool, rawBody string) (interface{}, error) {
	return c.grpc.HandleCallback(ctx, &paymentpb.HandleCallbackRequest{
		ProviderId:  providerID,
		PaymentId:   paymentID,
		ProviderRef: providerRef,
		Success:     success,
		RawBody:     rawBody,
	})
}
