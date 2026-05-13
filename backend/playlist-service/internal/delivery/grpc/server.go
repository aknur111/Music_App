package grpc

import (
	"context"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	pb "github.com/music-app/playlist-service/gen/playlist"
	"github.com/music-app/playlist-service/internal/usecase"
)

type Server struct {
	pb.UnimplementedPlaylistServiceServer
	uc usecase.PlaylistUsecase
}

func NewServer(uc usecase.PlaylistUsecase) *Server {
	return &Server{uc: uc}
}

func (s *Server) CreatePlaylist(ctx context.Context, req *pb.CreatePlaylistRequest) (*pb.Playlist, error) {
	p, err := s.uc.CreatePlaylist(ctx, req.UserId, req.Name, req.Description)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &pb.Playlist{
		Id:          p.ID,
		UserId:      p.UserID,
		Name:        p.Name,
		Description: p.Description,
		SongCount:   int32(p.SongCount),
		CreatedAt:   p.CreatedAt.Unix(),
		UpdatedAt:   p.UpdatedAt.Unix(),
	}, nil
}

func (s *Server) GetPlaylist(ctx context.Context, req *pb.GetPlaylistRequest) (*pb.Playlist, error) {
	p, err := s.uc.GetPlaylist(ctx, req.PlaylistId, req.UserId)
	if err != nil {
		if err == usecase.ErrNotFound {
			return nil, status.Error(codes.NotFound, "playlist not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	var pbSongs []*pb.PlaylistSong
	for _, s := range p.Songs {
		pbSongs = append(pbSongs, &pb.PlaylistSong{
			SongId:    s.SongID,
			Title:     s.Title,
			Artist:    s.Artist,
			CoverUrl:  s.CoverURL,
			AudioUrl:  s.AudioURL,
			DurationS: int32(s.DurationS),
			Position:  int32(s.Position),
		})
	}
	return &pb.Playlist{
		Id:          p.ID,
		UserId:      p.UserID,
		Name:        p.Name,
		Description: p.Description,
		Songs:       pbSongs,
		SongCount:   int32(p.SongCount),
		CreatedAt:   p.CreatedAt.Unix(),
		UpdatedAt:   p.UpdatedAt.Unix(),
	}, nil
}

func (s *Server) ListUserPlaylists(ctx context.Context, req *pb.ListUserPlaylistsRequest) (*pb.ListUserPlaylistsResponse, error) {
	page, limit := int(req.Page), int(req.Limit)
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	playlists, total, err := s.uc.ListUserPlaylists(ctx, req.UserId, page, limit)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	var pbPlaylists []*pb.Playlist
	for _, p := range playlists {
		pbPlaylists = append(pbPlaylists, &pb.Playlist{
			Id:          p.ID,
			UserId:      p.UserID,
			Name:        p.Name,
			Description: p.Description,
			SongCount:   int32(p.SongCount),
			CreatedAt:   p.CreatedAt.Unix(),
			UpdatedAt:   p.UpdatedAt.Unix(),
		})
	}
	return &pb.ListUserPlaylistsResponse{Playlists: pbPlaylists, Total: int32(total)}, nil
}

func (s *Server) AddSongToPlaylist(ctx context.Context, req *pb.AddSongRequest) (*pb.AddSongResponse, error) {
	position, err := s.uc.AddSongToPlaylist(
		ctx, req.PlaylistId, req.SongId, req.UserId,
		req.Title, req.Artist, req.CoverUrl, req.AudioUrl, int(req.DurationS),
	)
	if err != nil {
		if err == usecase.ErrNotFound {
			return nil, status.Error(codes.NotFound, "playlist not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &pb.AddSongResponse{Success: true, Position: int32(position)}, nil
}

func (s *Server) RemoveSongFromPlaylist(ctx context.Context, req *pb.RemoveSongRequest) (*pb.RemoveSongResponse, error) {
	if err := s.uc.RemoveSongFromPlaylist(ctx, req.PlaylistId, req.SongId, req.UserId); err != nil {
		if err == usecase.ErrNotFound {
			return nil, status.Error(codes.NotFound, "playlist not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &pb.RemoveSongResponse{Success: true}, nil
}

func (s *Server) UpdatePlaylist(ctx context.Context, req *pb.UpdatePlaylistRequest) (*pb.Playlist, error) {
	p, err := s.uc.UpdatePlaylist(ctx, req.PlaylistId, req.UserId, req.Name, req.Description)
	if err != nil {
		if err == usecase.ErrNotFound {
			return nil, status.Error(codes.NotFound, "playlist not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &pb.Playlist{
		Id:          p.ID,
		UserId:      p.UserID,
		Name:        p.Name,
		Description: p.Description,
		SongCount:   int32(p.SongCount),
		CreatedAt:   p.CreatedAt.Unix(),
		UpdatedAt:   p.UpdatedAt.Unix(),
	}, nil
}

func (s *Server) DeletePlaylist(ctx context.Context, req *pb.DeletePlaylistRequest) (*pb.DeletePlaylistResponse, error) {
	if err := s.uc.DeletePlaylist(ctx, req.PlaylistId, req.UserId); err != nil {
		if err == usecase.ErrNotFound {
			return nil, status.Error(codes.NotFound, "playlist not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &pb.DeletePlaylistResponse{Success: true}, nil
}
