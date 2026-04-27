package usecase

import (
	"context"
	"errors"

	"github.com/music-app/music-service/internal/domain/entity"
	"github.com/music-app/music-service/internal/domain/repository"
)

var ErrNotFound = errors.New("not found")

type MusicUsecase interface {
	GetSong(ctx context.Context, id string) (*entity.Song, error)
	ListSongs(ctx context.Context, artistID, albumID string, page, limit int) ([]*entity.Song, int, error)
	SearchSongs(ctx context.Context, query string, page, limit int) ([]*entity.Song, int, error)
	GetAlbum(ctx context.Context, id string) (*entity.Album, error)
	ListAlbums(ctx context.Context, artistID string, page, limit int) ([]*entity.Album, int, error)
}

type musicUsecase struct {
	songs  repository.SongRepository
	albums repository.AlbumRepository
	cache  repository.SongCache
}

func NewMusicUsecase(songs repository.SongRepository, albums repository.AlbumRepository, cache repository.SongCache) MusicUsecase {
	return &musicUsecase{songs: songs, albums: albums, cache: cache}
}

func (u *musicUsecase) GetSong(ctx context.Context, id string) (*entity.Song, error) {
	if cached, err := u.cache.GetSong(ctx, id); err == nil && cached != nil {
		return cached, nil
	}
	song, err := u.songs.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if song == nil {
		return nil, ErrNotFound
	}
	_ = u.cache.SetSong(ctx, song)
	return song, nil
}

func (u *musicUsecase) ListSongs(ctx context.Context, artistID, albumID string, page, limit int) ([]*entity.Song, int, error) {
	return u.songs.List(ctx, artistID, albumID, page, limit)
}

func (u *musicUsecase) SearchSongs(ctx context.Context, query string, page, limit int) ([]*entity.Song, int, error) {
	return u.songs.Search(ctx, query, page, limit)
}

func (u *musicUsecase) GetAlbum(ctx context.Context, id string) (*entity.Album, error) {
	if cached, err := u.cache.GetAlbum(ctx, id); err == nil && cached != nil {
		return cached, nil
	}
	album, err := u.albums.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if album == nil {
		return nil, ErrNotFound
	}
	_ = u.cache.SetAlbum(ctx, album)
	return album, nil
}

func (u *musicUsecase) ListAlbums(ctx context.Context, artistID string, page, limit int) ([]*entity.Album, int, error) {
	return u.albums.List(ctx, artistID, page, limit)
}
