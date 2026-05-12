package main

import (
	"context"
	"encoding/csv"
	"io"
	"os"
	"strconv"
	"time"

	"go.uber.org/zap"

	"github.com/music-app/recommendation-service/internal/config"
	"github.com/music-app/recommendation-service/internal/domain/entity"
	infraPG "github.com/music-app/recommendation-service/internal/infrastructure/postgres"
	repoPG "github.com/music-app/recommendation-service/internal/repository/postgres"
)

// CSV column indices (0-based).
// Col 0 is the unnamed row-number index exported by pandas — skipped.
const (
	colSpotifyID        = 1
	colArtists          = 2
	colAlbumName        = 3
	colTrackName        = 4
	colPopularity       = 5
	colDurationMS       = 6
	// col 7 explicit   — skipped
	colDanceability     = 8
	colEnergy           = 9
	// col 10 key       — skipped
	colLoudness         = 11
	// col 12 mode      — skipped
	colSpeechiness      = 13
	colAcousticness     = 14
	colInstrumentalness = 15
	// col 16 liveness  — skipped
	colValence          = 17
	colTempo            = 18
	// col 19 time_sig  — skipped
	colGenre            = 20
)

// csvPaths lists candidate locations for the CSV, tried in order.
var csvPaths = []string{
	"data/spotify_tracks.csv",
	"backend/recommendation-service/data/spotify_tracks.csv",
	"../../backend/recommendation-service/data/spotify_tracks.csv",
}

func main() {
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	cfg := config.Load()

	// ── find CSV ──────────────────────────────────────────────────────────────
	csvPath := ""
	for _, p := range csvPaths {
		if _, err := os.Stat(p); err == nil {
			csvPath = p
			break
		}
	}
	if csvPath == "" {
		logger.Fatal("CSV not found; place spotify_tracks.csv in data/ and run from the recommendation-service directory",
			zap.Strings("tried", csvPaths))
	}
	logger.Info("found CSV", zap.String("path", csvPath))

	// ── postgres ──────────────────────────────────────────────────────────────
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	db, err := infraPG.NewPool(ctx, cfg.PostgresDSN)
	cancel()
	if err != nil {
		logger.Fatal("postgres connect", zap.Error(err))
	}
	defer db.Close()

	if err := infraPG.RunMigrations(cfg.PostgresDSN, cfg.MigrationsPath); err != nil {
		logger.Fatal("migrations", zap.Error(err))
	}

	repo := repoPG.NewTrackRepository(db)

	// ── open CSV ──────────────────────────────────────────────────────────────
	f, err := os.Open(csvPath)
	if err != nil {
		logger.Fatal("open CSV", zap.Error(err))
	}
	defer f.Close()

	r := csv.NewReader(f)
	r.LazyQuotes = true
	r.FieldsPerRecord = -1

	// skip header
	if _, err := r.Read(); err != nil {
		logger.Fatal("read CSV header", zap.Error(err))
	}

	// ── seed loop ─────────────────────────────────────────────────────────────
	const batchSize = 1000
	const progressEvery = 10000

	start := time.Now()
	var (
		rowNum    int
		totalRows int
		inserted  int
		skipped   int
		batch     []*entity.Track
	)

	flush := func() {
		if len(batch) == 0 {
			return
		}
		n, err := repo.BulkInsert(context.Background(), batch)
		if err != nil {
			logger.Error("bulk insert error", zap.Error(err), zap.Int("batch_start", totalRows-len(batch)))
		}
		inserted += n
		skipped += len(batch) - n
		batch = batch[:0]
	}

	for {
		record, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			logger.Warn("CSV read error, skipping row", zap.Int("row", rowNum), zap.Error(err))
			rowNum++
			skipped++
			continue
		}
		rowNum++

		if len(record) <= colGenre {
			logger.Warn("row too short, skipping", zap.Int("row", rowNum), zap.Int("cols", len(record)))
			skipped++
			continue
		}

		t, parseErr := parseRow(record, rowNum)
		if parseErr != nil {
			logger.Warn("malformed row, skipping",
				zap.Int("row", rowNum),
				zap.String("spotify_id", record[colSpotifyID]),
				zap.Error(parseErr),
			)
			skipped++
			continue
		}

		batch = append(batch, t)
		totalRows++

		if len(batch) >= batchSize {
			flush()
		}

		if totalRows%progressEvery == 0 {
			logger.Info("seeding progress", zap.Int("rows_processed", totalRows))
		}
	}

	flush()

	logger.Info("seed complete",
		zap.Int("total", totalRows),
		zap.Int("inserted", inserted),
		zap.Int("skipped", skipped),
		zap.Duration("duration", time.Since(start)),
	)
}

func parseRow(rec []string, rowNum int) (*entity.Track, error) {
	popularity, err := parseInt(rec[colPopularity])
	if err != nil {
		return nil, err
	}
	durationMS, err := parseInt(rec[colDurationMS])
	if err != nil {
		return nil, err
	}
	valence, err := parseFloat(rec[colValence])
	if err != nil {
		return nil, err
	}
	energy, err := parseFloat(rec[colEnergy])
	if err != nil {
		return nil, err
	}
	danceability, err := parseFloat(rec[colDanceability])
	if err != nil {
		return nil, err
	}
	tempo, err := parseFloat(rec[colTempo])
	if err != nil {
		return nil, err
	}
	acousticness, err := parseFloat(rec[colAcousticness])
	if err != nil {
		return nil, err
	}
	instrumentalness, err := parseFloat(rec[colInstrumentalness])
	if err != nil {
		return nil, err
	}
	loudness, err := parseFloat(rec[colLoudness])
	if err != nil {
		return nil, err
	}
	speechiness, err := parseFloat(rec[colSpeechiness])
	if err != nil {
		return nil, err
	}

	return &entity.Track{
		SpotifyID:        rec[colSpotifyID],
		Name:             rec[colTrackName],
		Artists:          rec[colArtists],
		Album:            rec[colAlbumName],
		Genre:            rec[colGenre],
		DurationMS:       durationMS,
		Popularity:       popularity,
		Valence:          valence,
		Energy:           energy,
		Danceability:     danceability,
		Tempo:            tempo,
		Acousticness:     acousticness,
		Instrumentalness: instrumentalness,
		Loudness:         loudness,
		Speechiness:      speechiness,
	}, nil
}

func parseFloat(s string) (float64, error) {
	return strconv.ParseFloat(s, 64)
}

func parseInt(s string) (int, error) {
	v, err := strconv.ParseFloat(s, 64) // some ints appear as "73.0" in CSV exports
	return int(v), err
}
