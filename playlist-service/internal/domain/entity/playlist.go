package entity

import "time"

type Playlist struct {
	ID          string
	UserID      string
	Name        string
	Description string
	SongCount   int
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type PlaylistSong struct {
	PlaylistID string
	SongID     string
	Position   int
	AddedAt    time.Time
}
