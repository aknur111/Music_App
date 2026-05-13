package repository

import (
	"context"

	"github.com/music-app/playlist-service/internal/domain/entity"
)

//go:generate mockgen -source=repository.go -destination=../../usecase/mocks/mock_repository.go -package=mocks

type PlaylistRepository interface {
	Create(ctx context.Context, p *entity.Playlist) error
	GetByID(ctx context.Context, id, userID string) (*entity.Playlist, error)
	ListByUserID(ctx context.Context, userID string, page, limit int) ([]*entity.Playlist, int, error)
	AddSong(ctx context.Context, ps *entity.PlaylistSong) (int, error)
	RemoveSong(ctx context.Context, playlistID, songID, userID string) error
	GetSongs(ctx context.Context, playlistID string) ([]*entity.PlaylistSong, error)
	Update(ctx context.Context, p *entity.Playlist) error
	Delete(ctx context.Context, id, userID string) error
	AddCollaborator(ctx context.Context, playlistID, ownerID, collaboratorID string) error
}

type PlaylistCache interface {
	InvalidateUserPlaylists(ctx context.Context, userID string) error
	GetUserPlaylists(ctx context.Context, userID string) ([]*entity.Playlist, error)
	SetUserPlaylists(ctx context.Context, userID string, playlists []*entity.Playlist) error
}
