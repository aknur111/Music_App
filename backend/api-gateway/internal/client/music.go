package client

import (
	"context"

	musicpb "github.com/NoneNon9/Music-app-gen/music"
	"google.golang.org/grpc"
)

type MusicClient struct {
	grpc musicpb.MusicServiceClient
}

func NewMusicClient(conn *grpc.ClientConn) *MusicClient {
	return &MusicClient{
		grpc: musicpb.NewMusicServiceClient(conn),
	}
}

func (c *MusicClient) GetSong(ctx context.Context, id string) (interface{}, error) {
	resp, err := c.grpc.GetSong(ctx, &musicpb.GetSongRequest{
		SongId: id,
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (c *MusicClient) ListSongs(ctx context.Context, artistID, albumID string, page, limit int) (interface{}, error) {
	req := &musicpb.ListSongsRequest{
		Pagination: &musicpb.Pagination{
			Page:  int32(page),
			Limit: int32(limit),
		},
	}

	if artistID != "" {
		req.ArtistId = artistID
	}

	if albumID != "" {
		req.AlbumId = albumID
	}

	resp, err := c.grpc.ListSongs(ctx, req)
	if err != nil {
		return nil, err
	}

	return resp, nil
}

func (c *MusicClient) SearchSongs(ctx context.Context, query string, page, limit int) (interface{}, error) {
	resp, err := c.grpc.SearchSongs(ctx, &musicpb.SearchSongsRequest{
		Query: query,
		Pagination: &musicpb.Pagination{
			Page:  int32(page),
			Limit: int32(limit),
		},
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (c *MusicClient) GetArtist(ctx context.Context, id string) (interface{}, error) {
	resp, err := c.grpc.GetArtist(ctx, &musicpb.GetArtistRequest{
		ArtistId: id,
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (c *MusicClient) ListArtists(ctx context.Context, page, limit int) (interface{}, error) {
	resp, err := c.grpc.ListArtists(ctx, &musicpb.ListArtistsRequest{
		Pagination: &musicpb.Pagination{
			Page:  int32(page),
			Limit: int32(limit),
		},
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (c *MusicClient) SearchArtists(ctx context.Context, query string, page, limit int) (interface{}, error) {
	resp, err := c.grpc.SearchArtists(ctx, &musicpb.SearchArtistsRequest{
		Query: query,
		Pagination: &musicpb.Pagination{
			Page:  int32(page),
			Limit: int32(limit),
		},
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (c *MusicClient) UploadSong(
	ctx context.Context,
	title,
	artistID,
	albumID string,
	duration int,
	genre,
	uploaderID string,
) (interface{}, error) {

	resp, err := c.grpc.UploadSong(
		ctx,
		&musicpb.UploadSongRequest{
			Title:      title,
			ArtistId:   artistID,
			AlbumId:    albumID,
			DurationS:  int32(duration),
			Genre:      genre,
			UploaderId: uploaderID,
		},
	)

	if err != nil {
		return nil, err
	}

	return resp, nil
}
