package usecase

import (
	"bytes"
	"context"
	"errors"
	"html/template"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/music-app/notification-service/internal/domain/entity"
	"github.com/music-app/notification-service/internal/domain/repository"
)

var retryDelays = []time.Duration{0, 2 * time.Second, 4 * time.Second}

// EmailSender is the port the usecase depends on for outbound email.
type EmailSender interface {
	Send(to, subject, body string, isHTML bool) error
}

// NotificationUsecase is the public interface for this service's business logic.
type NotificationUsecase interface {
	SendEmail(ctx context.Context, to, subject, body string, isHTML bool) error
	HandleUserRegistered(ctx context.Context, eventID, email, name string) error
	HandlePasswordReset(ctx context.Context, eventID, email, resetToken string) error
	HandleSongUploaded(ctx context.Context, eventID, email, songTitle string) error
	HandlePlaylistSongAdded(ctx context.Context, eventID, email, playlistName, songTitle string) error
}

type notificationUsecase struct {
	repo      repository.NotificationRepository
	sender    EmailSender
	templates *template.Template
	logger    *zap.Logger
}

func NewNotificationUsecase(
	repo repository.NotificationRepository,
	sender EmailSender,
	tmpl *template.Template,
	logger *zap.Logger,
) NotificationUsecase {
	return &notificationUsecase{
		repo:      repo,
		sender:    sender,
		templates: tmpl,
		logger:    logger,
	}
}

// SendEmail is called by the gRPC handler for direct/admin sends (no idempotency key).
func (u *notificationUsecase) SendEmail(ctx context.Context, to, subject, body string, isHTML bool) error {
	err := u.sender.Send(to, subject, body, isHTML)
	status := entity.StatusSent
	errMsg := ""
	if err != nil {
		status = entity.StatusFailed
		errMsg = err.Error()
	}
	now := time.Now().UTC()
	var sentAt *time.Time
	if err == nil {
		sentAt = &now
	}
	_ = u.repo.Upsert(ctx, &entity.NotificationLog{
		ID:             uuid.NewString(),
		EventID:        uuid.NewString(), // no stable event_id for direct sends
		EventType:      "direct",
		RecipientEmail: to,
		Subject:        subject,
		Status:         status,
		ErrorMessage:   errMsg,
		SentAt:         sentAt,
		CreatedAt:      now,
	})
	return err
}

func (u *notificationUsecase) HandleUserRegistered(ctx context.Context, eventID, email, name string) error {
	return u.handle(ctx, eventID, "user.registered", email, "Welcome to Music App!", "welcome.html",
		map[string]string{"Name": name})
}

func (u *notificationUsecase) HandlePasswordReset(ctx context.Context, eventID, email, resetToken string) error {
	return u.handle(ctx, eventID, "user.password_reset", email, "Password Reset Request", "password_reset.html",
		map[string]string{"ResetToken": resetToken})
}

func (u *notificationUsecase) HandleSongUploaded(ctx context.Context, eventID, email, songTitle string) error {
	if email == "" {
		u.logger.Warn("song.uploaded event missing uploader email, skipping", zap.String("event_id", eventID))
		return nil
	}
	return u.handle(ctx, eventID, "song.uploaded", email, "Your song is live!", "song_uploaded.html",
		map[string]string{"SongTitle": songTitle})
}

func (u *notificationUsecase) HandlePlaylistSongAdded(ctx context.Context, eventID, email, playlistName, songTitle string) error {
	if email == "" {
		u.logger.Warn("playlist.song_added event missing user email, skipping", zap.String("event_id", eventID))
		return nil
	}
	return u.handle(ctx, eventID, "playlist.song_added", email, "Song added to your playlist", "playlist_song_added.html",
		map[string]interface{}{"PlaylistName": playlistName, "SongTitle": songTitle})
}

// handle is the shared idempotent, retrying email-send flow.
func (u *notificationUsecase) handle(
	ctx context.Context,
	eventID, eventType, email, subject, tmplName string,
	data any,
) error {
	exists, err := u.repo.ExistsByEventID(ctx, eventID, eventType)
	if err != nil {
		u.logger.Error("idempotency check failed", zap.Error(err), zap.String("event_id", eventID))
	}
	if exists {
		u.logger.Debug("event already processed, skipping", zap.String("event_id", eventID), zap.String("type", eventType))
		return nil
	}

	body, renderErr := u.render(tmplName, data)
	if renderErr != nil {
		u.logger.Error("template render failed", zap.String("template", tmplName), zap.Error(renderErr))
		body = "<p>" + subject + "</p>" // fallback
	}

	var sendErr error
	retryCount := 0
	for i, delay := range retryDelays {
		if delay > 0 {
			time.Sleep(delay)
		}
		sendErr = u.sender.Send(email, subject, body, true)
		if sendErr == nil {
			break
		}
		retryCount = i + 1
		u.logger.Warn("email send attempt failed",
			zap.String("event_id", eventID),
			zap.Int("attempt", i+1),
			zap.Error(sendErr),
		)
	}

	status := entity.StatusSent
	errMsg := ""
	var sentAt *time.Time
	if sendErr != nil {
		status = entity.StatusFailed
		errMsg = sendErr.Error()
	} else {
		now := time.Now().UTC()
		sentAt = &now
	}

	_ = u.repo.Upsert(ctx, &entity.NotificationLog{
		ID:             uuid.NewString(),
		EventID:        eventID,
		EventType:      eventType,
		RecipientEmail: email,
		Subject:        subject,
		Status:         status,
		ErrorMessage:   errMsg,
		RetryCount:     retryCount,
		SentAt:         sentAt,
		CreatedAt:      time.Now().UTC(),
	})

	return errors.Join(renderErr, sendErr)
}

func (u *notificationUsecase) render(name string, data any) (string, error) {
	var buf bytes.Buffer
	if err := u.templates.ExecuteTemplate(&buf, name, data); err != nil {
		return "", err
	}
	return buf.String(), nil
}
