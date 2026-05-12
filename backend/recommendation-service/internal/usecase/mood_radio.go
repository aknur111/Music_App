package usecase

import (
	"context"
	"fmt"
	"math/rand/v2"
	"sort"

	"go.uber.org/zap"

	"github.com/music-app/recommendation-service/internal/domain/entity"
)

const (
	radioSize        = 30   // total tracks per Mood Radio session
	radioSegmentSize = 10   // tracks per arc segment
	radioMinPop      = 20   // lower popularity floor for a wider candidate pool
	radioCandidates  = 2000 // candidates fetched before similarity ranking

	highSimThreshold = 0.85 // peak band: similarity in [0.85, 1.0]
	midSimLow        = 0.70 // mid  band: similarity in [0.70, 0.85)
	lowSimLow        = 0.55 // low  band: similarity in [0.55, 0.70) — fallback only
)

// BuildMoodRadio constructs a 30-track playlist with an intentional emotional arc.
//
// The arc has three segments of 10 tracks each:
//
//   - Warm-up  (tracks  1–10): mid-similarity band [0.70, 0.85), sorted ascending.
//     The listener eases into the mood gradually — tracks feel related but not yet
//     fully representative.
//
//   - Peak     (tracks 11–20): high-similarity band [0.85, 1.0], sorted by popularity DESC.
//     The most representative tracks of the mood, with crowd-favourites at the centre
//     to maximise engagement at the emotional high-point.
//
//   - Cool-down (tracks 21–30): mid-similarity band [0.70, 0.85), sorted descending.
//     Mirrors the warm-up in reverse — the listener gently exits the mood,
//     creating a satisfying narrative shape rather than an abrupt stop.
//
// Shuffling within each band before sorting ensures variety across repeated calls
// while preserving the arc's overall emotional shape.
//
// If a band has fewer than 10 tracks the next-lower band is used as a supplement,
// and a warning is logged — this is expected for moods with extreme audio feature
// vectors (e.g. "sad" or "angry") after empirical tuning.
func (uc *recommendationUsecase) BuildMoodRadio(ctx context.Context, mood entity.Mood) ([]*entity.Track, error) {
	candidates, err := uc.trackRepo.GetCandidatesForMood(ctx, mood, radioMinPop, radioCandidates)
	if err != nil {
		return nil, fmt.Errorf("GetCandidatesForMood: %w", err)
	}

	moodVec := entity.MoodVectors[mood]

	// score all candidates
	all := make([]ts, 0, len(candidates))
	for _, t := range candidates {
		all = append(all, ts{track: t, sim: CosineSimilarity(t.Vector(), moodVec)})
	}

	// partition into bands
	var highBand, midBand, lowBand []ts
	for _, s := range all {
		switch {
		case s.sim >= highSimThreshold:
			highBand = append(highBand, s)
		case s.sim >= midSimLow:
			midBand = append(midBand, s)
		case s.sim >= lowSimLow:
			lowBand = append(lowBand, s)
		}
	}

	// Shuffle mid band once, then slice it into two non-overlapping halves
	// so warm-up and cool-down draw from distinct tracks wherever possible.
	rand.Shuffle(len(midBand), func(i, j int) { midBand[i], midBand[j] = midBand[j], midBand[i] })

	warmUpPool := pickWithFallback(midBand, 0, radioSegmentSize, lowBand, "warm-up", mood, uc.logger)
	coolDownPool := pickWithFallback(midBand, radioSegmentSize, 2*radioSegmentSize, lowBand, "cool-down", mood, uc.logger)
	peakPool := pickPeak(highBand, midBand, radioSegmentSize, mood, uc.logger)

	// sort each segment to shape the arc
	sort.Slice(warmUpPool, func(i, j int) bool { return warmUpPool[i].sim < warmUpPool[j].sim })     // ascending → easing in
	sort.Slice(coolDownPool, func(i, j int) bool { return coolDownPool[i].sim > coolDownPool[j].sim }) // descending → easing out
	sort.Slice(peakPool, func(i, j int) bool { return peakPool[i].track.Popularity > peakPool[j].track.Popularity }) // popularity DESC at centre

	playlist := make([]*entity.Track, 0, radioSize)
	for _, s := range warmUpPool {
		playlist = append(playlist, s.track)
	}
	for _, s := range peakPool {
		playlist = append(playlist, s.track)
	}
	for _, s := range coolDownPool {
		playlist = append(playlist, s.track)
	}

	return playlist, nil
}

// pickWithFallback slices midBand[from:to], padding with shuffled lowBand if the
// primary slice is too short.
type ts = struct {
	track *entity.Track
	sim   float64
}

func pickWithFallback(mid []ts, from, to int, fallback []ts, seg string, mood entity.Mood, log *zap.Logger) []ts {
	primary := sliceSafe(mid, from, to)
	need := to - from
	if len(primary) >= need {
		return primary
	}
	log.Warn("mood radio mid band too small, supplementing from low band",
		zap.String("mood", string(mood)),
		zap.String("segment", seg),
		zap.Int("have", len(primary)),
		zap.Int("need", need),
	)
	fb := shuffledTs(fallback)
	pool := append(primary, fb...) //nolint:gocritic
	if len(pool) > need {
		pool = pool[:need]
	}
	return pool
}

// pickPeak selects the peak segment from the high band, falling back to the top
// of the mid band (by similarity) when high band is too sparse.
func pickPeak(high, mid []ts, n int, mood entity.Mood, log *zap.Logger) []ts {
	pool := shuffledTs(high)
	if len(pool) >= n {
		return pool[:n]
	}
	log.Warn("mood radio high band too small for peak, supplementing from mid band",
		zap.String("mood", string(mood)),
		zap.Int("have", len(pool)),
		zap.Int("need", n),
	)
	// supplement with highest-similarity mid tracks
	sorted := make([]ts, len(mid))
	copy(sorted, mid)
	sort.Slice(sorted, func(i, j int) bool { return sorted[i].sim > sorted[j].sim })
	pool = append(pool, sorted...)
	if len(pool) > n {
		pool = pool[:n]
	}
	return pool
}

func sliceSafe(s []ts, from, to int) []ts {
	if from >= len(s) {
		return nil
	}
	if to > len(s) {
		to = len(s)
	}
	out := make([]ts, to-from)
	copy(out, s[from:to])
	return out
}

func shuffledTs(in []ts) []ts {
	out := make([]ts, len(in))
	copy(out, in)
	rand.Shuffle(len(out), func(i, j int) { out[i], out[j] = out[j], out[i] })
	return out
}
