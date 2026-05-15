package entity

import "time"

type Artist struct {
	ID        string
	Name      string
	Bio       string
	AvatarUrl string
	CreatedAt time.Time
}

type Album struct {
	ID        string
	Title     string
	ArtistID  string
	Artist    string
	Year      int
	CreatedAt time.Time
	CoverUrl  string
}

type Song struct {
	ID         string
	Title      string
	ArtistID   string
	Artist     string
	AlbumID    string
	Album      string
	DurationS  int
	Genre      string
	SearchVec  string
	CreatedAt  time.Time
	UploaderID string
	UpdatedAt  time.Time
	CoverUrl   string
	PreviewUrl string
}
