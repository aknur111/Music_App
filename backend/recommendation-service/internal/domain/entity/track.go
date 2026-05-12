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
	PreviewURL       string
}

// Vector returns the normalised 4D feature vector [valence, energy, danceability, tempo_normalised]
// used for cosine similarity matching against mood vectors and other tracks.
// tempo_normalised = clamp((tempo - 60) / 140, 0, 1)
func (t *Track) Vector() [4]float64 {
	tempoNorm := (t.Tempo - 60) / 140
	if tempoNorm < 0 {
		tempoNorm = 0
	}
	if tempoNorm > 1 {
		tempoNorm = 1
	}
	return [4]float64{t.Valence, t.Energy, t.Danceability, tempoNorm}
}
