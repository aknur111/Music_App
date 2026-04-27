package postgres

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/music-app/notification-service/internal/domain/entity"
	"github.com/music-app/notification-service/internal/domain/repository"
)

type notificationRepository struct {
	db *pgxpool.Pool
}

func NewNotificationRepository(db *pgxpool.Pool) repository.NotificationRepository {
	return &notificationRepository{db: db}
}

func (r *notificationRepository) Save(ctx context.Context, log *entity.NotificationLog) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO notification_logs (id, event_id, event_type, recipient, subject, status, error, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		log.ID, log.EventID, log.EventType, log.Recipient, log.Subject, log.Status, log.Error, log.CreatedAt,
	)
	return err
}

func (r *notificationRepository) ExistsByEventID(ctx context.Context, eventID, eventType string) (bool, error) {
	var count int
	err := r.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM notification_logs WHERE event_id = $1 AND event_type = $2 AND status = 'sent'`,
		eventID, eventType,
	).Scan(&count)
	return count > 0, err
}
