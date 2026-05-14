package main

import (
	"context"
	"encoding/csv"
	"log"
	"os"
	"strconv"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	ctx := context.Background()

	db, err := pgxpool.New(
		ctx,
		"postgres://postgres:musicapp_dev_pg_2026@localhost:5433/music_db?sslmode=disable",
	)
	if err != nil {
		log.Fatal("db connect error:", err)
	}
	defer db.Close()

	if err := db.Ping(ctx); err != nil {
		log.Fatal("db ping error:", err)
	}

	file, err := os.Open("spotify_songs.csv")
	if err != nil {
		log.Fatal("csv open error:", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.FieldsPerRecord = -1

	rows, err := reader.ReadAll()
	if err != nil {
		log.Fatal("csv read error:", err)
	}

	log.Println("CSV rows:", len(rows))

	artistMap := map[string]string{}

	imported := 0
	skipped := 0

	for i, row := range rows {
		if i == 0 {
			continue
		}

		if len(row) < 23 {
			log.Println("skip row", i, "invalid columns:", len(row))
			skipped++
			continue
		}

		title := row[1]
		artistName := row[2]
		genre := row[9]

		if title == "" || artistName == "" {
			log.Println("skip row", i, "empty title or artist")
			skipped++
			continue
		}

		durationMs, err := strconv.Atoi(row[22])
		if err != nil {
			log.Println("skip row", i, "invalid duration:", row[22])
			skipped++
			continue
		}

		durationSec := durationMs / 1000

		artistID, ok := artistMap[artistName]
		if !ok {
			err := db.QueryRow(
				ctx,
				`SELECT id::text FROM artists WHERE name = $1 LIMIT 1`,
				artistName,
			).Scan(&artistID)

			if err != nil {
				artistID = uuid.New().String()

				_, err = db.Exec(
					ctx,
					`INSERT INTO artists(id, name, bio)
					 VALUES($1, $2, $3)`,
					artistID,
					artistName,
					"Imported from Spotify dataset",
				)

				if err != nil {
					log.Println("skip row", i, "artist insert error:", err)
					skipped++
					continue
				}
			}

			artistMap[artistName] = artistID
		}

		_, err = db.Exec(
			ctx,
			`INSERT INTO songs(
				id,
				title,
				artist_id,
				uploader_id,
				duration_s,
				genre
			)
			VALUES($1, $2, $3, $4, $5, $6)`,
			uuid.New().String(),
			title,
			artistID,
			"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
			durationSec,
			genre,
		)

		if err != nil {
			log.Println("skip row", i, "song insert error:", err)
			skipped++
			continue
		}

		imported++

		if imported%1000 == 0 {
			log.Println("imported:", imported, "skipped:", skipped)
		}
	}

	log.Println("DONE 😈 imported:", imported, "skipped:", skipped)
}