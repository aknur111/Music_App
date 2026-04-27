package grpc

import (
	"context"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	pb "github.com/music-app/notification-service/gen/notification"
	"github.com/music-app/notification-service/internal/usecase"
)

type Server struct {
	pb.UnimplementedNotificationServiceServer
	uc usecase.NotificationUsecase
}

func NewServer(uc usecase.NotificationUsecase) *Server {
	return &Server{uc: uc}
}

func (s *Server) SendDirectEmail(ctx context.Context, req *pb.SendEmailRequest) (*pb.SendEmailResponse, error) {
	if err := s.uc.SendEmail(ctx, req.To, req.Subject, req.Body, req.IsHtml); err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &pb.SendEmailResponse{Success: true, Message: "email sent"}, nil
}
