package grpc

import (
	"context"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	pb "github.com/music-app/auth-service/gen/auth"
	"github.com/music-app/auth-service/internal/usecase"
)

type Server struct {
	pb.UnimplementedAuthServiceServer
	uc usecase.AuthUsecase
}

func NewServer(uc usecase.AuthUsecase) *Server {
	return &Server{uc: uc}
}

func (s *Server) Register(ctx context.Context, req *pb.RegisterRequest) (*pb.RegisterResponse, error) {
	user, err := s.uc.Register(ctx, req.Name, req.Email, req.Password)
	if err != nil {
		switch err {
		case usecase.ErrEmailTaken:
			return nil, status.Error(codes.AlreadyExists, err.Error())
		default:
			return nil, status.Error(codes.Internal, err.Error())
		}
	}
	return &pb.RegisterResponse{UserId: user.ID, Email: user.Email}, nil
}

func (s *Server) Login(ctx context.Context, req *pb.LoginRequest) (*pb.LoginResponse, error) {
	access, refresh, expiresAt, err := s.uc.Login(ctx, req.Email, req.Password)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, err.Error())
	}
	return &pb.LoginResponse{
		AccessToken:  access,
		RefreshToken: refresh,
		ExpiresAt:    expiresAt,
	}, nil
}

func (s *Server) Logout(ctx context.Context, req *pb.LogoutRequest) (*pb.LogoutResponse, error) {
	if err := s.uc.Logout(ctx, req.AccessToken); err != nil {
		return nil, status.Error(codes.Unauthenticated, err.Error())
	}
	return &pb.LogoutResponse{Success: true}, nil
}

func (s *Server) RefreshToken(ctx context.Context, req *pb.RefreshTokenRequest) (*pb.RefreshTokenResponse, error) {
	access, refresh, expiresAt, err := s.uc.RefreshToken(ctx, req.RefreshToken)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, err.Error())
	}
	return &pb.RefreshTokenResponse{
		AccessToken:  access,
		RefreshToken: refresh,
		ExpiresAt:    expiresAt,
	}, nil
}

func (s *Server) ValidateToken(ctx context.Context, req *pb.ValidateTokenRequest) (*pb.ValidateTokenResponse, error) {
	userID, email, err := s.uc.ValidateToken(ctx, req.AccessToken)
	if err != nil {
		return &pb.ValidateTokenResponse{Valid: false}, nil
	}
	return &pb.ValidateTokenResponse{Valid: true, UserId: userID, Email: email}, nil
}

func (s *Server) RequestPasswordReset(ctx context.Context, req *pb.PasswordResetRequest) (*pb.PasswordResetResponse, error) {
	if err := s.uc.RequestPasswordReset(ctx, req.Email); err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &pb.PasswordResetResponse{Success: true}, nil
}

func (s *Server) VerifyEmail(ctx context.Context, req *pb.VerifyEmailRequest) (*pb.VerifyEmailResponse, error) {
	if err := s.uc.VerifyEmail(ctx, req.Token); err != nil {
		return nil, status.Error(codes.InvalidArgument, err.Error())
	}
	return &pb.VerifyEmailResponse{Success: true}, nil
}

func (s *Server) ResetPassword(ctx context.Context, req *pb.ResetPasswordRequest) (*pb.ResetPasswordResponse, error) {
	if err := s.uc.ResetPassword(ctx, req.Token, req.NewPassword); err != nil {
		return nil, status.Error(codes.InvalidArgument, err.Error())
	}
	return &pb.ResetPasswordResponse{Success: true}, nil
}

func (s *Server) GetProfile(ctx context.Context, req *pb.GetProfileRequest) (*pb.GetProfileResponse, error) {
	user, err := s.uc.GetProfile(ctx, req.UserId)
	if err != nil {
		return nil, status.Error(codes.NotFound, err.Error())
	}
	return &pb.GetProfileResponse{
		UserId:        user.ID,
		Name:          user.Name,
		Email:         user.Email,
		EmailVerified: user.EmailVerified,
		CreatedAt:     user.CreatedAt.Unix(),
	}, nil
}
