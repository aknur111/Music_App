package entity

type Track struct {
	ID               string
	SpotifyID        string
	Name             string
	Artists          string
	Album            string
	Genre            string
	DurationMS       int
	Popularity       int
	Valence          float64
	Energy           float64
	Danceability     float64
	Tempo            float64
	Acousticness     float64
	Instrumentalness float64
	Loudness         float64
	Speechiness      float64
}
