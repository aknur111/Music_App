package usecase_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/music-app/playlist-service/internal/domain/entity"
	"github.com/music-app/playlist-service/internal/usecase"
)

type mockPlaylistRepo struct{ mock.Mock }

func (m *mockPlaylistRepo) Create(ctx context.Context, p *entity.Playlist) error {
	return m.Called(ctx, p).Error(0)
}
func (m *mockPlaylistRepo) GetByID(ctx context.Context, id, userID string) (*entity.Playlist, error) {
	args := m.Called(ctx, id, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Playlist), args.Error(1)
}
func (m *mockPlaylistRepo) ListByUserID(ctx context.Context, userID string, page, limit int) ([]*entity.Playlist, int, error) {
	args := m.Called(ctx, userID, page, limit)
	return args.Get(0).([]*entity.Playlist), args.Int(1), args.Error(2)
}
func (m *mockPlaylistRepo) AddSong(ctx context.Context, ps *entity.PlaylistSong) (int, error) {
	args := m.Called(ctx, ps)
	return args.Int(0), args.Error(1)
}
func (m *mockPlaylistRepo) RemoveSong(ctx context.Context, playlistID, songID, userID string) error {
	return m.Called(ctx, playlistID, songID, userID).Error(0)
}
func (m *mockPlaylistRepo) GetSongs(ctx context.Context, playlistID string) ([]*entity.PlaylistSong, error) {
	args := m.Called(ctx, playlistID)
	return args.Get(0).([]*entity.PlaylistSong), args.Error(1)
}

type mockPlaylistCache struct{ mock.Mock }

func (m *mockPlaylistCache) InvalidateUserPlaylists(ctx context.Context, userID string) error {
	return m.Called(ctx, userID).Error(0)
}
func (m *mockPlaylistCache) GetUserPlaylists(ctx context.Context, userID string) ([]*entity.Playlist, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*entity.Playlist), args.Error(1)
}
func (m *mockPlaylistCache) SetUserPlaylists(ctx context.Context, userID string, p []*entity.Playlist) error {
	return m.Called(ctx, userID, p).Error(0)
}

type mockPublisher struct{ mock.Mock }

func (m *mockPublisher) PublishSongAdded(ctx context.Context, playlistID, songID, userID, name string) error {
	return m.Called(ctx, playlistID, songID, userID, name).Error(0)
}

func TestCreatePlaylist_Success(t *testing.T) {
	repo := new(mockPlaylistRepo)
	cache := new(mockPlaylistCache)
	pub := new(mockPublisher)

	repo.On("Create", mock.Anything, mock.AnythingOfType("*entity.Playlist")).Return(nil)
	cache.On("InvalidateUserPlaylists", mock.Anything, "user-1").Return(nil)

	uc := usecase.NewPlaylistUsecase(repo, cache, pub)
	p, err := uc.CreatePlaylist(context.Background(), "user-1", "My Playlist", "desc")

	assert.NoError(t, err)
	assert.NotEmpty(t, p.ID)
	assert.Equal(t, "My Playlist", p.Name)
}

func TestAddSong_PlaylistNotFound(t *testing.T) {
	repo := new(mockPlaylistRepo)
	cache := new(mockPlaylistCache)
	pub := new(mockPublisher)

	repo.On("GetByID", mock.Anything, "pl-1", "user-1").Return(nil, nil)

	uc := usecase.NewPlaylistUsecase(repo, cache, pub)
	_, err := uc.AddSongToPlaylist(context.Background(), "pl-1", "song-1", "user-1", "", "", "", "", 0)

	assert.ErrorIs(t, err, usecase.ErrNotFound)
}

func TestAddSong_Success(t *testing.T) {
	repo := new(mockPlaylistRepo)
	cache := new(mockPlaylistCache)
	pub := new(mockPublisher)

	pl := &entity.Playlist{ID: "pl-1", UserID: "user-1", Name: "Favs"}
	repo.On("GetByID", mock.Anything, "pl-1", "user-1").Return(pl, nil)
	repo.On("AddSong", mock.Anything, mock.AnythingOfType("*entity.PlaylistSong")).Return(1, nil)
	cache.On("InvalidateUserPlaylists", mock.Anything, "user-1").Return(nil)
	pub.On("PublishSongAdded", mock.Anything, "pl-1", "song-1", "user-1", "Favs").Return(nil)

	uc := usecase.NewPlaylistUsecase(repo, cache, pub)
	pos, err := uc.AddSongToPlaylist(context.Background(), "pl-1", "song-1", "user-1", "", "", "", "", 0)

	assert.NoError(t, err)
	assert.Equal(t, 1, pos)
}
