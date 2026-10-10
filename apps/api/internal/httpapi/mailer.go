package httpapi

import (
	"context"
	"log/slog"
)

// Mailer sends transactional email (password reset links).
type Mailer interface {
	Send(ctx context.Context, to, subject, body string) error
}

// LogMailer "sends" mail by writing it to the log. It's the default until a
// real provider is configured, so in development the reset link shows up in
// `docker compose logs api`.
type LogMailer struct{ Log *slog.Logger }

func (m LogMailer) Send(_ context.Context, to, subject, body string) error {
	m.Log.Info("email (not sent: no mail provider configured)", "to", to, "subject", subject, "body", body)
	return nil
}
