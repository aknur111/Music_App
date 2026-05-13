package nats

import (
	"context"
	"encoding/json"
	"time"

	"github.com/music-app/playlist-service/internal/usecase"
	"github.com/nats-io/nats.go"
)

type Publisher struct {
	js nats.JetStreamContext
}

func NewPublisher(js nats.JetStreamContext) usecase.EventPublisher {
	return &Publisher{js: js}
}

type songAddedEvent struct {
	PlaylistID   string    `json:"playlist_id"`
	SongID       string    `json:"song_id"`
	UserID       string    `json:"user_id"`
	PlaylistName string    `json:"playlist_name"`
	Timestamp    time.Time `json:"timestamp"`
}

func (p *Publisher) PublishSongAdded(ctx context.Context, playlistID, songID, userID, playlistName string) error {
	payload, err := json.Marshal(songAddedEvent{
		PlaylistID:   playlistID,
		SongID:       songID,
		UserID:       userID,
		PlaylistName: playlistName,
		Timestamp:    time.Now().UTC(),
	})
	if err != nil {
		return err
	}

	_, err = p.js.Publish("music.playlist.song_added", payload)
	return err
}
