package entity

import "time"

type UserTasteProfile struct {
	UserID          string
	AvgValence      float64
	AvgEnergy       float64
	AvgDanceability float64
	AvgTempo        float64
	PlayCount       int
	UpdatedAt       time.Time
}

// Vector returns the normalized 4D feature vector used for cosine similarity:
// [valence, energy, danceability, tempo_normalized].
// tempo_normalized = clamp((tempo - 60) / 140, 0, 1)
func (p *UserTasteProfile) Vector() [4]float64 {
	tempoNorm := (p.AvgTempo - 60) / 140
	if tempoNorm < 0 {
		tempoNorm = 0
	}
	if tempoNorm > 1 {
		tempoNorm = 1
	}
	return [4]float64{p.AvgValence, p.AvgEnergy, p.AvgDanceability, tempoNorm}
}
