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
		`SELECT s.id, s.title, s.artist_id, COALESCE(a.name,''), COALESCE(s.album_id::text,''), COALESCE(al.title,''),
		        s.duration_s, COALESCE(s.genre,''), s.created_at,
		        COALESCE(s.cover_url,''), COALESCE(s.preview_url,'')
		 FROM songs s
		 LEFT JOIN artists a ON a.id = s.artist_id
		 LEFT JOIN albums  al ON al.id = s.album_id
		 WHERE s.id = $1`, id,
	)
	s := &entity.Song{}
	err := row.Scan(&s.ID, &s.Title, &s.ArtistID, &s.Artist, &s.AlbumID, &s.Album, &s.DurationS, &s.Genre, &s.CreatedAt, &s.CoverUrl, &s.PreviewUrl)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return s, err
}

func (r *songRepository) List(ctx context.Context, artistID, albumID string, page, limit int) ([]*entity.Song, int, error) {
	offset := (page - 1) * limit
	rows, err := r.db.Query(ctx,
		`SELECT s.id, s.title, s.artist_id, COALESCE(a.name,''), COALESCE(s.album_id::text,''), COALESCE(al.title,''),
		        s.duration_s, COALESCE(s.genre,''), s.created_at,
		        COALESCE(s.cover_url,''), COALESCE(s.preview_url,'')
		 FROM songs s
		 LEFT JOIN artists a  ON a.id  = s.artist_id
		 LEFT JOIN albums  al ON al.id = s.album_id
		 WHERE ($1 = '' OR s.artist_id::text = $1)
		   AND ($2 = '' OR s.album_id::text  = $2)
		 ORDER BY s.created_at DESC
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

		if err := rows.Scan(
			&s.ID,
			&s.Title,
			&s.ArtistID,
			&s.Artist,
			&s.AlbumID,
			&s.Album,
			&s.DurationS,
			&s.Genre,
			&s.CreatedAt,
			&s.CoverUrl,
			&s.PreviewUrl,
		); err != nil {
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

func (r *songRepository) Search(
	ctx context.Context,
	query string,
	page, limit int,
) ([]*entity.Song, int, error) {

	offset := (page - 1) * limit
	pattern := "%" + query + "%"

	rows, err := r.db.Query(
		ctx,
		`SELECT s.id, s.title, s.artist_id, COALESCE(a.name,''), COALESCE(s.album_id::text,''), COALESCE(al.title,''),
		        s.duration_s, COALESCE(s.genre,''), s.created_at,
		        COALESCE(s.cover_url,''), COALESCE(s.preview_url,'')
		 FROM songs s
		 LEFT JOIN artists a  ON a.id  = s.artist_id
		 LEFT JOIN albums  al ON al.id = s.album_id
		 WHERE s.title ILIKE $1
		 ORDER BY s.created_at DESC
		 LIMIT $2 OFFSET $3`,
		pattern, limit, offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var songs []*entity.Song

	for rows.Next() {
		s := &entity.Song{}

		if err := rows.Scan(
			&s.ID,
			&s.Title,
			&s.ArtistID,
			&s.Artist,
			&s.AlbumID,
			&s.Album,
			&s.DurationS,
			&s.Genre,
			&s.CreatedAt,
			&s.CoverUrl,
			&s.PreviewUrl,
		); err != nil {
			return nil, 0, err
		}

		songs = append(songs, s)
	}

	var total int

	_ = r.db.QueryRow(
		ctx,
		`SELECT COUNT(*)
		 FROM songs
		 WHERE title ILIKE $1`,
		pattern,
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
		 VALUES ($1,$2,$3,$4,NULLIF($5, '')::uuid,$6,$7)`,
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
