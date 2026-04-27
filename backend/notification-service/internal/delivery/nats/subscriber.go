package nats

import (
	"context"
	"encoding/json"
	"time"

	"github.com/nats-io/nats.go"
	"go.uber.org/zap"

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

func (s *Subscriber) Subscribe() error {
	handlers := map[string]func(msg *nats.Msg){
		"music.user.registered":    s.handleUserRegistered,
		"music.user.password_reset": s.handlePasswordReset,
		"music.song.uploaded":      s.handleSongUploaded,
		"music.playlist.song_added": s.handlePlaylistSongAdded,
	}

	for subject, handler := range handlers {
		_, err := s.js.Subscribe(subject, handler, nats.Durable("notification-service"), nats.AckExplicit())
		if err != nil {
			return err
		}
		s.logger.Info("subscribed to NATS subject", zap.String("subject", subject))
	}
	return nil
}

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
	SongID     string    `json:"song_id"`
	Title      string    `json:"title"`
	ArtistID   string    `json:"artist_id"`
	UploaderID string    `json:"uploader_id"`
	Timestamp  time.Time `json:"timestamp"`
}

type playlistSongAddedEvent struct {
	PlaylistID   string    `json:"playlist_id"`
	SongID       string    `json:"song_id"`
	UserID       string    `json:"user_id"`
	PlaylistName string    `json:"playlist_name"`
	Timestamp    time.Time `json:"timestamp"`
}

func (s *Subscriber) handleUserRegistered(msg *nats.Msg) {
	var evt userRegisteredEvent
	if err := json.Unmarshal(msg.Data, &evt); err != nil {
		s.logger.Error("unmarshal user.registered", zap.Error(err))
		msg.Nak()
		return
	}
	if err := s.uc.HandleUserRegistered(context.Background(), msg.Subject+evt.UserID, evt.Email, evt.Name); err != nil {
		s.logger.Error("handle user.registered", zap.Error(err))
		msg.Nak()
		return
	}
	msg.Ack()
}

func (s *Subscriber) handlePasswordReset(msg *nats.Msg) {
	var evt passwordResetEvent
	if err := json.Unmarshal(msg.Data, &evt); err != nil {
		s.logger.Error("unmarshal user.password_reset", zap.Error(err))
		msg.Nak()
		return
	}
	if err := s.uc.HandlePasswordReset(context.Background(), msg.Subject+evt.UserID, evt.Email, evt.ResetToken); err != nil {
		s.logger.Error("handle user.password_reset", zap.Error(err))
		msg.Nak()
		return
	}
	msg.Ack()
}

func (s *Subscriber) handleSongUploaded(msg *nats.Msg) {
	var evt songUploadedEvent
	if err := json.Unmarshal(msg.Data, &evt); err != nil {
		msg.Nak()
		return
	}
	if err := s.uc.HandleSongUploaded(context.Background(), evt.SongID, "", evt.Title); err != nil {
		msg.Nak()
		return
	}
	msg.Ack()
}

func (s *Subscriber) handlePlaylistSongAdded(msg *nats.Msg) {
	var evt playlistSongAddedEvent
	if err := json.Unmarshal(msg.Data, &evt); err != nil {
		msg.Nak()
		return
	}
	if err := s.uc.HandlePlaylistSongAdded(context.Background(), evt.PlaylistID+evt.SongID, "", evt.PlaylistName, evt.SongID); err != nil {
		msg.Nak()
		return
	}
	msg.Ack()
}
