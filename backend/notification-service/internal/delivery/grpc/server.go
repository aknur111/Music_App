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

func (s *Server) SendWelcomeEmail(ctx context.Context, req *pb.WelcomeEmailRequest) (*pb.SendEmailResponse, error) {
	if err := s.uc.HandleUserRegistered(ctx, "grpc-welcome-"+req.To, req.To, req.Name); err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &pb.SendEmailResponse{Success: true, Message: "welcome email sent"}, nil
}

func (s *Server) SendPasswordResetEmail(ctx context.Context, req *pb.PasswordResetEmailRequest) (*pb.SendEmailResponse, error) {
	if err := s.uc.HandlePasswordReset(ctx, "grpc-reset-"+req.To, req.To, req.ResetLink); err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &pb.SendEmailResponse{Success: true, Message: "password reset email sent"}, nil
}

func (s *Server) SendPlaylistSharedEmail(ctx context.Context, req *pb.PlaylistSharedEmailRequest) (*pb.SendEmailResponse, error) {
	subject := req.SenderName + " shared a playlist with you: " + req.PlaylistName
	body := "<p>Hi " + req.RecipientName + ",</p><p><b>" + req.SenderName +
		"</b> has shared the playlist <b>" + req.PlaylistName +
		"</b> with you.</p><p><a href=\"" + req.PlaylistLink + "\">Open playlist</a></p>"
	if err := s.uc.SendEmail(ctx, req.To, subject, body, true); err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &pb.SendEmailResponse{Success: true, Message: "playlist shared email sent"}, nil
}
