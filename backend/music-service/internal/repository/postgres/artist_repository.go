package postgres

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/music-app/music-service/internal/domain/entity"
	"github.com/music-app/music-service/internal/domain/repository"
)

type artistRepository struct {
	db *pgxpool.Pool
}

func NewArtistRepository(
	db *pgxpool.Pool,
) repository.ArtistRepository {
	return &artistRepository{db: db}
}

func (r *artistRepository) GetByID(
	ctx context.Context,
	id string,
) (*entity.Artist, error) {

	row := r.db.QueryRow(
		ctx,
		`SELECT id, name, bio, created_at
		 FROM artists
		 WHERE id = $1`,
		id,
	)

	a := &entity.Artist{}

	err := row.Scan(
		&a.ID,
		&a.Name,
		&a.Bio,
		&a.CreatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}

	return a, err
}

func (r *artistRepository) List(
	ctx context.Context,
	page, limit int,
) ([]*entity.Artist, int, error) {

	offset := (page - 1) * limit

	rows, err := r.db.Query(
		ctx,
		`SELECT id, name, bio, created_at
		 FROM artists
		 ORDER BY name
		 LIMIT $1 OFFSET $2`,
		limit,
		offset,
	)

	if err != nil {
		return nil, 0, err
	}

	defer rows.Close()

	var artists []*entity.Artist

	for rows.Next() {
		a := &entity.Artist{}

		if err := rows.Scan(
			&a.ID,
			&a.Name,
			&a.Bio,
			&a.CreatedAt,
		); err != nil {
			return nil, 0, err
		}

		artists = append(artists, a)
	}

	var total int

	_ = r.db.QueryRow(
		ctx,
		`SELECT COUNT(*) FROM artists`,
	).Scan(&total)

	return artists, total, nil
}

func (r *artistRepository) Search(
	ctx context.Context,
	query string,
	page, limit int,
) ([]*entity.Artist, int, error) {

	offset := (page - 1) * limit

	rows, err := r.db.Query(
		ctx,
		`SELECT id, name, bio, created_at
		 FROM artists
		 WHERE name ILIKE '%' || $1 || '%'
		 ORDER BY name
		 LIMIT $2 OFFSET $3`,
		query,
		limit,
		offset,
	)

	if err != nil {
		return nil, 0, err
	}

	defer rows.Close()

	var artists []*entity.Artist

	for rows.Next() {
		a := &entity.Artist{}

		if err := rows.Scan(
			&a.ID,
			&a.Name,
			&a.Bio,
			&a.CreatedAt,
		); err != nil {
			return nil, 0, err
		}

		artists = append(artists, a)
	}

	var total int

	_ = r.db.QueryRow(
		ctx,
		`SELECT COUNT(*)
		 FROM artists
		 WHERE name ILIKE '%' || $1 || '%'`,
		query,
	).Scan(&total)

	return artists, total, nil
}

func (r *artistRepository) Create(
	ctx context.Context,
	a *entity.Artist,
) error {

	_, err := r.db.Exec(
		ctx,
		`INSERT INTO artists
		 (id, name, bio)
		 VALUES ($1, $2, $3)`,
		a.ID,
		a.Name,
		a.Bio,
	)

	return err
}
