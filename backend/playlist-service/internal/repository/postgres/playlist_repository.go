package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/music-app/playlist-service/internal/domain/entity"
	"github.com/music-app/playlist-service/internal/domain/repository"
)

type playlistRepository struct {
	db *pgxpool.Pool
}

func NewPlaylistRepository(db *pgxpool.Pool) repository.PlaylistRepository {
	return &playlistRepository{db: db}
}

func (r *playlistRepository) Create(ctx context.Context, p *entity.Playlist) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO playlists (id, user_id, name, description, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6)`,
		p.ID, p.UserID, p.Name, p.Description, p.CreatedAt, p.UpdatedAt,
	)
	return err
}

func (r *playlistRepository) GetByID(ctx context.Context, id, userID string) (*entity.Playlist, error) {
	row := r.db.QueryRow(ctx,
		`SELECT id, user_id, name, description, song_count, created_at, updated_at
		 FROM playlists WHERE id = $1 AND user_id = $2`, id, userID,
	)
	p := &entity.Playlist{}
	err := row.Scan(&p.ID, &p.UserID, &p.Name, &p.Description, &p.SongCount, &p.CreatedAt, &p.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return p, err
}

func (r *playlistRepository) ListByUserID(ctx context.Context, userID string, page, limit int) ([]*entity.Playlist, int, error) {
	offset := (page - 1) * limit
	rows, err := r.db.Query(ctx,
		`SELECT id, user_id, name, description, song_count, created_at, updated_at
		 FROM playlists WHERE user_id = $1
		 ORDER BY updated_at DESC LIMIT $2 OFFSET $3`,
		userID, limit, offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var playlists []*entity.Playlist
	for rows.Next() {
		p := &entity.Playlist{}
		if err := rows.Scan(&p.ID, &p.UserID, &p.Name, &p.Description, &p.SongCount, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, 0, err
		}
		playlists = append(playlists, p)
	}

	var total int
	_ = r.db.QueryRow(ctx, `SELECT COUNT(*) FROM playlists WHERE user_id = $1`, userID).Scan(&total)
	return playlists, total, nil
}

func (r *playlistRepository) AddSong(ctx context.Context, ps *entity.PlaylistSong) (int, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	var position int
	err = tx.QueryRow(ctx,
		`INSERT INTO playlist_songs (playlist_id, song_id, position, added_at)
		 VALUES ($1, $2,
		   (SELECT COALESCE(MAX(position), 0) + 1 FROM playlist_songs WHERE playlist_id = $1),
		   $3)
		 ON CONFLICT (playlist_id, song_id) DO NOTHING
		 RETURNING position`,
		ps.PlaylistID, ps.SongID, time.Now().UTC(),
	).Scan(&position)
	if err != nil {
		return 0, err
	}

	_, err = tx.Exec(ctx,
		`UPDATE playlists SET song_count = song_count + 1, updated_at = NOW()
		 WHERE id = $1`, ps.PlaylistID,
	)
	if err != nil {
		return 0, err
	}

	return position, tx.Commit(ctx)
}

func (r *playlistRepository) RemoveSong(ctx context.Context, playlistID, songID, userID string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	ct, err := tx.Exec(ctx,
		`DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2`, playlistID, songID,
	)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return nil
	}

	_, err = tx.Exec(ctx,
		`UPDATE playlists SET song_count = GREATEST(song_count - 1, 0), updated_at = NOW()
		 WHERE id = $1`, playlistID,
	)
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *playlistRepository) Update(ctx context.Context, p *entity.Playlist) error {
	_, err := r.db.Exec(ctx,
		`UPDATE playlists SET name=$1, description=$2, updated_at=$3 WHERE id=$4 AND user_id=$5`,
		p.Name, p.Description, p.UpdatedAt, p.ID, p.UserID,
	)
	return err
}

func (r *playlistRepository) Delete(ctx context.Context, id, userID string) error {
	_, err := r.db.Exec(ctx,
		`DELETE FROM playlists WHERE id=$1 AND user_id=$2`, id, userID,
	)
	return err
}

func (r *playlistRepository) GetSongs(ctx context.Context, playlistID string) ([]*entity.PlaylistSong, error) {
	rows, err := r.db.Query(ctx,
		`SELECT playlist_id, song_id, position, added_at FROM playlist_songs
		 WHERE playlist_id = $1 ORDER BY position`, playlistID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var songs []*entity.PlaylistSong
	for rows.Next() {
		ps := &entity.PlaylistSong{}
		if err := rows.Scan(&ps.PlaylistID, &ps.SongID, &ps.Position, &ps.AddedAt); err != nil {
			return nil, err
		}
		songs = append(songs, ps)
	}
	return songs, nil
}
