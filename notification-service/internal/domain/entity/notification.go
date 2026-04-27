package entity

import "time"

type NotificationLog struct {
	ID        string
	EventID   string
	EventType string
	Recipient string
	Subject   string
	Status    string
	Error     string
	CreatedAt time.Time
}
