package nats

import (
	"context"
	"encoding/json"
	"time"

	"github.com/nats-io/nats.go"
	"github.com/music-app/auth-service/internal/usecase"
)

type Publisher struct {
	js nats.JetStreamContext
}

func NewPublisher(js nats.JetStreamContext) usecase.EventPublisher {
	return &Publisher{js: js}
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

func (p *Publisher) PublishUserRegistered(ctx context.Context, userID, email, name string) error {
	payload, err := json.Marshal(userRegisteredEvent{
		UserID:    userID,
		Email:     email,
		Name:      name,
		Timestamp: time.Now().UTC(),
	})
	if err != nil {
		return err
	}
	_, err = p.js.Publish("music.user.registered", payload)
	return err
}

func (p *Publisher) PublishPasswordReset(ctx context.Context, userID, email, resetToken string) error {
	payload, err := json.Marshal(passwordResetEvent{
		UserID:     userID,
		Email:      email,
		ResetToken: resetToken,
		ExpiresAt:  time.Now().Add(30 * time.Minute).UTC(),
	})
	if err != nil {
		return err
	}
	_, err = p.js.Publish("music.user.password_reset", payload)
	return err
}
