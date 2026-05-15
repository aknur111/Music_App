package postgres

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/music-app/music-service/internal/domain/entity"
	"github.com/music-app/music-service/internal/domain/repository"
)

type albumRepository struct {
	db *pgxpool.Pool
}

func NewAlbumRepository(db *pgxpool.Pool) repository.AlbumRepository {
	return &albumRepository{db: db}
}

func (r *albumRepository) GetByID(ctx context.Context, id string) (*entity.Album, error) {
	row := r.db.QueryRow(ctx,
		`SELECT al.id, al.title, al.artist_id, COALESCE(a.name,''), al.year, al.created_at, COALESCE(al.cover_url,'')
		 FROM albums al
		 LEFT JOIN artists a ON a.id = al.artist_id
		 WHERE al.id = $1`, id,
	)
	a := &entity.Album{}
	err := row.Scan(&a.ID, &a.Title, &a.ArtistID, &a.Artist, &a.Year, &a.CreatedAt, &a.CoverUrl)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return a, err
}

func (r *albumRepository) List(
	ctx context.Context,
	artistID string,
	page,
	limit int,
) ([]*entity.Album, int, error) {

	offset := (page - 1) * limit

	query := `
		SELECT al.id, al.title, al.artist_id, COALESCE(a.name,''), al.year, al.created_at, COALESCE(al.cover_url,'')
		FROM albums al
		LEFT JOIN artists a ON a.id = al.artist_id
	`

	countQuery := `
		SELECT COUNT(*)
		FROM albums
	`

	args := []any{}
	countArgs := []any{}

	if artistID != "" {
		query += ` WHERE al.artist_id = $1`
		countQuery += ` WHERE artist_id = $1`

		args = append(args, artistID)
		countArgs = append(countArgs, artistID)
	}

	query += `
		ORDER BY al.year DESC, al.title
		LIMIT $` + func() string {
		if artistID != "" {
			return "2"
		}
		return "1"
	}() + `
		OFFSET $` + func() string {
		if artistID != "" {
			return "3"
		}
		return "2"
	}()

	args = append(args, limit, offset)

	rows, err := r.db.Query(
		ctx,
		query,
		args...,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var albums []*entity.Album

	for rows.Next() {

		a := &entity.Album{}

		if err := rows.Scan(
			&a.ID,
			&a.Title,
			&a.ArtistID,
			&a.Artist,
			&a.Year,
			&a.CreatedAt,
			&a.CoverUrl,
		); err != nil {

			return nil, 0, err
		}

		albums = append(
			albums,
			a,
		)
	}

	var total int

	if err := r.db.QueryRow(
		ctx,
		countQuery,
		countArgs...,
	).Scan(&total); err != nil {

		return nil, 0, err
	}

	return albums, total, nil
}

func (r *albumRepository) Create(ctx context.Context, a *entity.Album) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO albums (id, title, artist_id, year) VALUES ($1, $2, $3, $4)`,
		a.ID, a.Title, a.ArtistID, a.Year,
	)
	return err
}
