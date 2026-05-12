package repository

import (
	"context"

	"github.com/music-app/music-service/internal/domain/entity"
)

//go:generate mockgen -source=repository.go -destination=../../usecase/mocks/mock_repository.go -package=mocks

type SongRepository interface {
	GetByID(ctx context.Context, id string) (*entity.Song, error)
	List(ctx context.Context, artistID, albumID string, page, limit int) ([]*entity.Song, int, error)
	Search(ctx context.Context, query string, page, limit int) ([]*entity.Song, int, error)

	Create(ctx context.Context, song *entity.Song) error
	Update(ctx context.Context, song *entity.Song) error
	Delete(ctx context.Context, id string) error
}

type AlbumRepository interface {
	GetByID(ctx context.Context, id string) (*entity.Album, error)
	List(ctx context.Context, artistID string, page, limit int) ([]*entity.Album, int, error)

	Create(ctx context.Context, album *entity.Album) error
}

type ArtistRepository interface {
	GetByID(ctx context.Context, id string) (*entity.Artist, error)
	List(ctx context.Context, page, limit int) ([]*entity.Artist, int, error)
	Search(ctx context.Context, query string, page, limit int) ([]*entity.Artist, int, error)

	Create(ctx context.Context, artist *entity.Artist) error
}

type SongCache interface {
	GetSong(ctx context.Context, id string) (*entity.Song, error)
	SetSong(ctx context.Context, song *entity.Song) error

	GetAlbum(ctx context.Context, id string) (*entity.Album, error)
	SetAlbum(ctx context.Context, album *entity.Album) error
}

type EventPublisher interface {
	PublishSongUploaded(
		ctx context.Context,
		songID string,
		title string,
		artist string,
		uploaderID string,
	) error
}
