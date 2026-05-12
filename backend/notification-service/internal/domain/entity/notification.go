package entity

import "time"

const (
	StatusPending = "pending"
	StatusSent    = "sent"
	StatusFailed  = "failed"
)

type NotificationLog struct {
	ID             string
	EventID        string
	EventType      string
	RecipientEmail string
	Subject        string
	Status         string
	ErrorMessage   string
	RetryCount     int
	SentAt         *time.Time
	CreatedAt      time.Time
}
