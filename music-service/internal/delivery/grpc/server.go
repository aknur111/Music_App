package grpc

import (
	"context"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	pb "github.com/music-app/music-service/gen/music"
	"github.com/music-app/music-service/internal/domain/entity"
	"github.com/music-app/music-service/internal/usecase"
)

type Server struct {
	pb.UnimplementedMusicServiceServer
	uc usecase.MusicUsecase
}

func NewServer(uc usecase.MusicUsecase) *Server {
	return &Server{uc: uc}
}

func (s *Server) GetSong(ctx context.Context, req *pb.GetSongRequest) (*pb.Song, error) {
	song, err := s.uc.GetSong(ctx, req.SongId)
	if err != nil {
		if err == usecase.ErrNotFound {
			return nil, status.Error(codes.NotFound, "song not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return songToProto(song), nil
}

func (s *Server) ListSongs(ctx context.Context, req *pb.ListSongsRequest) (*pb.ListSongsResponse, error) {
	page, limit := int(req.Pagination.GetPage()), int(req.Pagination.GetLimit())
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	songs, total, err := s.uc.ListSongs(ctx, req.ArtistId, req.AlbumId, page, limit)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	var pbSongs []*pb.Song
	for _, s := range songs {
		pbSongs = append(pbSongs, songToProto(s))
	}
	return &pb.ListSongsResponse{Songs: pbSongs, Total: int32(total)}, nil
}

func (s *Server) SearchSongs(ctx context.Context, req *pb.SearchSongsRequest) (*pb.SearchSongsResponse, error) {
	page, limit := int(req.Pagination.GetPage()), int(req.Pagination.GetLimit())
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	songs, total, err := s.uc.SearchSongs(ctx, req.Query, page, limit)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	var pbSongs []*pb.Song
	for _, s := range songs {
		pbSongs = append(pbSongs, songToProto(s))
	}
	return &pb.SearchSongsResponse{Songs: pbSongs, Total: int32(total)}, nil
}

func (s *Server) GetAlbum(ctx context.Context, req *pb.GetAlbumRequest) (*pb.Album, error) {
	album, err := s.uc.GetAlbum(ctx, req.AlbumId)
	if err != nil {
		if err == usecase.ErrNotFound {
			return nil, status.Error(codes.NotFound, "album not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return albumToProto(album), nil
}

func (s *Server) ListAlbums(ctx context.Context, req *pb.ListAlbumsRequest) (*pb.ListAlbumsResponse, error) {
	page, limit := int(req.Pagination.GetPage()), int(req.Pagination.GetLimit())
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	albums, total, err := s.uc.ListAlbums(ctx, req.ArtistId, page, limit)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	var pbAlbums []*pb.Album
	for _, a := range albums {
		pbAlbums = append(pbAlbums, albumToProto(a))
	}
	return &pb.ListAlbumsResponse{Albums: pbAlbums, Total: int32(total)}, nil
}

func songToProto(s *entity.Song) *pb.Song {
	return &pb.Song{
		Id:        s.ID,
		Title:     s.Title,
		ArtistId:  s.ArtistID,
		AlbumId:   s.AlbumID,
		DurationS: int32(s.DurationS),
		Genre:     s.Genre,
		CreatedAt: s.CreatedAt.Unix(),
	}
}

func albumToProto(a *entity.Album) *pb.Album {
	return &pb.Album{
		Id:       a.ID,
		Title:    a.Title,
		ArtistId: a.ArtistID,
		Year:     int32(a.Year),
	}
}
