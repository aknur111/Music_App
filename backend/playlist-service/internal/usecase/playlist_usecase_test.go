package usecase_test

import (
	"context"
	"testing"

	"github.com/music-app/playlist-service/internal/domain/entity"
	"github.com/music-app/playlist-service/internal/usecase"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type mockPlaylistRepo struct{ mock.Mock }

func (m *mockPlaylistRepo) Create(ctx context.Context, p *entity.Playlist) error {
	return m.Called(ctx, p).Error(0)
}
func (m *mockPlaylistRepo) GetByID(ctx context.Context, id, userID string) (*entity.Playlist, error) {
	args := m.Called(ctx, id, userID)
	p, _ := args.Get(0).(*entity.Playlist)
	return p, args.Error(1)
}
func (m *mockPlaylistRepo) ListByUserID(ctx context.Context, uID string, p, l int) ([]*entity.Playlist, int, error) {
	args := m.Called(ctx, uID, p, l)
	return args.Get(0).([]*entity.Playlist), args.Int(1), args.Error(2)
}
func (m *mockPlaylistRepo) AddSong(ctx context.Context, ps *entity.PlaylistSong) (int, error) {
	args := m.Called(ctx, ps)
	return args.Int(0), args.Error(1)
}
func (m *mockPlaylistRepo) RemoveSong(ctx context.Context, pID, sID, uID string) error {
	return m.Called(ctx, pID, sID, uID).Error(0)
}
func (m *mockPlaylistRepo) GetSongs(ctx context.Context, pID string) ([]*entity.PlaylistSong, error) {
	args := m.Called(ctx, pID)
	return args.Get(0).([]*entity.PlaylistSong), args.Error(1)
}
func (m *mockPlaylistRepo) Update(ctx context.Context, p *entity.Playlist) error {
	return m.Called(ctx, p).Error(0)
}
func (m *mockPlaylistRepo) Delete(ctx context.Context, id, uID string) error {
	return m.Called(ctx, id, uID).Error(0)
}
func (m *mockPlaylistRepo) AddCollaborator(ctx context.Context, pID, oID, cID string) error {
	return m.Called(ctx, pID, oID, cID).Error(0)
}

type mockMusicClient struct{ mock.Mock }

func (m *mockMusicClient) GetSong(ctx context.Context, id string) (*entity.PlaylistSong, error) {
	args := m.Called(ctx, id)
	s, _ := args.Get(0).(*entity.PlaylistSong)
	return s, args.Error(1)
}

type mockPlaylistCache struct{ mock.Mock }

func (m *mockPlaylistCache) InvalidateUserPlaylists(ctx context.Context, uID string) error {
	return m.Called(ctx, uID).Error(0)
}
func (m *mockPlaylistCache) GetUserPlaylists(ctx context.Context, uID string) ([]*entity.Playlist, error) {
	args := m.Called(ctx, uID)
	p, _ := args.Get(0).([]*entity.Playlist)
	return p, args.Error(1)
}
func (m *mockPlaylistCache) SetUserPlaylists(ctx context.Context, uID string, p []*entity.Playlist) error {
	return m.Called(ctx, uID, p).Error(0)
}

type mockPublisher struct{ mock.Mock }

func (m *mockPublisher) PublishSongAdded(ctx context.Context, pID, sID, uID, name string) error {
	return m.Called(ctx, pID, sID, uID, name).Error(0)
}

func TestGetPlaylist_Success(t *testing.T) {
	repo, cache, pub, client := new(mockPlaylistRepo), new(mockPlaylistCache), new(mockPublisher), new(mockMusicClient)
	ctx := context.Background()

	pl := &entity.Playlist{ID: "pl-1", UserID: "user-1", Name: "My Mix"}
	songs := []*entity.PlaylistSong{{SongID: "song-1", Title: "Song A"}}

	repo.On("GetByID", ctx, "pl-1", "user-1").Return(pl, nil)
	repo.On("GetSongs", ctx, "pl-1").Return(songs, nil)

	uc := usecase.NewPlaylistUsecase(repo, cache, pub, client)
	result, err := uc.GetPlaylist(ctx, "pl-1", "user-1")

	assert.NoError(t, err)
	assert.Equal(t, "My Mix", result.Name)
	assert.Len(t, result.Songs, 1)
}

func TestUpdatePlaylist_Forbidden(t *testing.T) {
	repo, cache, pub, client := new(mockPlaylistRepo), new(mockPlaylistCache), new(mockPublisher), new(mockMusicClient)
	ctx := context.Background()

	// Playlist exists but belongs to user-2
	pl := &entity.Playlist{ID: "pl-1", UserID: "user-2"}
	repo.On("GetByID", ctx, "pl-1", "user-1").Return(pl, nil)

	uc := usecase.NewPlaylistUsecase(repo, cache, pub, client)
	_, err := uc.UpdatePlaylist(ctx, "pl-1", "user-1", "New Name", "")

	assert.ErrorIs(t, err, usecase.ErrForbidden)
}

func TestAddSong_Success(t *testing.T) {
	repo, cache, pub, client := new(mockPlaylistRepo), new(mockPlaylistCache), new(mockPublisher), new(mockMusicClient)
	ctx := context.Background()

	pl := &entity.Playlist{ID: "pl-1", UserID: "user-1", Name: "Favs"}
	songData := &entity.PlaylistSong{SongID: "song-1", Title: "Hit"}

	repo.On("GetByID", ctx, "pl-1", "user-1").Return(pl, nil)
	client.On("GetSong", ctx, "song-1").Return(songData, nil)
	repo.On("AddSong", ctx, mock.Anything).Return(1, nil)
	cache.On("InvalidateUserPlaylists", ctx, "user-1").Return(nil)
	pub.On("PublishSongAdded", ctx, "pl-1", "song-1", "user-1", "Favs").Return(nil)

	uc := usecase.NewPlaylistUsecase(repo, cache, pub, client)
	pos, err := uc.AddSongToPlaylist(ctx, "pl-1", "song-1", "user-1", "", "", "", "", 0)

	assert.NoError(t, err)
	assert.Equal(t, 1, pos)
}
