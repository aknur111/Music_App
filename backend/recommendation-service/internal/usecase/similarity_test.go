package usecase_test

import (
	"math"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/music-app/recommendation-service/internal/usecase"
)

func TestCosineSimilarity_Identical(t *testing.T) {
	v := [4]float64{0.5, 0.7, 0.3, 0.6}
	assert.InDelta(t, 1.0, usecase.CosineSimilarity(v, v), 1e-9)
}

func TestCosineSimilarity_Opposite(t *testing.T) {
	a := [4]float64{1, 0, 0, 0}
	b := [4]float64{-1, 0, 0, 0}
	assert.InDelta(t, -1.0, usecase.CosineSimilarity(a, b), 1e-9)
}

func TestCosineSimilarity_Orthogonal(t *testing.T) {
	a := [4]float64{1, 0, 0, 0}
	b := [4]float64{0, 1, 0, 0}
	assert.InDelta(t, 0.0, usecase.CosineSimilarity(a, b), 1e-9)
}

func TestCosineSimilarity_ZeroVector_ReturnsZeroNoNaN(t *testing.T) {
	zero := [4]float64{0, 0, 0, 0}
	v := [4]float64{0.5, 0.5, 0.5, 0.5}
	got := usecase.CosineSimilarity(zero, v)
	assert.Equal(t, 0.0, got)
	assert.False(t, math.IsNaN(got))
}

func TestCosineSimilarity_KnownValue(t *testing.T) {
	// a=(3,4,0,0), b=(4,3,0,0): dot=24, |a|=|b|=5 → cos=24/25=0.96
	a := [4]float64{3, 4, 0, 0}
	b := [4]float64{4, 3, 0, 0}
	assert.InDelta(t, 0.96, usecase.CosineSimilarity(a, b), 1e-9)
}

func TestCosineSimilarity_ClampedToOne(t *testing.T) {
	// Identical vectors should never exceed 1.0 due to floating-point rounding.
	v := [4]float64{0.9999999, 0.9999999, 0.9999999, 0.9999999}
	got := usecase.CosineSimilarity(v, v)
	assert.LessOrEqual(t, got, 1.0)
	assert.InDelta(t, 1.0, got, 1e-6)
}

func TestDistance_SamePoint(t *testing.T) {
	v := [4]float64{0.4, 0.6, 0.3, 0.8}
	assert.InDelta(t, 0.0, usecase.Distance(v, v), 1e-9)
}

func TestDistance_KnownValue(t *testing.T) {
	// distance({3,4,0,0}, {0,0,0,0}) = 5
	a := [4]float64{3, 4, 0, 0}
	b := [4]float64{0, 0, 0, 0}
	assert.InDelta(t, 5.0, usecase.Distance(a, b), 1e-9)
}

func TestDistance_TriangleInequality(t *testing.T) {
	a := [4]float64{0.1, 0.2, 0.3, 0.4}
	b := [4]float64{0.5, 0.6, 0.7, 0.8}
	c := [4]float64{0.9, 0.1, 0.5, 0.2}
	ac := usecase.Distance(a, c)
	ab := usecase.Distance(a, b)
	bc := usecase.Distance(b, c)
	assert.LessOrEqual(t, ac, ab+bc+1e-9)
}
