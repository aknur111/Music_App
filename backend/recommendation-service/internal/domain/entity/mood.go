package entity

import (
	"fmt"
	"strings"
)

// Mood is a named emotional state used to drive track recommendations.
type Mood string

const (
	MoodHappy     Mood = "happy"
	MoodSad       Mood = "sad"
	MoodEnergetic Mood = "energetic"
	MoodChill     Mood = "chill"
	MoodFocus     Mood = "focus"
	MoodWorkout   Mood = "workout"
	MoodRomantic  Mood = "romantic"
	MoodAngry     Mood = "angry"
)

// MoodVectors maps each mood to a 4D target vector:
// [valence, energy, danceability, tempo_normalized]
// where tempo_normalized = clamp((tempo - 60) / 140, 0, 1).
//
// NOTE: these values are informed estimates derived from Spotify audio feature
// distributions. After the first seed run, validate actual result counts per
// mood — especially "sad" (valence=0.15) and "angry" (valence=0.20) which
// may yield sparse results when combined with the popularity>=30 filter.
// Adjust valence thresholds empirically if result sets are too small.
// ParseMood validates a string mood name and returns the typed Mood constant.
// Comparison is case-insensitive: "Happy", "HAPPY", "happy" all resolve to MoodHappy.
// Returns an error with the full list of valid values on unknown input.
func ParseMood(s string) (Mood, error) {
	normalized := Mood(strings.ToLower(s))
	if _, ok := MoodVectors[normalized]; ok {
		return normalized, nil
	}
	return "", fmt.Errorf("unknown mood %q: must be one of happy, sad, energetic, chill, focus, workout, romantic, angry", s)
}

// AllMoods returns all 8 valid mood constants.
func AllMoods() []Mood {
	return []Mood{
		MoodHappy, MoodSad, MoodEnergetic, MoodChill,
		MoodFocus, MoodWorkout, MoodRomantic, MoodAngry,
	}
}

var MoodVectors = map[Mood][4]float64{
	//              valence  energy  danceability  tempo_norm
	MoodHappy:     {0.85, 0.75, 0.80, 0.60},
	MoodSad:       {0.15, 0.20, 0.25, 0.20},
	MoodEnergetic: {0.65, 0.95, 0.75, 0.85},
	MoodChill:     {0.60, 0.30, 0.45, 0.25},
	MoodFocus:     {0.45, 0.50, 0.35, 0.45},
	MoodWorkout:   {0.70, 0.90, 0.80, 0.90},
	MoodRomantic:  {0.75, 0.35, 0.50, 0.30},
	MoodAngry:     {0.20, 0.90, 0.50, 0.80},
}
