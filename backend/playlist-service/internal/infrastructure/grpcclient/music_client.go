package grpcclient

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	pbMusic "github.com/NoneNon9/Music-app-gen/music"
	"github.com/music-app/playlist-service/internal/usecase"
)

type musicClient struct {
	client pbMusic.MusicServiceClient
}

func NewMusicClient(conn grpc.ClientConnInterface) usecase.MusicServiceClient {
	return &musicClient{
		client: pbMusic.NewMusicServiceClient(conn),
	}
}

func (c *musicClient) SongExists(ctx context.Context, songID string) (bool, error) {
	_, err := c.client.GetSong(ctx, &pbMusic.GetSongRequest{SongId: songID})
	if err != nil {
		st, ok := status.FromError(err)
		if ok && st.Code() == codes.NotFound {
			return false, nil
		}
		return false, err
	}
	return true, nil
}
