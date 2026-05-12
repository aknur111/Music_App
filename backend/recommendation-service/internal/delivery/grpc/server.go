package grpc

import (
	"context"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	pb "github.com/music-app/recommendation-service/gen/recommendation"
	"github.com/music-app/recommendation-service/internal/domain/entity"
	"github.com/music-app/recommendation-service/internal/usecase"
)

// Server implements the gRPC RecommendationService.
type Server struct {
	pb.UnimplementedRecommendationServiceServer
	uc usecase.RecommendationUsecase
}

func NewServer(uc usecase.RecommendationUsecase) *Server {
	return &Server{uc: uc}
}

// GetRecommendationsByMood returns mood-matched tracks, with Redis-backed caching.
func (s *Server) GetRecommendationsByMood(ctx context.Context, req *pb.MoodRequest) (*pb.TracksResponse, error) {
	mood, err := entity.ParseMood(req.Mood)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, err.Error())
	}
	tracks, err := s.uc.GetByMood(ctx, mood, normalizeLimit(int(req.Limit)))
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return tracksToProto(tracks), nil
}

// GetSimilarTracks returns tracks with the highest cosine similarity to the given track.
func (s *Server) GetSimilarTracks(ctx context.Context, req *pb.SimilarRequest) (*pb.TracksResponse, error) {
	if req.TrackId == "" {
		return nil, status.Error(codes.InvalidArgument, "track_id is required")
	}
	tracks, err := s.uc.GetSimilar(ctx, req.TrackId, normalizeLimit(int(req.Limit)))
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return tracksToProto(tracks), nil
}

// GetPersonalRecommendations returns picks derived from the user's listening history.
func (s *Server) GetPersonalRecommendations(ctx context.Context, req *pb.PersonalRequest) (*pb.TracksResponse, error) {
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}
	tracks, err := s.uc.GetPersonal(ctx, req.UserId, normalizeLimit(int(req.Limit)))
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return tracksToProto(tracks), nil
}

// GetMoodRadio returns a 30-track playlist with a warm-up → peak → cool-down arc.
func (s *Server) GetMoodRadio(ctx context.Context, req *pb.MoodRadioRequest) (*pb.TracksResponse, error) {
	mood, err := entity.ParseMood(req.Mood)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, err.Error())
	}
	tracks, err := s.uc.BuildMoodRadio(ctx, mood)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return tracksToProto(tracks), nil
}

// RecordPlayback records a play event and updates the user's taste profile.
func (s *Server) RecordPlayback(ctx context.Context, req *pb.PlaybackRequest) (*pb.PlaybackResponse, error) {
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}
	if req.TrackId == "" {
		return nil, status.Error(codes.InvalidArgument, "track_id is required")
	}
	if err := s.uc.RecordPlay(ctx, req.UserId, req.TrackId); err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &pb.PlaybackResponse{Success: true}, nil
}

// ── helpers ───────────────────────────────────────────────────────────────────

// normalizeLimit defaults to 20 when n <= 0 and caps at 100.
func normalizeLimit(n int) int {
	if n <= 0 {
		return 20
	}
	if n > 100 {
		return 100
	}
	return n
}

func tracksToProto(tracks []*entity.Track) *pb.TracksResponse {
	protos := make([]*pb.TrackProto, len(tracks))
	for i, t := range tracks {
		protos[i] = trackToProto(t)
	}
	return &pb.TracksResponse{Tracks: protos}
}

func trackToProto(t *entity.Track) *pb.TrackProto {
	return &pb.TrackProto{
		Id:               t.ID,
		SpotifyId:        t.SpotifyID,
		Name:             t.Name,
		Artists:          t.Artists,
		Album:            t.Album,
		Genre:            t.Genre,
		DurationMs:       int32(t.DurationMS),
		Popularity:       int32(t.Popularity),
		Valence:          t.Valence,
		Energy:           t.Energy,
		Danceability:     t.Danceability,
		Tempo:            t.Tempo,
		Acousticness:     t.Acousticness,
		Instrumentalness: t.Instrumentalness,
		Loudness:         t.Loudness,
		Speechiness:      t.Speechiness,
		PreviewUrl:       t.PreviewURL,
	}
}
