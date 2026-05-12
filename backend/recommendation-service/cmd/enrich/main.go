package main

// Enriches tracks in the recommendation DB with iTunes 30-second preview URLs.
// Runs as a standalone one-shot command against the live postgres instance.
//
// Usage:
//   POSTGRES_DSN="postgres://..." go run ./cmd/enrich [--min-popularity 50] [--workers 5]
//
// Rate limit: Apple's iTunes Search API allows ~20 req/s.
// Default: 5 workers × 200 ms/req ≈ 25 req/s (safe).

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"go.uber.org/zap"

	"github.com/music-app/recommendation-service/internal/config"
	infraPG "github.com/music-app/recommendation-service/internal/infrastructure/postgres"
)

type trackRow struct {
	id      string
	name    string
	artists string
}

type itunesResult struct {
	ResultCount int `json:"resultCount"`
	Results     []struct {
		PreviewURL string `json:"previewUrl"`
	} `json:"results"`
}

func main() {
	minPop := flag.Int("min-popularity", 50, "only enrich tracks with popularity >= this value")
	workers := flag.Int("workers", 5, "number of concurrent iTunes lookup goroutines")
	flag.Parse()

	logger, _ := zap.NewProduction()
	defer logger.Sync()

	cfg := config.Load()

	ctx := context.Background()
	db, err := infraPG.NewPool(ctx, cfg.PostgresDSN)
	if err != nil {
		logger.Fatal("postgres connect", zap.Error(err))
	}
	defer db.Close()

	// Fetch tracks that still need a preview URL.
	rows, err := db.Query(ctx,
		`SELECT id, name, artists FROM tracks
		 WHERE (preview_url IS NULL OR preview_url = '')
		   AND popularity >= $1
		 ORDER BY popularity DESC`,
		*minPop,
	)
	if err != nil {
		logger.Fatal("query tracks", zap.Error(err))
	}

	var tracks []trackRow
	for rows.Next() {
		var t trackRow
		if err := rows.Scan(&t.id, &t.name, &t.artists); err != nil {
			logger.Error("scan row", zap.Error(err))
			continue
		}
		tracks = append(tracks, t)
	}
	rows.Close()

	total := len(tracks)
	logger.Info("tracks to enrich", zap.Int("count", total), zap.Int("min_popularity", *minPop))
	if total == 0 {
		logger.Info("nothing to do")
		return
	}

	jobs := make(chan trackRow, *workers*2)
	var updated, failed, notFound atomic.Int64

	var wg sync.WaitGroup
	for i := 0; i < *workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			client := &http.Client{Timeout: 8 * time.Second}
			for t := range jobs {
				previewURL, err := lookupITunes(client, t.name, t.artists)
				if err != nil {
					logger.Warn("iTunes lookup failed", zap.String("id", t.id), zap.Error(err))
					failed.Add(1)
					time.Sleep(200 * time.Millisecond)
					continue
				}
				if previewURL == "" {
					notFound.Add(1)
					time.Sleep(200 * time.Millisecond)
					continue
				}
				if _, err := db.Exec(ctx,
					`UPDATE tracks SET preview_url = $1 WHERE id = $2`,
					previewURL, t.id,
				); err != nil {
					logger.Error("update preview_url", zap.String("id", t.id), zap.Error(err))
					failed.Add(1)
				} else {
					updated.Add(1)
				}
				time.Sleep(200 * time.Millisecond) // ~5 req/s per worker = 25 req/s total
			}
		}()
	}

	// Progress reporter
	go func() {
		ticker := time.NewTicker(10 * time.Second)
		defer ticker.Stop()
		for range ticker.C {
			done := updated.Load() + failed.Load() + notFound.Load()
			logger.Info("progress",
				zap.Int64("done", done),
				zap.Int("total", total),
				zap.Int64("updated", updated.Load()),
				zap.Int64("not_found", notFound.Load()),
				zap.Int64("failed", failed.Load()),
			)
			if done >= int64(total) {
				return
			}
		}
	}()

	for _, t := range tracks {
		jobs <- t
	}
	close(jobs)
	wg.Wait()

	logger.Info("enrich complete",
		zap.Int("total", total),
		zap.Int64("updated", updated.Load()),
		zap.Int64("not_found", notFound.Load()),
		zap.Int64("failed", failed.Load()),
	)
}

func lookupITunes(client *http.Client, trackName, artists string) (string, error) {
	// Use first artist if multiple are listed (e.g. "Artist1;Artist2")
	artist := strings.Split(artists, ";")[0]
	artist = strings.TrimSpace(artist)

	term := fmt.Sprintf("%s %s", artist, trackName)
	apiURL := "https://itunes.apple.com/search?" + url.Values{
		"term":    {term},
		"media":   {"music"},
		"entity":  {"song"},
		"limit":   {"1"},
		"country": {"us"},
	}.Encode()

	resp, err := client.Get(apiURL)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("iTunes HTTP %d", resp.StatusCode)
	}

	var result itunesResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	if result.ResultCount == 0 || len(result.Results) == 0 {
		return "", nil
	}
	return result.Results[0].PreviewURL, nil
}
