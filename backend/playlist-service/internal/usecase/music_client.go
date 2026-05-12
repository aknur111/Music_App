package usecase

import "context"

type MusicServiceClient interface {
	SongExists(ctx context.Context, songID string) (bool, error)
}
