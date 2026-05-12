package usecase_test

import (
	"context"
	"errors"
	"html/template"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.uber.org/zap"

	"github.com/music-app/notification-service/internal/domain/entity"
	"github.com/music-app/notification-service/internal/usecase"
)

// ── inline mocks ─────────────────────────────────────────────────────────────

type mockRepo struct{ mock.Mock }

func (m *mockRepo) Upsert(ctx context.Context, log *entity.NotificationLog) error {
	return m.Called(ctx, log).Error(0)
}

func (m *mockRepo) ExistsByEventID(ctx context.Context, eventID, eventType string) (bool, error) {
	args := m.Called(ctx, eventID, eventType)
	return args.Bool(0), args.Error(1)
}

type mockSender struct{ mock.Mock }

func (m *mockSender) Send(to, subject, body string, isHTML bool) error {
	return m.Called(to, subject, body, isHTML).Error(0)
}

// ── helpers ───────────────────────────────────────────────────────────────────

func noopLogger() *zap.Logger { return zap.NewNop() }

func testTemplates() *template.Template {
	const tmplSrc = `
{{define "welcome.html"}}Welcome {{.Name}}{{end}}
{{define "password_reset.html"}}Reset token: {{.ResetToken}}{{end}}
{{define "song_uploaded.html"}}Song uploaded: {{.SongTitle}}{{end}}
{{define "playlist_song_added.html"}}{{.SongTitle}} added to {{.PlaylistName}}{{end}}
`
	return template.Must(template.New("").Parse(tmplSrc))
}

func newUC(t *testing.T, repo *mockRepo, sender *mockSender) usecase.NotificationUsecase {
	t.Helper()
	// Zero out delays so unit tests don't sleep for 6 s.
	orig := usecase.ExportRetryDelays()
	usecase.SetRetryDelays([]time.Duration{0, 0, 0})
	t.Cleanup(func() { usecase.SetRetryDelays(orig) })
	return usecase.NewNotificationUsecase(repo, sender, testTemplates(), noopLogger())
}

// ── HandleUserRegistered ──────────────────────────────────────────────────────

func TestHandleUserRegistered_Success(t *testing.T) {
	repo := new(mockRepo)
	sender := new(mockSender)

	repo.On("ExistsByEventID", mock.Anything, "evt-1", "user.registered").Return(false, nil)
	sender.On("Send", "alice@example.com", "Welcome to Music App!", mock.Anything, true).Return(nil)
	repo.On("Upsert", mock.Anything, mock.MatchedBy(func(log *entity.NotificationLog) bool {
		return log.Status == entity.StatusSent && log.EventID == "evt-1"
	})).Return(nil)

	uc := newUC(t, repo, sender)
	err := uc.HandleUserRegistered(context.Background(), "evt-1", "alice@example.com", "Alice")

	assert.NoError(t, err)
	repo.AssertExpectations(t)
	sender.AssertExpectations(t)
}

func TestHandleUserRegistered_Idempotent(t *testing.T) {
	repo := new(mockRepo)
	sender := new(mockSender)

	repo.On("ExistsByEventID", mock.Anything, "evt-dup", "user.registered").Return(true, nil)

	uc := newUC(t, repo, sender)
	err := uc.HandleUserRegistered(context.Background(), "evt-dup", "alice@example.com", "Alice")

	assert.NoError(t, err)
	sender.AssertNotCalled(t, "Send")
}

func TestHandleUserRegistered_SendFails_LogsFailedStatus(t *testing.T) {
	repo := new(mockRepo)
	sender := new(mockSender)

	repo.On("ExistsByEventID", mock.Anything, "evt-2", "user.registered").Return(false, nil)
	sendErr := errors.New("smtp timeout")
	// retry: 3 attempts total
	sender.On("Send", "bob@example.com", "Welcome to Music App!", mock.Anything, true).
		Return(sendErr).Times(3)
	repo.On("Upsert", mock.Anything, mock.MatchedBy(func(log *entity.NotificationLog) bool {
		return log.Status == entity.StatusFailed &&
			log.ErrorMessage == "smtp timeout" &&
			log.RetryCount == 3 // all 3 attempts failed
	})).Return(nil)

	uc := newUC(t, repo, sender)
	err := uc.HandleUserRegistered(context.Background(), "evt-2", "bob@example.com", "Bob")

	assert.Error(t, err)
	repo.AssertExpectations(t)
	sender.AssertExpectations(t)
}

// ── HandlePasswordReset ───────────────────────────────────────────────────────

func TestHandlePasswordReset_Success(t *testing.T) {
	repo := new(mockRepo)
	sender := new(mockSender)

	repo.On("ExistsByEventID", mock.Anything, "evt-3", "user.password_reset").Return(false, nil)
	sender.On("Send", "carol@example.com", "Password Reset Request",
		mock.MatchedBy(func(body string) bool { return strings.Contains(body, "tok-abc") }),
		true).Return(nil)
	repo.On("Upsert", mock.Anything, mock.MatchedBy(func(log *entity.NotificationLog) bool {
		return log.Status == entity.StatusSent
	})).Return(nil)

	uc := newUC(t, repo, sender)
	err := uc.HandlePasswordReset(context.Background(), "evt-3", "carol@example.com", "tok-abc")

	assert.NoError(t, err)
	repo.AssertExpectations(t)
}

// ── HandleSongUploaded ────────────────────────────────────────────────────────

func TestHandleSongUploaded_EmptyEmail_Skips(t *testing.T) {
	repo := new(mockRepo)
	sender := new(mockSender)

	uc := newUC(t, repo, sender)
	err := uc.HandleSongUploaded(context.Background(), "evt-4", "", "My Track")

	assert.NoError(t, err)
	sender.AssertNotCalled(t, "Send")
	repo.AssertNotCalled(t, "Upsert")
}

func TestHandleSongUploaded_Success(t *testing.T) {
	repo := new(mockRepo)
	sender := new(mockSender)

	repo.On("ExistsByEventID", mock.Anything, "evt-5", "song.uploaded").Return(false, nil)
	sender.On("Send", "dave@example.com", "Your song is live!", mock.Anything, true).Return(nil)
	repo.On("Upsert", mock.Anything, mock.MatchedBy(func(log *entity.NotificationLog) bool {
		return log.Status == entity.StatusSent && log.EventType == "song.uploaded"
	})).Return(nil)

	uc := newUC(t, repo, sender)
	err := uc.HandleSongUploaded(context.Background(), "evt-5", "dave@example.com", "Sunrise")

	assert.NoError(t, err)
}

// ── HandlePlaylistSongAdded ───────────────────────────────────────────────────

func TestHandlePlaylistSongAdded_EmptyEmail_Skips(t *testing.T) {
	repo := new(mockRepo)
	sender := new(mockSender)

	uc := newUC(t, repo, sender)
	err := uc.HandlePlaylistSongAdded(context.Background(), "evt-6", "", "Chill Vibes", "Lo-Fi Beat")

	assert.NoError(t, err)
	sender.AssertNotCalled(t, "Send")
}

// ── SendEmail (direct/gRPC) ───────────────────────────────────────────────────

func TestSendEmail_Success(t *testing.T) {
	repo := new(mockRepo)
	sender := new(mockSender)

	sender.On("Send", "eve@example.com", "Hi", "Hello", false).Return(nil)
	repo.On("Upsert", mock.Anything, mock.MatchedBy(func(log *entity.NotificationLog) bool {
		return log.Status == entity.StatusSent && log.EventType == "direct" && log.SentAt != nil
	})).Return(nil)

	uc := newUC(t, repo, sender)
	err := uc.SendEmail(context.Background(), "eve@example.com", "Hi", "Hello", false)

	assert.NoError(t, err)
}

func TestSendEmail_Failure_LogsStatus(t *testing.T) {
	repo := new(mockRepo)
	sender := new(mockSender)

	sender.On("Send", "eve@example.com", "Hi", "Hello", false).Return(errors.New("refused"))
	repo.On("Upsert", mock.Anything, mock.MatchedBy(func(log *entity.NotificationLog) bool {
		return log.Status == entity.StatusFailed
	})).Return(nil)

	uc := newUC(t, repo, sender)
	err := uc.SendEmail(context.Background(), "eve@example.com", "Hi", "Hello", false)

	assert.Error(t, err)
}

// ── RetryCount accuracy ───────────────────────────────────────────────────────

func TestHandleUserRegistered_SucceedsOnSecondAttempt(t *testing.T) {
	repo := new(mockRepo)
	sender := new(mockSender)

	repo.On("ExistsByEventID", mock.Anything, "evt-7", "user.registered").Return(false, nil)
	// First attempt fails, second succeeds
	sender.On("Send", "frank@example.com", "Welcome to Music App!", mock.Anything, true).
		Return(errors.New("transient")).Once()
	sender.On("Send", "frank@example.com", "Welcome to Music App!", mock.Anything, true).
		Return(nil).Once()
	repo.On("Upsert", mock.Anything, mock.MatchedBy(func(log *entity.NotificationLog) bool {
		return log.Status == entity.StatusSent && log.RetryCount == 1 && log.SentAt != nil
	})).Return(nil)

	uc := newUC(t, repo, sender)
	err := uc.HandleUserRegistered(context.Background(), "evt-7", "frank@example.com", "Frank")

	assert.NoError(t, err)
	sender.AssertExpectations(t)
}
