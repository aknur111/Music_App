package usecase

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/music-app/playlist-service/internal/domain/entity"
	"github.com/music-app/playlist-service/internal/domain/repository"
)

var (
	ErrNotFound    = errors.New("not found")
	ErrForbidden   = errors.New("forbidden")
	ErrInvalidSong = errors.New("song does not exist in music service")
)

type EventPublisher interface {
	PublishSongAdded(ctx context.Context, playlistID, songID, userID, playlistName string) error
}

type PlaylistUsecase interface {
	CreatePlaylist(ctx context.Context, userID, name, description string) (*entity.Playlist, error)
	GetPlaylist(ctx context.Context, id, userID string) (*entity.Playlist, error)
	ListUserPlaylists(ctx context.Context, userID string, page, limit int) ([]*entity.Playlist, int, error)
	AddSongToPlaylist(ctx context.Context, playlistID, songID, userID string) (int, error)
	RemoveSongFromPlaylist(ctx context.Context, playlistID, songID, userID string) error
	AddCollaborator(ctx context.Context, playlistID, ownerID, collaboratorID string) error
	RemoveCollaborator(ctx context.Context, playlistID, ownerID, collaboratorID string) error
}

type playlistUsecase struct {
	repo         repository.PlaylistRepository
	cache        repository.PlaylistCache
	publisher    EventPublisher
	musicService MusicServiceClient
}

func NewPlaylistUsecase(
	repo repository.PlaylistRepository,
	cache repository.PlaylistCache,
	publisher EventPublisher,
	musicService MusicServiceClient,
) PlaylistUsecase {
	return &playlistUsecase{
		repo:         repo,
		cache:        cache,
		publisher:    publisher,
		musicService: musicService,
	}
}

func (u *playlistUsecase) CreatePlaylist(ctx context.Context, userID, name, description string) (*entity.Playlist, error) {
	p := &entity.Playlist{
		ID:          uuid.NewString(),
		UserID:      userID,
		Name:        name,
		Description: description,
		CreatedAt:   time.Now().UTC(),
		UpdatedAt:   time.Now().UTC(),
	}

	if err := u.repo.Create(ctx, p); err != nil {
		return nil, err
	}

	_ = u.cache.InvalidateUserPlaylists(ctx, userID)
	return p, nil
}

func (u *playlistUsecase) GetPlaylist(ctx context.Context, id, userID string) (*entity.Playlist, error) {
	p, err := u.repo.GetByID(ctx, id, userID)
	if err != nil {
		return nil, err
	}
	if p == nil {
		return nil, ErrNotFound
	}
	return p, nil
}

func (u *playlistUsecase) ListUserPlaylists(ctx context.Context, userID string, page, limit int) ([]*entity.Playlist, int, error) {
	if cached, err := u.cache.GetUserPlaylists(ctx, userID); err == nil && len(cached) > 0 {
		return cached, len(cached), nil
	}

	playlists, total, err := u.repo.ListByUserID(ctx, userID, page, limit)
	if err != nil {
		return nil, 0, err
	}

	_ = u.cache.SetUserPlaylists(ctx, userID, playlists)
	return playlists, total, nil
}

func (u *playlistUsecase) AddSongToPlaylist(ctx context.Context, playlistID, songID, userID string) (int, error) {
	p, err := u.repo.GetByID(ctx, playlistID, userID)
	if err != nil || p == nil {
		return 0, ErrNotFound
	}

	exists, err := u.musicService.SongExists(ctx, songID)
	if err != nil {
		return 0, err
	}
	if !exists {
		return 0, ErrInvalidSong
	}

	ps := &entity.PlaylistSong{
		PlaylistID: playlistID,
		SongID:     songID,
		AddedAt:    time.Now().UTC(),
	}

	position, err := u.repo.AddSong(ctx, ps)
	if err != nil {
		return 0, err
	}

	_ = u.cache.InvalidateUserPlaylists(ctx, userID)
	_ = u.publisher.PublishSongAdded(ctx, playlistID, songID, userID, p.Name)

	return position, nil
}

func (u *playlistUsecase) RemoveSongFromPlaylist(ctx context.Context, playlistID, songID, userID string) error {
	p, err := u.repo.GetByID(ctx, playlistID, userID)
	if err != nil || p == nil {
		return ErrNotFound
	}

	if err := u.repo.RemoveSong(ctx, playlistID, songID, userID); err != nil {
		return err
	}

	_ = u.cache.InvalidateUserPlaylists(ctx, userID)
	return nil
}

func (u *playlistUsecase) AddCollaborator(ctx context.Context, playlistID, ownerID, collaboratorID string) error {
	p, err := u.repo.GetByID(ctx, playlistID, ownerID)
	if err != nil || p == nil {
		return ErrNotFound
	}
	if p.UserID != ownerID {
		return ErrForbidden
	}

	if err := u.repo.AddCollaborator(ctx, playlistID, collaboratorID); err != nil {
		return err
	}

	_ = u.cache.InvalidateUserPlaylists(ctx, ownerID)
	_ = u.cache.InvalidateUserPlaylists(ctx, collaboratorID)
	return nil
}
func (u *playlistUsecase) RemoveCollaborator(ctx context.Context, playlistID, ownerID, collaboratorID string) error {
	p, err := u.repo.GetByID(ctx, playlistID, ownerID)
	if err != nil || p == nil {
		return ErrNotFound
	}
	if p.UserID != ownerID {
		return ErrForbidden
	}

	if err := u.repo.RemoveCollaborator(ctx, playlistID, collaboratorID); err != nil {
		return err
	}

	_ = u.cache.InvalidateUserPlaylists(ctx, ownerID)
	_ = u.cache.InvalidateUserPlaylists(ctx, collaboratorID)
	return nil
}
