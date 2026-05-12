package usecase_test

import (
	"context"
	"testing"

	"github.com/music-app/music-service/internal/domain/entity"
	"github.com/music-app/music-service/internal/usecase"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type mockSongRepo struct{ mock.Mock }

func (m *mockSongRepo) GetByID(ctx context.Context, id string) (*entity.Song, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Song), args.Error(1)
}
func (m *mockSongRepo) List(ctx context.Context, artistID, albumID string, page, limit int) ([]*entity.Song, int, error) {
	args := m.Called(ctx, artistID, albumID, page, limit)
	return args.Get(0).([]*entity.Song), args.Int(1), args.Error(2)
}
func (m *mockSongRepo) Search(ctx context.Context, query string, page, limit int) ([]*entity.Song, int, error) {
	args := m.Called(ctx, query, page, limit)
	return args.Get(0).([]*entity.Song), args.Int(1), args.Error(2)
}
func (m *mockSongRepo) Create(ctx context.Context, song *entity.Song) error {
	return m.Called(ctx, song).Error(0)
}
func (m *mockSongRepo) Update(
	ctx context.Context,
	song *entity.Song,
) error {

	return m.Called(ctx, song).Error(0)
}

func (m *mockSongRepo) Delete(
	ctx context.Context,
	id string,
) error {

	return m.Called(ctx, id).Error(0)
}

type mockAlbumRepo struct{ mock.Mock }

func (m *mockAlbumRepo) GetByID(ctx context.Context, id string) (*entity.Album, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Album), args.Error(1)
}
func (m *mockAlbumRepo) List(ctx context.Context, artistID string, page, limit int) ([]*entity.Album, int, error) {
	args := m.Called(ctx, artistID, page, limit)
	return args.Get(0).([]*entity.Album), args.Int(1), args.Error(2)
}
func (m *mockAlbumRepo) Create(ctx context.Context, album *entity.Album) error {
	return m.Called(ctx, album).Error(0)
}

type mockArtistRepo struct{ mock.Mock }

func (m *mockArtistRepo) GetByID(
	ctx context.Context,
	id string,
) (*entity.Artist, error) {

	args := m.Called(ctx, id)

	if args.Get(0) == nil {
		return nil, args.Error(1)
	}

	return args.Get(0).(*entity.Artist), args.Error(1)
}

func (m *mockArtistRepo) List(
	ctx context.Context,
	page, limit int,
) ([]*entity.Artist, int, error) {

	args := m.Called(ctx, page, limit)

	return args.Get(0).([]*entity.Artist),
		args.Int(1),
		args.Error(2)
}

func (m *mockArtistRepo) Search(
	ctx context.Context,
	query string,
	page, limit int,
) ([]*entity.Artist, int, error) {

	args := m.Called(ctx, query, page, limit)

	return args.Get(0).([]*entity.Artist),
		args.Int(1),
		args.Error(2)
}

func (m *mockArtistRepo) Create(
	ctx context.Context,
	artist *entity.Artist,
) error {

	return m.Called(ctx, artist).Error(0)
}

type mockCache struct{ mock.Mock }

func (m *mockCache) GetSong(ctx context.Context, id string) (*entity.Song, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Song), args.Error(1)
}
func (m *mockCache) SetSong(ctx context.Context, song *entity.Song) error {
	return m.Called(ctx, song).Error(0)
}
func (m *mockCache) GetAlbum(ctx context.Context, id string) (*entity.Album, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Album), args.Error(1)
}
func (m *mockCache) SetAlbum(ctx context.Context, album *entity.Album) error {
	return m.Called(ctx, album).Error(0)
}

type mockPublisher struct{ mock.Mock }

func (m *mockPublisher) PublishSongUploaded(
	ctx context.Context,
	songID string,
	title string,
	artist string,
	uploaderID string,
) error {

	return m.Called(
		ctx,
		songID,
		title,
		artist,
		uploaderID,
	).Error(0)
}

func TestGetSong_CacheHit(t *testing.T) {
	songs := new(mockSongRepo)
	artists := new(mockArtistRepo)
	publisher := new(mockPublisher)
	albums := new(mockAlbumRepo)
	cache := new(mockCache)

	expected := &entity.Song{ID: "s1", Title: "Test Song"}
	cache.On("GetSong", mock.Anything, "s1").Return(expected, nil)

	uc := usecase.NewMusicUsecase(
		songs,
		albums,
		artists,
		cache,
		publisher,
	)

	song, err := uc.GetSong(context.Background(), "s1")

	assert.NoError(t, err)
	assert.Equal(t, expected.Title, song.Title)
	songs.AssertNotCalled(t, "GetByID")
}

func TestGetSong_CacheMiss_DBHit(t *testing.T) {
	songs := new(mockSongRepo)
	albums := new(mockAlbumRepo)
	cache := new(mockCache)

	expected := &entity.Song{ID: "s1", Title: "DB Song"}
	cache.On("GetSong", mock.Anything, "s1").Return(nil, nil)
	songs.On("GetByID", mock.Anything, "s1").Return(expected, nil)
	cache.On("SetSong", mock.Anything, expected).Return(nil)

	artists := new(mockArtistRepo)
	publisher := new(mockPublisher)

	uc := usecase.NewMusicUsecase(
		songs,
		albums,
		artists,
		cache,
		publisher,
	)
	song, err := uc.GetSong(context.Background(), "s1")

	assert.NoError(t, err)
	assert.Equal(t, "DB Song", song.Title)
}

func TestGetSong_NotFound(t *testing.T) {
	songs := new(mockSongRepo)
	albums := new(mockAlbumRepo)
	cache := new(mockCache)

	cache.On("GetSong", mock.Anything, "x").Return(nil, nil)
	songs.On("GetByID", mock.Anything, "x").Return(nil, nil)

	artists := new(mockArtistRepo)
	publisher := new(mockPublisher)

	uc := usecase.NewMusicUsecase(
		songs,
		albums,
		artists,
		cache,
		publisher,
	)
	_, err := uc.GetSong(context.Background(), "x")

	assert.ErrorIs(t, err, usecase.ErrNotFound)
}
