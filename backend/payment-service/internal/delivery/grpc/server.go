package grpc

import (
	"context"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	pb "github.com/music-app/payment-service/gen/payment"
	"github.com/music-app/payment-service/internal/domain"
	"github.com/music-app/payment-service/internal/usecase"
)

type Server struct {
	pb.UnimplementedPaymentServiceServer
	uc *usecase.PaymentUsecase
}

func NewServer(uc *usecase.PaymentUsecase) *Server {
	return &Server{uc: uc}
}

func (s *Server) GetPlans(ctx context.Context, _ *pb.GetPlansRequest) (*pb.GetPlansResponse, error) {
	plans, err := s.uc.GetPlans(ctx)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	resp := &pb.GetPlansResponse{}
	for _, p := range plans {
		resp.Plans = append(resp.Plans, domainPlanToProto(p))
	}
	return resp, nil
}

func (s *Server) CreateCheckout(ctx context.Context, req *pb.CreateCheckoutRequest) (*pb.CreateCheckoutResponse, error) {
	payment, err := s.uc.CreateCheckout(ctx, req.UserId, req.PlanSlug, req.ReturnUrl, req.FailUrl)
	if err != nil {
		if err == usecase.ErrPlanNotFound {
			return nil, status.Error(codes.NotFound, "plan not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &pb.CreateCheckoutResponse{
		PaymentId:   payment.ID,
		CheckoutUrl: payment.CheckoutURL,
		ProviderRef: payment.ProviderRef,
	}, nil
}

func (s *Server) GetPayment(ctx context.Context, req *pb.GetPaymentRequest) (*pb.GetPaymentResponse, error) {
	payment, err := s.uc.GetPayment(ctx, req.PaymentId, req.UserId)
	if err != nil {
		if err == usecase.ErrPaymentNotFound {
			return nil, status.Error(codes.NotFound, "payment not found")
		}
		if err == usecase.ErrUnauthorized {
			return nil, status.Error(codes.PermissionDenied, "forbidden")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &pb.GetPaymentResponse{Payment: domainPaymentToProto(payment)}, nil
}

func (s *Server) ListMyPayments(ctx context.Context, req *pb.ListMyPaymentsRequest) (*pb.ListMyPaymentsResponse, error) {
	payments, err := s.uc.ListMyPayments(ctx, req.UserId)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	resp := &pb.ListMyPaymentsResponse{}
	for _, p := range payments {
		resp.Payments = append(resp.Payments, domainPaymentToProto(p))
	}
	return resp, nil
}

func (s *Server) GetMySubscription(ctx context.Context, req *pb.GetMySubscriptionRequest) (*pb.GetMySubscriptionResponse, error) {
	sub, err := s.uc.GetMySubscription(ctx, req.UserId)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	if sub == nil {
		return &pb.GetMySubscriptionResponse{HasSubscription: false}, nil
	}
	return &pb.GetMySubscriptionResponse{
		Subscription:    domainSubToProto(sub),
		HasSubscription: true,
	}, nil
}

func (s *Server) HandleCallback(ctx context.Context, req *pb.HandleCallbackRequest) (*pb.HandleCallbackResponse, error) {
	err := s.uc.HandleCallback(ctx, req.ProviderId, req.PaymentId, req.ProviderRef, req.Success)
	if err != nil {
		if err == usecase.ErrPaymentNotFound {
			return nil, status.Error(codes.NotFound, "payment not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &pb.HandleCallbackResponse{Ok: true}, nil
}

func domainPlanToProto(p *domain.Plan) *pb.Plan {
	return &pb.Plan{
		Id:           p.ID,
		Slug:         p.Slug,
		Name:         p.Name,
		Description:  p.Description,
		PriceKzt:     p.PriceKZT,
		DurationDays: int32(p.DurationDays),
		IsActive:     p.IsActive,
	}
}

func domainPaymentToProto(p *domain.Payment) *pb.Payment {
	return &pb.Payment{
		Id:          p.ID,
		UserId:      p.UserID,
		PlanId:      p.PlanID,
		PlanName:    p.PlanName,
		ProviderId:  p.ProviderID,
		ProviderRef: p.ProviderRef,
		AmountKzt:   p.AmountKZT,
		Status:      string(p.Status),
		CheckoutUrl: p.CheckoutURL,
		CreatedAt:   p.CreatedAt.Format(time.RFC3339),
	}
}

func domainSubToProto(s *domain.Subscription) *pb.Subscription {
	sub := &pb.Subscription{
		Id:        s.ID,
		UserId:    s.UserID,
		PlanId:    s.PlanID,
		PlanSlug:  s.PlanSlug,
		PlanName:  s.PlanName,
		Status:    string(s.Status),
		CreatedAt: s.CreatedAt.Format(time.RFC3339),
	}
	if s.StartsAt != nil {
		sub.StartsAt = s.StartsAt.Format(time.RFC3339)
	}
	if s.ExpiresAt != nil {
		sub.ExpiresAt = s.ExpiresAt.Format(time.RFC3339)
	}
	return sub
}
