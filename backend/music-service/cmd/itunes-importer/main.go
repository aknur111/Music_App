package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

const sourceName = "itunes"

type ITunesResponse struct {
	ResultCount int           `json:"resultCount"`
	Results     []ITunesTrack `json:"results"`
}

type ITunesTrack struct {
	WrapperType       string `json:"wrapperType"`
	Kind              string `json:"kind"`
	ArtistID          int64  `json:"artistId"`
	CollectionID      int64  `json:"collectionId"`
	TrackID           int64  `json:"trackId"`
	ArtistName        string `json:"artistName"`
	CollectionName    string `json:"collectionName"`
	TrackName         string `json:"trackName"`
	ArtistViewURL     string `json:"artistViewUrl"`
	CollectionViewURL string `json:"collectionViewUrl"`
	TrackViewURL      string `json:"trackViewUrl"`
	PreviewURL        string `json:"previewUrl"`
	ArtworkURL100     string `json:"artworkUrl100"`
	ReleaseDate       string `json:"releaseDate"`
	TrackTimeMillis   int    `json:"trackTimeMillis"`
	PrimaryGenreName  string `json:"primaryGenreName"`
}

func main() {
	ctx := context.Background()

	databaseURL := getEnv(
		"DATABASE_URL",
		"postgres://postgres:musicapp_dev_pg_2026@localhost:5433/music_db?sslmode=disable",
	)

	country := getEnv("ITUNES_COUNTRY", "US")
	limit := getEnvInt("ITUNES_LIMIT", 25)

	terms := parseTerms(getEnv(
		"ITUNES_TERMS",
		"the weeknd,drake,taylor swift,billie eilish,ariana grande,bruno mars,dua lipa,ed sheeran",
	))

	if len(terms) == 0 {
		log.Fatal("no ITUNES_TERMS provided")
	}

	db, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		log.Fatal("db connect error:", err)
	}
	defer db.Close()

	if err := db.Ping(ctx); err != nil {
		log.Fatal("db ping error:", err)
	}

	log.Println("iTunes importer started")
	log.Println("terms:", terms)
	log.Println("country:", country, "limit per term:", limit)

	totalFetched := 0
	totalProcessed := 0
	totalSkipped := 0

	seenTracks := make(map[string]bool)

	for _, term := range terms {
		log.Println("fetching term:", term)

		tracks, err := fetchITunesTracks(term, country, limit)
		if err != nil {
			log.Println("fetch error for term", term, ":", err)
			continue
		}

		totalFetched += len(tracks)

		for _, track := range tracks {
			externalTrackID := strconv.FormatInt(track.TrackID, 10)

			if externalTrackID == "0" || track.TrackName == "" || track.ArtistName == "" {
				totalSkipped++
				continue
			}

			if seenTracks[externalTrackID] {
				continue
			}
			seenTracks[externalTrackID] = true

			artistID, err := upsertArtist(ctx, db, track)
			if err != nil {
				log.Println("artist upsert error:", err)
				totalSkipped++
				continue
			}

			albumID, err := upsertAlbum(ctx, db, track, artistID)
			if err != nil {
				log.Println("album upsert error:", err)
				totalSkipped++
				continue
			}

			if err := upsertSong(ctx, db, track, artistID, albumID); err != nil {
				log.Println("song upsert error:", err)
				totalSkipped++
				continue
			}

			totalProcessed++
		}

		time.Sleep(400 * time.Millisecond)
	}

	log.Println("DONE")
	log.Println("fetched:", totalFetched)
	log.Println("processed:", totalProcessed)
	log.Println("skipped:", totalSkipped)
}

func fetchITunesTracks(term, country string, limit int) ([]ITunesTrack, error) {
	baseURL := "https://itunes.apple.com/search"

	params := url.Values{}
	params.Set("term", term)
	params.Set("media", "music")
	params.Set("entity", "song")
	params.Set("country", country)
	params.Set("limit", strconv.Itoa(limit))

	requestURL := baseURL + "?" + params.Encode()

	client := &http.Client{
		Timeout: 20 * time.Second,
	}

	resp, err := client.Get(requestURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("itunes returned status %d", resp.StatusCode)
	}

	var payload ITunesResponse
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, err
	}

	return payload.Results, nil
}

func upsertArtist(
	ctx context.Context,
	db *pgxpool.Pool,
	track ITunesTrack,
) (string, error) {
	artistExternalID := strconv.FormatInt(track.ArtistID, 10)

	if artistExternalID == "0" {
		return "", fmt.Errorf("artist external id is empty for %q", track.ArtistName)
	}

	var artistID string

	err := db.QueryRow(
		ctx,
		`
		INSERT INTO artists (
			id,
			name,
			bio,
			source,
			external_id,
			external_url
		)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (source, external_id)
		WHERE external_id IS NOT NULL
		DO UPDATE SET
			name = EXCLUDED.name,
			external_url = EXCLUDED.external_url
		RETURNING id::text
		`,
		uuid.New().String(),
		track.ArtistName,
		"Imported from iTunes Search API",
		sourceName,
		artistExternalID,
		nullableString(track.ArtistViewURL),
	).Scan(&artistID)

	if err != nil {
		return "", err
	}

	return artistID, nil
}

func upsertAlbum(
	ctx context.Context,
	db *pgxpool.Pool,
	track ITunesTrack,
	artistID string,
) (string, error) {
	if track.CollectionID == 0 || strings.TrimSpace(track.CollectionName) == "" {
		return "", nil
	}

	albumExternalID := strconv.FormatInt(track.CollectionID, 10)
	year := parseYear(track.ReleaseDate)

	var albumID string

	err := db.QueryRow(
		ctx,
		`
		INSERT INTO albums (
			id,
			title,
			artist_id,
			year,
			source,
			external_id,
			cover_url,
			external_url
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (source, external_id)
		WHERE external_id IS NOT NULL
		DO UPDATE SET
			title = EXCLUDED.title,
			artist_id = EXCLUDED.artist_id,
			year = EXCLUDED.year,
			cover_url = EXCLUDED.cover_url,
			external_url = EXCLUDED.external_url
		RETURNING id::text
		`,
		uuid.New().String(),
		track.CollectionName,
		artistID,
		nullableInt(year),
		sourceName,
		albumExternalID,
		nullableString(track.ArtworkURL100),
		nullableString(track.CollectionViewURL),
	).Scan(&albumID)

	if err != nil {
		return "", err
	}

	return albumID, nil
}

func upsertSong(
	ctx context.Context,
	db *pgxpool.Pool,
	track ITunesTrack,
	artistID,
	albumID string,
) error {
	songExternalID := strconv.FormatInt(track.TrackID, 10)

	durationSeconds := 0
	if track.TrackTimeMillis > 0 {
		durationSeconds = track.TrackTimeMillis / 1000
	}

	_, err := db.Exec(
		ctx,
		`
		INSERT INTO songs (
			id,
			title,
			artist_id,
			album_id,
			duration_s,
			genre,
			source,
			external_id,
			preview_url,
			cover_url,
			external_url
		)
		VALUES (
			$1,
			$2,
			$3,
			NULLIF($4, '')::uuid,
			$5,
			$6,
			$7,
			$8,
			$9,
			$10,
			$11
		)
		ON CONFLICT (source, external_id)
		WHERE external_id IS NOT NULL
		DO UPDATE SET
			title = EXCLUDED.title,
			artist_id = EXCLUDED.artist_id,
			album_id = EXCLUDED.album_id,
			duration_s = EXCLUDED.duration_s,
			genre = EXCLUDED.genre,
			preview_url = EXCLUDED.preview_url,
			cover_url = EXCLUDED.cover_url,
			external_url = EXCLUDED.external_url,
			updated_at = NOW()
		`,
		uuid.New().String(),
		track.TrackName,
		artistID,
		albumID,
		durationSeconds,
		nullableString(track.PrimaryGenreName),
		sourceName,
		songExternalID,
		nullableString(track.PreviewURL),
		nullableString(track.ArtworkURL100),
		nullableString(track.TrackViewURL),
	)

	return err
}

func parseTerms(raw string) []string {
	parts := strings.Split(raw, ",")
	terms := make([]string, 0, len(parts))

	for _, part := range parts {
		term := strings.TrimSpace(part)
		if term != "" {
			terms = append(terms, term)
		}
	}

	return terms
}

func parseYear(releaseDate string) int {
	if len(releaseDate) < 4 {
		return 0
	}

	year, err := strconv.Atoi(releaseDate[:4])
	if err != nil {
		return 0
	}

	return year
}

func nullableString(value string) any {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}
	return value
}

func nullableInt(value int) any {
	if value == 0 {
		return nil
	}
	return value
}

func getEnv(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func getEnvInt(key string, fallback int) int {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return fallback
	}

	value, err := strconv.Atoi(raw)
	if err != nil || value <= 0 {
		return fallback
	}

	return value
}
