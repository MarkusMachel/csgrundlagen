package store

import (
	"testing"
	"time"
)

func TestAnswerTime(t *testing.T) {
	now := time.Date(2026, 10, 10, 12, 0, 0, 0, time.UTC)
	hourAgo := now.Add(-time.Hour)
	future := now.Add(time.Hour)
	ancient := now.Add(-40 * 24 * time.Hour)
	for _, c := range []struct {
		name string
		at   *time.Time
		want time.Time
	}{
		{"online", nil, now},
		{"offline an hour ago", &hourAgo, hourAgo},
		{"clock ahead", &future, now},
		{"too old", &ancient, now},
	} {
		if got := answerTime(c.at, now); !got.Equal(c.want) {
			t.Errorf("%s: got %v, want %v", c.name, got, c.want)
		}
	}
}
