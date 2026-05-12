package usecase

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
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
	CreateSong(ctx context.Context, song *entity.Song) (*entity.Song, error)
	UploadSong(ctx context.Context, song *entity.Song) (*entity.Song, error)
	GetArtist(ctx context.Context, id string) (*entity.Artist, error)
	ListArtists(ctx context.Context, page int, limit int) ([]*entity.Artist, int, error)
	SearchArtists(ctx context.Context, query string, page int, limit int) ([]*entity.Artist, int, error)
	CreateAlbum(ctx context.Context, album *entity.Album) (*entity.Album, error)
	UpdateSong(ctx context.Context, song *entity.Song) (*entity.Song, error)
	DeleteSong(ctx context.Context, id string) error
}

type musicUsecase struct {
	songs     repository.SongRepository
	albums    repository.AlbumRepository
	artists   repository.ArtistRepository
	cache     repository.SongCache
	publisher repository.EventPublisher
}

func NewMusicUsecase(
	songs repository.SongRepository,
	albums repository.AlbumRepository,
	artists repository.ArtistRepository,
	cache repository.SongCache,
	publisher repository.EventPublisher,
) MusicUsecase {
	return &musicUsecase{
		songs:     songs,
		albums:    albums,
		artists:   artists,
		cache:     cache,
		publisher: publisher,
	}
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
func (u *musicUsecase) CreateSong(
	ctx context.Context,
	song *entity.Song,
) (*entity.Song, error) {

	if song == nil {
		return nil, errors.New("song is nil")
	}

	if song.Title == "" {
		return nil, errors.New("title is required")
	}

	if song.ArtistID == "" {
		return nil, errors.New("artist_id is required")
	}

	song.ID = uuid.New().String()
	song.CreatedAt = time.Now().UTC()
	song.UpdatedAt = time.Now().UTC()

	if err := u.songs.Create(ctx, song); err != nil {
		return nil, err
	}

	return song, nil
}

func (u *musicUsecase) UploadSong(
	ctx context.Context,
	song *entity.Song,
) (*entity.Song, error) {

	created, err := u.CreateSong(ctx, song)
	if err != nil {
		return nil, err
	}

	if err := u.publisher.PublishSongUploaded(
		ctx,
		created.ID,
		created.Title,
		created.ArtistID,
		created.UploaderID,
	); err != nil {
		return nil, err
	}

	return created, nil
}

func (u *musicUsecase) GetArtist(
	ctx context.Context,
	id string,
) (*entity.Artist, error) {

	artist, err := u.artists.GetByID(
		ctx,
		id,
	)

	if err != nil {
		return nil, err
	}

	if artist == nil {
		return nil, ErrNotFound
	}

	return artist, nil
}

func (u *musicUsecase) ListArtists(
	ctx context.Context,
	page int,
	limit int,
) ([]*entity.Artist, int, error) {

	return u.artists.List(
		ctx,
		page,
		limit,
	)
}

func (u *musicUsecase) SearchArtists(
	ctx context.Context,
	query string,
	page int,
	limit int,
) ([]*entity.Artist, int, error) {

	return u.artists.Search(
		ctx,
		query,
		page,
		limit,
	)
}

func (u *musicUsecase) CreateAlbum(
	ctx context.Context,
	album *entity.Album,
) (*entity.Album, error) {

	if album == nil {
		return nil, errors.New("album is nil")
	}

	if album.Title == "" {
		return nil, errors.New("title is required")
	}

	if album.ArtistID == "" {
		return nil, errors.New("artist_id is required")
	}

	if err := u.albums.Create(
		ctx,
		album,
	); err != nil {
		return nil, err
	}

	return album, nil
}

func (u *musicUsecase) UpdateSong(
	ctx context.Context,
	song *entity.Song,
) (*entity.Song, error) {

	if song == nil {
		return nil, errors.New("song is nil")
	}

	if song.ID == "" {
		return nil, errors.New("song_id is required")
	}

	if err := u.songs.Update(
		ctx,
		song,
	); err != nil {
		return nil, err
	}

	return song, nil
}

func (u *musicUsecase) DeleteSong(
	ctx context.Context,
	id string,
) error {

	if id == "" {
		return errors.New("song_id is required")
	}

	return u.songs.Delete(
		ctx,
		id,
	)
}
