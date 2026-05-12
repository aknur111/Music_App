package repository

import (
	"context"

	"github.com/music-app/notification-service/internal/domain/entity"
)

type NotificationRepository interface {
	// Upsert inserts a new log row or updates an existing one on (event_id, event_type) conflict.
	Upsert(ctx context.Context, log *entity.NotificationLog) error
	// ExistsByEventID returns true if a log with status "sent" already exists for this event.
	ExistsByEventID(ctx context.Context, eventID, eventType string) (bool, error)
}
