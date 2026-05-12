// Package nats wires the recommendation-service to the MUSIC_EVENTS JetStream.
//
// NOTE: This subscriber expects music-service to publish events on "music.track.played"
// with payload: {"user_id": "...", "track_id": "...", "played_at": "RFC3339"}.
// As of this commit, music-service does not yet publish these events. The synchronous
// gRPC endpoint RecordPlayback can be used as a fallback for testing and direct frontend calls.
package nats

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/nats-io/nats.go"
	"go.uber.org/zap"

	infraNATS "github.com/music-app/recommendation-service/internal/infrastructure/nats"
	"github.com/music-app/recommendation-service/internal/usecase"
)

// Subscriber listens to the MUSIC_EVENTS stream and dispatches events to the usecase.
type Subscriber struct {
	js     nats.JetStreamContext
	uc     usecase.RecommendationUsecase
	logger *zap.Logger
}

func NewSubscriber(js nats.JetStreamContext, uc usecase.RecommendationUsecase, logger *zap.Logger) *Subscriber {
	return &Subscriber{js: js, uc: uc, logger: logger}
}

// Subscribe creates a single durable push consumer for the entire music.> filter.
// All event types are dispatched by subject inside the handler, keeping one durable
// name and avoiding duplicate-consumer conflicts.
func (s *Subscriber) Subscribe() error {
	_, err := s.js.Subscribe(
		infraNATS.SubjectFilter,
		s.dispatch,
		nats.Durable("recommendation-service"),
		nats.AckExplicit(),
		nats.DeliverNew(),
	)
	if err != nil {
		return fmt.Errorf("nats subscribe music.>: %w", err)
	}
	s.logger.Info("subscribed to NATS stream", zap.String("stream", infraNATS.StreamName))
	return nil
}

func (s *Subscriber) dispatch(msg *nats.Msg) {
	switch msg.Subject {
	case "music.track.played":
		s.handleTrackPlayed(msg)
	default:
		s.logger.Debug("unknown subject, acking and skipping", zap.String("subject", msg.Subject))
		_ = msg.Ack()
	}
}

// ── event payloads ────────────────────────────────────────────────────────────

type trackPlayedEvent struct {
	UserID   string    `json:"user_id"`
	TrackID  string    `json:"track_id"`
	PlayedAt time.Time `json:"played_at"`
}

// ── handlers ──────────────────────────────────────────────────────────────────

func (s *Subscriber) handleTrackPlayed(msg *nats.Msg) {
	var evt trackPlayedEvent
	if err := json.Unmarshal(msg.Data, &evt); err != nil {
		s.logger.Error("unmarshal track.played", zap.Error(err))
		_ = msg.Nak()
		return
	}
	if evt.UserID == "" || evt.TrackID == "" {
		s.logger.Warn("track.played event missing user_id or track_id, acking and skipping",
			zap.String("user_id", evt.UserID), zap.String("track_id", evt.TrackID))
		_ = msg.Ack()
		return
	}
	if err := s.uc.RecordPlay(context.Background(), evt.UserID, evt.TrackID); err != nil {
		s.logger.Error("handle track.played", zap.Error(err),
			zap.String("user_id", evt.UserID), zap.String("track_id", evt.TrackID))
		_ = msg.Nak()
		return
	}
	_ = msg.Ack()
}
