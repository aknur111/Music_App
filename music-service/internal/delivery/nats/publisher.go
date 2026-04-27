package nats

import (
	"context"
	"encoding/json"
	"time"

	"github.com/nats-io/nats.go"
)

type Publisher struct {
	js nats.JetStreamContext
}

func NewPublisher(js nats.JetStreamContext) *Publisher {
	return &Publisher{js: js}
}

type songUploadedEvent struct {
	SongID     string    `json:"song_id"`
	Title      string    `json:"title"`
	ArtistID   string    `json:"artist_id"`
	UploaderID string    `json:"uploader_id"`
	Timestamp  time.Time `json:"timestamp"`
}

func (p *Publisher) PublishSongUploaded(ctx context.Context, songID, title, artistID, uploaderID string) error {
	payload, err := json.Marshal(songUploadedEvent{
		SongID:     songID,
		Title:      title,
		ArtistID:   artistID,
		UploaderID: uploaderID,
		Timestamp:  time.Now().UTC(),
	})
	if err != nil {
		return err
	}
	_, err = p.js.Publish("music.song.uploaded", payload)
	return err
}
