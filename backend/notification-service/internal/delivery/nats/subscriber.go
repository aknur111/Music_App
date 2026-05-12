package nats

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/nats-io/nats.go"
	"go.uber.org/zap"

	infraNATS "github.com/music-app/notification-service/internal/infrastructure/nats"
	"github.com/music-app/notification-service/internal/usecase"
)

type Subscriber struct {
	js     nats.JetStreamContext
	uc     usecase.NotificationUsecase
	logger *zap.Logger
}

func NewSubscriber(js nats.JetStreamContext, uc usecase.NotificationUsecase, logger *zap.Logger) *Subscriber {
	return &Subscriber{js: js, uc: uc, logger: logger}
}

// Subscribe creates one durable push consumer for the entire music.> filter.
// Each message is dispatched by subject inside the handler, keeping a single
// durable name and avoiding the duplicate-consumer conflict that arises when
// the same durable name is used for multiple subject-filtered subscriptions.
func (s *Subscriber) Subscribe() error {
	_, err := s.js.Subscribe(
		infraNATS.SubjectFilter,
		s.dispatch,
		nats.Durable("notification-service"),
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
	case "music.user.registered":
		s.handleUserRegistered(msg)
	case "music.user.password_reset":
		s.handlePasswordReset(msg)
	case "music.song.uploaded":
		s.handleSongUploaded(msg)
	case "music.playlist.song_added":
		s.handlePlaylistSongAdded(msg)
	default:
		s.logger.Warn("unknown subject, acking and skipping", zap.String("subject", msg.Subject))
		_ = msg.Ack()
	}
}

// eventID derives a stable, unique identifier from the JetStream sequence.
// Falls back to a combination of subject + payload-derived values when metadata
// is unavailable (e.g. in testing).
func eventID(msg *nats.Msg, fallback string) string {
	if meta, err := msg.Metadata(); err == nil {
		return fmt.Sprintf("%s-%d", meta.Stream, meta.Sequence.Stream)
	}
	return fallback
}

// ── event payloads ───────────────────────────────────────────────────────────

type userRegisteredEvent struct {
	UserID    string    `json:"user_id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	Timestamp time.Time `json:"timestamp"`
}

type passwordResetEvent struct {
	UserID     string    `json:"user_id"`
	Email      string    `json:"email"`
	ResetToken string    `json:"reset_token"`
	ExpiresAt  time.Time `json:"expires_at"`
}

type songUploadedEvent struct {
	SongID        string    `json:"song_id"`
	Title         string    `json:"title"`
	ArtistID      string    `json:"artist_id"`
	UploaderID    string    `json:"uploader_id"`
	UploaderEmail string    `json:"uploader_email"` // provided by music-service publisher
	Timestamp     time.Time `json:"timestamp"`
}

type playlistSongAddedEvent struct {
	PlaylistID   string    `json:"playlist_id"`
	SongID       string    `json:"song_id"`
	SongTitle    string    `json:"song_title"`
	UserID       string    `json:"user_id"`
	UserEmail    string    `json:"user_email"` // provided by playlist-service publisher
	PlaylistName string    `json:"playlist_name"`
	Timestamp    time.Time `json:"timestamp"`
}

// ── handlers ─────────────────────────────────────────────────────────────────

func (s *Subscriber) handleUserRegistered(msg *nats.Msg) {
	var evt userRegisteredEvent
	if err := json.Unmarshal(msg.Data, &evt); err != nil {
		s.logger.Error("unmarshal user.registered", zap.Error(err))
		_ = msg.Nak()
		return
	}
	id := eventID(msg, "user.registered:"+evt.UserID)
	if err := s.uc.HandleUserRegistered(context.Background(), id, evt.Email, evt.Name); err != nil {
		s.logger.Error("handle user.registered", zap.Error(err), zap.String("event_id", id))
		_ = msg.Nak()
		return
	}
	_ = msg.Ack()
}

func (s *Subscriber) handlePasswordReset(msg *nats.Msg) {
	var evt passwordResetEvent
	if err := json.Unmarshal(msg.Data, &evt); err != nil {
		s.logger.Error("unmarshal user.password_reset", zap.Error(err))
		_ = msg.Nak()
		return
	}
	id := eventID(msg, "user.password_reset:"+evt.UserID)
	if err := s.uc.HandlePasswordReset(context.Background(), id, evt.Email, evt.ResetToken); err != nil {
		s.logger.Error("handle user.password_reset", zap.Error(err), zap.String("event_id", id))
		_ = msg.Nak()
		return
	}
	_ = msg.Ack()
}

func (s *Subscriber) handleSongUploaded(msg *nats.Msg) {
	var evt songUploadedEvent
	if err := json.Unmarshal(msg.Data, &evt); err != nil {
		s.logger.Error("unmarshal song.uploaded", zap.Error(err))
		_ = msg.Nak()
		return
	}
	id := eventID(msg, "song.uploaded:"+evt.SongID)
	if err := s.uc.HandleSongUploaded(context.Background(), id, evt.UploaderEmail, evt.Title); err != nil {
		s.logger.Error("handle song.uploaded", zap.Error(err), zap.String("event_id", id))
		_ = msg.Nak()
		return
	}
	_ = msg.Ack()
}

func (s *Subscriber) handlePlaylistSongAdded(msg *nats.Msg) {
	var evt playlistSongAddedEvent
	if err := json.Unmarshal(msg.Data, &evt); err != nil {
		s.logger.Error("unmarshal playlist.song_added", zap.Error(err))
		_ = msg.Nak()
		return
	}
	id := eventID(msg, "playlist.song_added:"+evt.PlaylistID+":"+evt.SongID)
	if err := s.uc.HandlePlaylistSongAdded(context.Background(), id, evt.UserEmail, evt.PlaylistName, evt.SongTitle); err != nil {
		s.logger.Error("handle playlist.song_added", zap.Error(err), zap.String("event_id", id))
		_ = msg.Nak()
		return
	}
	_ = msg.Ack()
}
