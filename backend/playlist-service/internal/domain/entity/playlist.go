package entity

import "time"

type Playlist struct {
	ID          string
	UserID      string
	Name        string
	Description string
	SongCount   int
	Songs       []*PlaylistSong
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type PlaylistSong struct {
	PlaylistID string
	SongID     string
	Title      string
	Artist     string
	CoverURL   string
	AudioURL   string
	DurationS  int
	Position   int
	AddedAt    time.Time
}
