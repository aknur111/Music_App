package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type deezerSearchResponse struct {
	Data []struct {
		Name          string `json:"name"`
		PictureMedium string `json:"picture_medium"`
		PictureXL     string `json:"picture_xl"`
	} `json:"data"`
}

func fetchDeezerImage(name string) (string, error) {
	u := "https://api.deezer.com/search/artist?q=" + url.QueryEscape(name) + "&limit=1"
	resp, err := http.Get(u)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var result deezerSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	if len(result.Data) == 0 {
		return "", nil
	}

	// prefer XL, fall back to medium
	img := result.Data[0].PictureXL
	if img == "" {
		img = result.Data[0].PictureMedium
	}

	// Deezer returns a generic grey square for unknown artists
	if strings.Contains(img, "images/artist//") {
		return "", nil
	}

	return img, nil
}

func main() {
	ctx := context.Background()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:musicapp_dev_pg_2026@localhost:5433/music_db?sslmode=disable"
	}

	db, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatal("db connect:", err)
	}
	defer db.Close()

	if err := db.Ping(ctx); err != nil {
		log.Fatal("db ping:", err)
	}

	rows, err := db.Query(ctx, `SELECT id, name FROM artists WHERE avatar_url = '' ORDER BY name`)
	if err != nil {
		log.Fatal("query:", err)
	}

	type artist struct {
		id   string
		name string
	}
	var artists []artist
	for rows.Next() {
		var a artist
		if err := rows.Scan(&a.id, &a.name); err != nil {
			log.Fatal("scan:", err)
		}
		artists = append(artists, a)
	}
	rows.Close()

	log.Printf("found %d artists without avatar_url", len(artists))

	updated, skipped := 0, 0
	client := &http.Client{Timeout: 10 * time.Second}
	_ = client

	for _, a := range artists {
		imgURL, err := fetchDeezerImage(a.name)
		if err != nil {
			log.Printf("  deezer error for %q: %v", a.name, err)
			skipped++
			time.Sleep(200 * time.Millisecond)
			continue
		}

		if imgURL == "" {
			fmt.Printf("  skip %q — no image found\n", a.name)
			skipped++
			time.Sleep(200 * time.Millisecond)
			continue
		}

		_, err = db.Exec(ctx, `UPDATE artists SET avatar_url = $1 WHERE id = $2`, imgURL, a.id)
		if err != nil {
			log.Printf("  update error for %q: %v", a.name, err)
			skipped++
			continue
		}

		fmt.Printf("  ok  %q\n", a.name)
		updated++
		time.Sleep(200 * time.Millisecond)
	}

	log.Printf("DONE — updated: %d, skipped: %d", updated, skipped)
}
