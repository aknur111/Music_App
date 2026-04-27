package usecase

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/music-app/notification-service/internal/domain/entity"
	"github.com/music-app/notification-service/internal/domain/repository"
	"github.com/music-app/notification-service/internal/smtp"
)

type NotificationUsecase interface {
	SendEmail(ctx context.Context, to, subject, body string, isHTML bool) error
	HandleUserRegistered(ctx context.Context, eventID, email, name string) error
	HandlePasswordReset(ctx context.Context, eventID, email, resetToken string) error
	HandleSongUploaded(ctx context.Context, eventID, email, songTitle string) error
	HandlePlaylistSongAdded(ctx context.Context, eventID, email, playlistName, songTitle string) error
}

type notificationUsecase struct {
	repo   repository.NotificationRepository
	sender *smtp.Sender
}

func NewNotificationUsecase(repo repository.NotificationRepository, sender *smtp.Sender) NotificationUsecase {
	return &notificationUsecase{repo: repo, sender: sender}
}

func (u *notificationUsecase) SendEmail(ctx context.Context, to, subject, body string, isHTML bool) error {
	err := u.sender.Send(to, subject, body, isHTML)
	status := "sent"
	errMsg := ""
	if err != nil {
		status = "failed"
		errMsg = err.Error()
	}
	_ = u.repo.Save(ctx, &entity.NotificationLog{
		ID:        uuid.NewString(),
		EventID:   uuid.NewString(),
		EventType: "direct",
		Recipient: to,
		Subject:   subject,
		Status:    status,
		Error:     errMsg,
		CreatedAt: time.Now().UTC(),
	})
	return err
}

func (u *notificationUsecase) HandleUserRegistered(ctx context.Context, eventID, email, name string) error {
	exists, _ := u.repo.ExistsByEventID(ctx, eventID, "user.registered")
	if exists {
		return nil
	}

	subject := "Welcome to Music App!"
	body := "<h1>Welcome, " + name + "!</h1><p>Your account has been created successfully.</p>"

	err := u.sender.Send(email, subject, body, true)
	_ = u.repo.Save(ctx, logEntry(eventID, "user.registered", email, subject, err))
	return err
}

func (u *notificationUsecase) HandlePasswordReset(ctx context.Context, eventID, email, resetToken string) error {
	exists, _ := u.repo.ExistsByEventID(ctx, eventID, "user.password_reset")
	if exists {
		return nil
	}

	subject := "Password Reset Request"
	body := "<p>Use this token to reset your password: <strong>" + resetToken + "</strong></p><p>Expires in 30 minutes.</p>"

	err := u.sender.Send(email, subject, body, true)
	_ = u.repo.Save(ctx, logEntry(eventID, "user.password_reset", email, subject, err))
	return err
}

func (u *notificationUsecase) HandleSongUploaded(ctx context.Context, eventID, email, songTitle string) error {
	exists, _ := u.repo.ExistsByEventID(ctx, eventID, "song.uploaded")
	if exists {
		return nil
	}

	subject := "Your song is live!"
	body := "<p>Your song <strong>" + songTitle + "</strong> has been uploaded successfully.</p>"

	err := u.sender.Send(email, subject, body, true)
	_ = u.repo.Save(ctx, logEntry(eventID, "song.uploaded", email, subject, err))
	return err
}

func (u *notificationUsecase) HandlePlaylistSongAdded(ctx context.Context, eventID, email, playlistName, songTitle string) error {
	exists, _ := u.repo.ExistsByEventID(ctx, eventID, "playlist.song_added")
	if exists {
		return nil
	}

	subject := "Song added to your playlist"
	body := "<p><strong>" + songTitle + "</strong> was added to your playlist <strong>" + playlistName + "</strong>.</p>"

	err := u.sender.Send(email, subject, body, true)
	_ = u.repo.Save(ctx, logEntry(eventID, "playlist.song_added", email, subject, err))
	return err
}

func logEntry(eventID, eventType, recipient, subject string, err error) *entity.NotificationLog {
	status, errMsg := "sent", ""
	if err != nil {
		status, errMsg = "failed", err.Error()
	}
	return &entity.NotificationLog{
		ID:        uuid.NewString(),
		EventID:   eventID,
		EventType: eventType,
		Recipient: recipient,
		Subject:   subject,
		Status:    status,
		Error:     errMsg,
		CreatedAt: time.Now().UTC(),
	}
}
