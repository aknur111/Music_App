package usecase

import "math"

// CosineSimilarity returns the cosine similarity between two 4-dimensional vectors,
// measuring the cosine of the angle between them. The result ranges from -1 (perfectly
// opposite directions) to 1 (perfectly aligned). Because audio feature values are
// non-negative, results for real tracks will always be in [0, 1].
//
// The formula is:  cos θ = (A · B) / (|A| × |B|)
//
// Returns 0 if either vector has zero magnitude to avoid division by zero. A zero
// vector means all four features are 0, which is physically impossible for a real track
// and indicates a missing or malformed row.
func CosineSimilarity(a, b [4]float64) float64 {
	var dot, sumA, sumB float64
	for i := range a {
		dot += a[i] * b[i]
		sumA += a[i] * a[i]
		sumB += b[i] * b[i]
	}
	if sumA == 0 || sumB == 0 {
		return 0
	}
	// Clamp to [-1, 1] to guard against floating-point rounding beyond unit range.
	result := dot / (math.Sqrt(sumA) * math.Sqrt(sumB))
	if result > 1 {
		return 1
	}
	if result < -1 {
		return -1
	}
	return result
}

// Distance returns the Euclidean (L2) distance between two 4-dimensional vectors.
// Smaller values indicate that the points are closer in audio feature space.
// Used as a tie-breaker when two tracks have identical cosine similarity scores.
func Distance(a, b [4]float64) float64 {
	var sum float64
	for i := range a {
		d := a[i] - b[i]
		sum += d * d
	}
	return math.Sqrt(sum)
}
