package db

import (
	"context"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Listen calls onNotify for every notification on channel until ctx ends. It
// keeps its own connection (configured like the pool's, but not taking one of
// the pool's slots); if that breaks it reconnects, calling onNotify once more
// since notifications may have been missed meanwhile.
func Listen(ctx context.Context, pool *pgxpool.Pool, channel string, onNotify func(), log *slog.Logger) {
	backoff := time.Second
	for ctx.Err() == nil {
		err := listenOnce(ctx, pool, channel, onNotify, func() { backoff = time.Second })
		if ctx.Err() != nil {
			return
		}
		log.Warn("listen interrupted, reconnecting", "channel", channel, "err", err, "in", backoff)
		onNotify()
		select {
		case <-ctx.Done():
			return
		case <-time.After(backoff):
		}
		backoff = min(backoff*2, time.Minute)
	}
}

func listenOnce(ctx context.Context, pool *pgxpool.Pool, channel string, onNotify, connected func()) error {
	conn, err := pgx.ConnectConfig(ctx, pool.Config().ConnConfig.Copy())
	if err != nil {
		return err
	}
	defer conn.Close(context.Background())
	if _, err := conn.Exec(ctx, "LISTEN "+quoteIdent(channel)); err != nil {
		return err
	}
	connected()
	for {
		if _, err := conn.WaitForNotification(ctx); err != nil {
			return err
		}
		onNotify()
	}
}

func quoteIdent(s string) string {
	out := `"`
	for _, r := range s {
		if r == '"' {
			out += `""`
		} else {
			out += string(r)
		}
	}
	return out + `"`
}
