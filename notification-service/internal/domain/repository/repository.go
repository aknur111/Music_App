package repository

import (
	"context"

	"github.com/music-app/notification-service/internal/domain/entity"
)

type NotificationRepository interface {
	Save(ctx context.Context, log *entity.NotificationLog) error
	ExistsByEventID(ctx context.Context, eventID, eventType string) (bool, error)
}
