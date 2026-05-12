package client

import (
	"context"

	playlistpb "github.com/music-app/playlist-service/gen/playlist"
	"google.golang.org/grpc"
)

type PlaylistClient struct {
	grpc playlistpb.PlaylistServiceClient
}

func NewPlaylistClient(conn *grpc.ClientConn) *PlaylistClient {
	return &PlaylistClient{grpc: playlistpb.NewPlaylistServiceClient(conn)}
}

func (c *PlaylistClient) CreatePlaylist(ctx context.Context, userID, name, desc string) (interface{}, error) {
	return c.grpc.CreatePlaylist(ctx, &playlistpb.CreatePlaylistRequest{
		UserId:      userID,
		Name:        name,
		Description: desc,
	})
}

func (c *PlaylistClient) GetPlaylist(ctx context.Context, id, userID string) (interface{}, error) {
	return c.grpc.GetPlaylist(ctx, &playlistpb.GetPlaylistRequest{
		PlaylistId: id,
		UserId:     userID,
	})
}

func (c *PlaylistClient) ListPlaylists(ctx context.Context, userID string, page, limit int) (interface{}, error) {
	return c.grpc.ListUserPlaylists(ctx, &playlistpb.ListUserPlaylistsRequest{
		UserId: userID,
		Page:   int32(page),
		Limit:  int32(limit),
	})
}

func (c *PlaylistClient) AddSong(ctx context.Context, playlistID, songID, userID string) (int, error) {
	resp, err := c.grpc.AddSongToPlaylist(ctx, &playlistpb.AddSongRequest{
		PlaylistId: playlistID,
		SongId:     songID,
		UserId:     userID,
	})
	if err != nil {
		return 0, err
	}
	return int(resp.Position), nil
}

func (c *PlaylistClient) RemoveSong(ctx context.Context, playlistID, songID, userID string) error {
	_, err := c.grpc.RemoveSongFromPlaylist(ctx, &playlistpb.RemoveSongRequest{
		PlaylistId: playlistID,
		SongId:     songID,
		UserId:     userID,
	})
	return err
}
