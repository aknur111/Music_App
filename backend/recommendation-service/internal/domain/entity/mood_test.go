package entity_test

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/music-app/recommendation-service/internal/domain/entity"
)

func TestParseMood_LowerCase(t *testing.T) {
	for _, m := range entity.AllMoods() {
		got, err := entity.ParseMood(string(m))
		require.NoError(t, err, "lowercase %q should parse", m)
		assert.Equal(t, m, got)
	}
}

func TestParseMood_CaseInsensitive(t *testing.T) {
	cases := []struct {
		input    string
		expected entity.Mood
	}{
		{"Happy", entity.MoodHappy},
		{"HAPPY", entity.MoodHappy},
		{"Sad", entity.MoodSad},
		{"SAD", entity.MoodSad},
		{"ENERGETIC", entity.MoodEnergetic},
		{"Workout", entity.MoodWorkout},
		{"ROMANTIC", entity.MoodRomantic},
	}
	for _, tc := range cases {
		got, err := entity.ParseMood(tc.input)
		require.NoError(t, err, "input %q", tc.input)
		assert.Equal(t, tc.expected, got)
	}
}

func TestParseMood_InvalidString(t *testing.T) {
	invalids := []string{"vibing", "", "Happy!", "joyful", "RAGE"}
	for _, s := range invalids {
		_, err := entity.ParseMood(s)
		require.Error(t, err, "expected error for %q", s)
		assert.Contains(t, err.Error(), "must be one of")
	}
}

func TestAllMoods_ReturnsEight(t *testing.T) {
	moods := entity.AllMoods()
	assert.Len(t, moods, 8, "must have exactly 8 moods")

	// verify no duplicates
	seen := make(map[entity.Mood]bool, 8)
	for _, m := range moods {
		assert.False(t, seen[m], "duplicate mood: %q", m)
		seen[m] = true
	}
}

func TestMoodVectors_AllMoodsHaveVector(t *testing.T) {
	for _, m := range entity.AllMoods() {
		vec, ok := entity.MoodVectors[m]
		require.True(t, ok, "mood %q missing from MoodVectors", m)
		for i, v := range vec {
			assert.GreaterOrEqual(t, v, 0.0, "mood %q vector[%d] must be >= 0", m, i)
			assert.LessOrEqual(t, v, 1.0, "mood %q vector[%d] must be <= 1", m, i)
		}
	}
}
