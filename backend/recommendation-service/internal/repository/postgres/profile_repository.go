package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/music-app/recommendation-service/internal/domain/entity"
	"github.com/music-app/recommendation-service/internal/domain/repository"
)

type profileRepository struct {
	db *pgxpool.Pool
}

func NewProfileRepository(db *pgxpool.Pool) repository.ProfileRepository {
	return &profileRepository{db: db}
}

func (r *profileRepository) Get(ctx context.Context, userID string) (*entity.UserTasteProfile, error) {
	p := &entity.UserTasteProfile{}
	err := r.db.QueryRow(ctx,
		`SELECT user_id, avg_valence, avg_energy, avg_danceability, avg_tempo, play_count, updated_at
		 FROM user_taste_profiles WHERE user_id = $1`,
		userID,
	).Scan(&p.UserID, &p.AvgValence, &p.AvgEnergy, &p.AvgDanceability, &p.AvgTempo, &p.PlayCount, &p.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return p, nil
}

// UpsertWithWeightedAverage performs a single atomic SQL statement that applies
// the weighted moving average formula: new_avg = old_avg*(n/(n+1)) + new/(n+1).
// On first insert the track's raw feature values become the initial averages.
func (r *profileRepository) UpsertWithWeightedAverage(
	ctx context.Context,
	userID string,
	valence, energy, danceability, tempo float64,
) (*entity.UserTasteProfile, error) {
	p := &entity.UserTasteProfile{}
	err := r.db.QueryRow(ctx, `
		INSERT INTO user_taste_profiles (user_id, avg_valence, avg_energy, avg_danceability, avg_tempo, play_count, updated_at)
		VALUES ($1, $2, $3, $4, $5, 1, NOW())
		ON CONFLICT (user_id) DO UPDATE SET
			avg_valence      = user_taste_profiles.avg_valence      * user_taste_profiles.play_count::float / (user_taste_profiles.play_count + 1)
			                 + EXCLUDED.avg_valence      / (user_taste_profiles.play_count + 1),
			avg_energy       = user_taste_profiles.avg_energy       * user_taste_profiles.play_count::float / (user_taste_profiles.play_count + 1)
			                 + EXCLUDED.avg_energy       / (user_taste_profiles.play_count + 1),
			avg_danceability = user_taste_profiles.avg_danceability * user_taste_profiles.play_count::float / (user_taste_profiles.play_count + 1)
			                 + EXCLUDED.avg_danceability / (user_taste_profiles.play_count + 1),
			avg_tempo        = user_taste_profiles.avg_tempo        * user_taste_profiles.play_count::float / (user_taste_profiles.play_count + 1)
			                 + EXCLUDED.avg_tempo        / (user_taste_profiles.play_count + 1),
			play_count       = user_taste_profiles.play_count + 1,
			updated_at       = NOW()
		RETURNING user_id, avg_valence, avg_energy, avg_danceability, avg_tempo, play_count, updated_at`,
		userID, valence, energy, danceability, tempo,
	).Scan(&p.UserID, &p.AvgValence, &p.AvgEnergy, &p.AvgDanceability, &p.AvgTempo, &p.PlayCount, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (r *profileRepository) InsertPlayHistory(ctx context.Context, userID, trackID string) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO play_history (user_id, track_id, played_at) VALUES ($1, $2, $3)`,
		userID, trackID, time.Now().UTC(),
	)
	return err
}
