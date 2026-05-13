package client

import (
	"context"

	musicpb "github.com/music-app/music-service/gen/music"
	"google.golang.org/grpc"
)

type MusicClient struct {
	grpc musicpb.MusicServiceClient
}

func NewMusicClient(conn *grpc.ClientConn) *MusicClient {
	return &MusicClient{grpc: musicpb.NewMusicServiceClient(conn)}
}

func (c *MusicClient) GetSong(ctx context.Context, id string) (interface{}, error) {
	return c.grpc.GetSong(ctx, &musicpb.GetSongRequest{SongId: id})
}

func (c *MusicClient) ListSongs(ctx context.Context, artistID, albumID string, page, limit int) (interface{}, error) {
	return c.grpc.ListSongs(ctx, &musicpb.ListSongsRequest{
		ArtistId:   artistID,
		AlbumId:    albumID,
		Pagination: &musicpb.Pagination{Page: int32(page), Limit: int32(limit)},
	})
}

func (c *MusicClient) SearchSongs(ctx context.Context, query string, page, limit int) (interface{}, error) {
	return c.grpc.SearchSongs(ctx, &musicpb.SearchSongsRequest{
		Query:      query,
		Pagination: &musicpb.Pagination{Page: int32(page), Limit: int32(limit)},
	})
}

func (c *MusicClient) GetAlbum(ctx context.Context, id string) (interface{}, error) {
	return c.grpc.GetAlbum(ctx, &musicpb.GetAlbumRequest{AlbumId: id})
}

func (c *MusicClient) ListAlbums(ctx context.Context, artistID string, page, limit int) (interface{}, error) {
	return c.grpc.ListAlbums(ctx, &musicpb.ListAlbumsRequest{
		ArtistId:   artistID,
		Pagination: &musicpb.Pagination{Page: int32(page), Limit: int32(limit)},
	})
}
