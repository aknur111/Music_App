package entity

import "time"

type User struct {
	ID                  string
	Name                string
	Email               string
	Role                string
	PasswordHash        string
	EmailVerified       bool
	EmailVerifyToken    string
	EmailVerifyExpiry   *time.Time
	PasswordResetToken  string
	PasswordResetExpiry *time.Time
	CreatedAt           time.Time
	UpdatedAt           time.Time
	DeletedAt           *time.Time
}

type RefreshToken struct {
	ID        string
	UserID    string
	TokenHash string
	ExpiresAt time.Time
	CreatedAt time.Time
}
