package store

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/crypto/bcrypt"
)

// ProfileUpdate holds the fields a user may change directly; nil leaves a
// field as it is.
type ProfileUpdate struct {
	Name   *string `json:"name"`
	Locale *string `json:"locale"`
}

// UpdateProfile changes the user's name and/or language.
func (s *Store) UpdateProfile(ctx context.Context, userID string, p ProfileUpdate) (User, error) {
	if p.Name != nil {
		name := strings.TrimSpace(*p.Name)
		if name == "" || len(name) > 100 {
			return User{}, ErrInvalid{"name is required (at most 100 characters)"}
		}
		p.Name = &name
	}
	var locale *string
	if p.Locale != nil {
		l := NormalizeLocale(*p.Locale)
		locale = &l
	}
	return scanUser(s.pool.QueryRow(ctx, `
		UPDATE users SET name = COALESCE($2, name), locale = COALESCE($3::locale, locale)
		WHERE id = $1
		RETURNING id, name, email, avatar_url, locale::text, role::text, privacy_version`,
		userID, p.Name, locale))
}

// EmailChangeTTL is how long a confirmation link for a new email stays usable.
const EmailChangeTTL = 24 * time.Hour

func normalizeEmail(email string) (string, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	if at := strings.Index(email, "@"); at < 1 || at == len(email)-1 || len(email) > 254 {
		return "", ErrInvalid{"a valid email is required"}
	}
	return email, nil
}

// RequestEmailChange checks the password and issues a confirmation token for
// the new address. The email only changes once the token is confirmed.
func (s *Store) RequestEmailChange(ctx context.Context, userID, newEmail, password string) (string, string, error) {
	email, err := normalizeEmail(newEmail)
	if err != nil {
		return "", "", err
	}
	var hash, current string
	if err := s.pool.QueryRow(ctx, `SELECT password_hash, email FROM users WHERE id = $1`, userID).Scan(&hash, &current); err != nil {
		return "", "", notFound(err)
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) != nil {
		return "", "", ErrInvalid{"password is incorrect"}
	}
	if email == current {
		return "", "", ErrInvalid{"that is already your email"}
	}
	var taken bool
	if err := s.pool.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM users WHERE lower(email) = $1)`, email).Scan(&taken); err != nil {
		return "", "", err
	}
	if taken {
		return "", "", ErrConflict{"an account with this email already exists"}
	}
	token, err := newToken()
	if err != nil {
		return "", "", err
	}
	_, err = s.pool.Exec(ctx, `
		INSERT INTO email_change_tokens (token_hash, user_id, new_email, expires_at) VALUES ($1, $2, $3, $4)`,
		hashToken(token), userID, email, time.Now().Add(EmailChangeTTL))
	return token, email, err
}

// ConfirmEmailChange applies a pending email change and returns the user's
// previous email, so they can be told about the change there.
func (s *Store) ConfirmEmailChange(ctx context.Context, token string) (User, string, error) {
	var u User
	var oldEmail string
	err := s.withTx(ctx, func(tx pgx.Tx) error {
		var userID, newEmail string
		err := tx.QueryRow(ctx, `
			UPDATE email_change_tokens SET used_at = now()
			WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
			RETURNING user_id, new_email`, hashToken(token)).Scan(&userID, &newEmail)
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrInvalid{"this confirmation link is invalid or has expired"}
		}
		if err != nil {
			return err
		}
		if err := tx.QueryRow(ctx, `SELECT email FROM users WHERE id = $1`, userID).Scan(&oldEmail); err != nil {
			return notFound(err)
		}
		u, err = scanUser(tx.QueryRow(ctx, `
			UPDATE users SET email = $2 WHERE id = $1
			RETURNING id, name, email, avatar_url, locale::text, role::text, privacy_version`, userID, newEmail))
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return ErrConflict{"an account with this email already exists"}
		}
		if err != nil {
			return err
		}
		// Any other pending change for this account is now stale.
		_, err = tx.Exec(ctx, `UPDATE email_change_tokens SET used_at = now()
			WHERE user_id = $1 AND used_at IS NULL`, userID)
		return err
	})
	return u, oldEmail, err
}
