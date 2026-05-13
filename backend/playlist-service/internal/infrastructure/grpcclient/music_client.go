package grpcclient

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	pbMusic "github.com/music-app/playlist-service/gen/music"
	"github.com/music-app/playlist-service/internal/domain/entity"
	"github.com/music-app/playlist-service/internal/usecase"
)

type musicClient struct {
	client pbMusic.MusicServiceClient
}

func NewMusicClient(conn grpc.ClientConnInterface) usecase.MusicClient {
	return &musicClient{
		client: pbMusic.NewMusicServiceClient(conn),
	}
}

func (c *musicClient) GetSong(ctx context.Context, songID string) (*entity.PlaylistSong, error) {
	resp, err := c.client.GetSong(ctx, &pbMusic.GetSongRequest{SongId: songID})
	if err != nil {
		st, ok := status.FromError(err)
		if ok && st.Code() == codes.NotFound {
			return nil, nil
		}
		return nil, err
	}

	return &entity.PlaylistSong{
		SongID:    resp.Id,
		Title:     resp.Title,
		Artist:    resp.ArtistId,
		CoverURL:  "",
		AudioURL:  "",
		DurationS: int(resp.DurationS),
	}, nil
}
