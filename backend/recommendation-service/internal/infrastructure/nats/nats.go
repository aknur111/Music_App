package nats

import (
	"fmt"
	"time"

	"github.com/nats-io/nats.go"
)

const (
	StreamName    = "MUSIC_EVENTS"
	SubjectFilter = "music.>"
)

func Connect(url string) (*nats.Conn, nats.JetStreamContext, error) {
	nc, err := nats.Connect(url)
	if err != nil {
		return nil, nil, fmt.Errorf("nats connect: %w", err)
	}

	js, err := nc.JetStream()
	if err != nil {
		nc.Close()
		return nil, nil, fmt.Errorf("jetstream context: %w", err)
	}

	_, _ = js.AddStream(&nats.StreamConfig{
		Name:     StreamName,
		Subjects: []string{SubjectFilter},
		MaxAge:   7 * 24 * time.Hour,
	})

	return nc, js, nil
}
