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

func (c *PlaylistClient) AddSong(ctx context.Context, playlistID, songID, userID, title, artist, coverURL, audioURL string, durationS int) (int, error) {
	resp, err := c.grpc.AddSongToPlaylist(ctx, &playlistpb.AddSongRequest{
		PlaylistId: playlistID,
		SongId:     songID,
		UserId:     userID,
		Title:      title,
		Artist:     artist,
		CoverUrl:   coverURL,
		AudioUrl:   audioURL,
		DurationS:  int32(durationS),
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

func (c *PlaylistClient) UpdatePlaylist(ctx context.Context, playlistID, userID, name, description string) (interface{}, error) {
	return c.grpc.UpdatePlaylist(ctx, &playlistpb.UpdatePlaylistRequest{
		PlaylistId:  playlistID,
		UserId:      userID,
		Name:        name,
		Description: description,
	})
}

func (c *PlaylistClient) DeletePlaylist(ctx context.Context, playlistID, userID string) error {
	_, err := c.grpc.DeletePlaylist(ctx, &playlistpb.DeletePlaylistRequest{
		PlaylistId: playlistID,
		UserId:     userID,
	})
	return err
}

func (c *PlaylistClient) AddCollaborator(ctx context.Context, playlistID, ownerID, collabID string) error {
	_, err := c.grpc.AddCollaborator(ctx, &playlistpb.AddCollaboratorRequest{
		PlaylistId:     playlistID,
		OwnerId:        ownerID,
		CollaboratorId: collabID,
	})
	return err
}
