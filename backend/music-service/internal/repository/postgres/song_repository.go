package postgres

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/music-app/music-service/internal/domain/entity"
	"github.com/music-app/music-service/internal/domain/repository"
)

type songRepository struct {
	db *pgxpool.Pool
}

func NewSongRepository(db *pgxpool.Pool) repository.SongRepository {
	return &songRepository{db: db}
}

func (r *songRepository) GetByID(ctx context.Context, id string) (*entity.Song, error) {
	row := r.db.QueryRow(ctx,
		`SELECT id, title, artist_id, COALESCE(album_id::text,''), duration_s, COALESCE(genre,''), created_at
		 FROM songs WHERE id = $1`, id,
	)
	s := &entity.Song{}
	err := row.Scan(&s.ID, &s.Title, &s.ArtistID, &s.AlbumID, &s.DurationS, &s.Genre, &s.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return s, err
}

func (r *songRepository) List(ctx context.Context, artistID, albumID string, page, limit int) ([]*entity.Song, int, error) {
	offset := (page - 1) * limit
	rows, err := r.db.Query(ctx,
		`SELECT id, title, artist_id, COALESCE(album_id::text,''), duration_s, COALESCE(genre,''), created_at
		 FROM songs
		 WHERE ($1 = '' OR artist_id::text = $1)
		   AND ($2 = '' OR album_id::text  = $2)
		 ORDER BY created_at DESC
		 LIMIT $3 OFFSET $4`,
		artistID, albumID, limit, offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var songs []*entity.Song
	for rows.Next() {
		s := &entity.Song{}
		if err := rows.Scan(&s.ID, &s.Title, &s.ArtistID, &s.AlbumID, &s.DurationS, &s.Genre, &s.CreatedAt); err != nil {
			return nil, 0, err
		}
		songs = append(songs, s)
	}

	var total int
	_ = r.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM songs
		 WHERE ($1 = '' OR artist_id::text = $1) AND ($2 = '' OR album_id::text = $2)`,
		artistID, albumID,
	).Scan(&total)

	return songs, total, nil
}

func (r *songRepository) Search(ctx context.Context, query string, page, limit int) ([]*entity.Song, int, error) {
	offset := (page - 1) * limit
	rows, err := r.db.Query(ctx,
		`SELECT id, title, artist_id, COALESCE(album_id::text,''), duration_s, COALESCE(genre,''), created_at
		 FROM songs
		 WHERE search_vec @@ plainto_tsquery('english', $1)
		 ORDER BY ts_rank(search_vec, plainto_tsquery('english', $1)) DESC
		 LIMIT $2 OFFSET $3`,
		query, limit, offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var songs []*entity.Song
	for rows.Next() {
		s := &entity.Song{}
		if err := rows.Scan(&s.ID, &s.Title, &s.ArtistID, &s.AlbumID, &s.DurationS, &s.Genre, &s.CreatedAt); err != nil {
			return nil, 0, err
		}
		songs = append(songs, s)
	}

	var total int
	_ = r.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM songs WHERE search_vec @@ plainto_tsquery('english', $1)`, query,
	).Scan(&total)

	return songs, total, nil
}

func (r *songRepository) Create(ctx context.Context, s *entity.Song) error {
	_, err := r.db.Exec(
		ctx,
		`INSERT INTO songs
		 (
		   id,
		   title,
		   artist_id,
		   album_id,
		   uploader_id,
		   duration_s,
		   genre
		 )
		 VALUES ($1,$2,$3,$4,$5,$6,$7)`,
		s.ID,
		s.Title,
		s.ArtistID,
		s.AlbumID,
		s.UploaderID,
		s.DurationS,
		s.Genre,
	)
	return err
}

func (r *songRepository) Update(
	ctx context.Context,
	s *entity.Song,
) error {

	_, err := r.db.Exec(
		ctx,
		`UPDATE songs
		 SET title = $2,
		     album_id = $3,
		     duration_s = $4,
		     genre = $5,
		     updated_at = NOW()
		 WHERE id = $1`,
		s.ID,
		s.Title,
		s.AlbumID,
		s.DurationS,
		s.Genre,
	)

	return err
}

func (r *songRepository) Delete(
	ctx context.Context,
	id string,
) error {

	_, err := r.db.Exec(
		ctx,
		`DELETE FROM songs WHERE id = $1`,
		id,
	)

	return err
}
