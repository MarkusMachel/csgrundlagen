package store

import (
	"testing"
	"time"
)

func TestNextReview(t *testing.T) {
	now := time.Date(2026, 10, 10, 12, 0, 0, 0, time.UTC)
	days := func(s ReviewState) float64 { return s.DueAt.Sub(now).Hours() / 24 }

	s := NextReview(nil, true, now)
	if s.Repetitions != 1 || days(s) != 1 {
		t.Fatalf("first correct: %+v, due in %v days", s, days(s))
	}
	s = NextReview(&s, true, now)
	if s.Repetitions != 2 || days(s) != 3 {
		t.Fatalf("second correct: %+v, due in %v days", s, days(s))
	}
	third := NextReview(&s, true, now)
	if third.Repetitions != 3 || days(third) <= 3 || days(third) > 3*maxEase {
		t.Fatalf("third correct should grow the gap by the ease: %+v (%v days)", third, days(third))
	}

	wrong := NextReview(&third, false, now)
	if wrong.Repetitions != 0 || wrong.DueAt != now.Add(relearnGap) || wrong.Ease >= third.Ease {
		t.Fatalf("wrong answer should reset, relearn in 10 min and lower ease: %+v", wrong)
	}
	// Ease never drops below the SM-2 floor, however often a question is missed.
	for i := 0; i < 20; i++ {
		wrong = NextReview(&wrong, false, now)
	}
	if wrong.Ease != minEase {
		t.Fatalf("ease floor: got %v", wrong.Ease)
	}
	// And never climbs above the cap.
	for i := 0; i < 50; i++ {
		s = NextReview(&s, true, now)
	}
	if s.Ease != maxEase {
		t.Fatalf("ease cap: got %v", s.Ease)
	}
	// ...and the gap stops growing at a year instead of overflowing.
	if s.IntervalDays != maxIntervalDays || days(s) != maxIntervalDays {
		t.Fatalf("interval cap: %+v, due in %v days", s, days(s))
	}
}
