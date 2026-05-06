package nats

import (
	"fmt"
	"time"

	"github.com/nats-io/nats.go"
)

const (
	StreamName    = "MUSIC_EVENTS"
	SubjectFilter = "music.>"
	RetentionTTL  = 7 * 24 * time.Hour
)

// Connect opens a NATS connection and returns the connection and a JetStream context.
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

	if err := ensureStream(js); err != nil {
		nc.Close()
		return nil, nil, err
	}

	return nc, js, nil
}

// ensureStream creates the MUSIC_EVENTS stream if it does not already exist.
func ensureStream(js nats.JetStreamContext) error {
	cfg := &nats.StreamConfig{
		Name:     StreamName,
		Subjects: []string{SubjectFilter},
		MaxAge:   RetentionTTL,
		Storage:  nats.FileStorage,
		Retention: nats.LimitsPolicy,
	}

	info, err := js.StreamInfo(StreamName)
	if err == nats.ErrStreamNotFound || info == nil {
		if _, err := js.AddStream(cfg); err != nil {
			return fmt.Errorf("add stream %s: %w", StreamName, err)
		}
		return nil
	}
	if err != nil {
		return fmt.Errorf("stream info: %w", err)
	}
	return nil
}
