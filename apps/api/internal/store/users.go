package store

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

// SessionTTL is how long a login token stays valid.
const SessionTTL = 30 * 24 * time.Hour

// ErrBadCredentials is returned for an unknown email or a wrong password,
// deliberately without saying which.
var ErrBadCredentials = errors.New("invalid email or password")

// dummyHash is compared against when the email is unknown, so a miss costs
// the same bcrypt work as a wrong password and can't be told apart by timing.
var dummyHash, _ = bcrypt.GenerateFromPassword([]byte("not-a-real-password"), bcrypt.DefaultCost)

const userSelect = `SELECT u.id, u.name, u.email, u.avatar_url, u.locale::text, u.role::text, u.privacy_version FROM users u`

func scanUser(row interface{ Scan(...any) error }) (User, error) {
	var u User
	err := row.Scan(&u.ID, &u.Name, &u.Email, &u.AvatarURL, &u.Locale, &u.Role, &u.PrivacyVersion)
	return u, notFound(err)
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

// Login checks the password and opens a session, returning the bearer token.
func (s *Store) Login(ctx context.Context, email, password string, client Client) (string, User, error) {
	var hash string
	var blocked bool
	var u User
	err := s.pool.QueryRow(ctx, `
		SELECT u.id, u.name, u.email, u.avatar_url, u.locale::text, u.role::text, u.privacy_version, u.password_hash,
		       u.blocked_at IS NOT NULL
		FROM users u WHERE lower(u.email) = lower($1)`, strings.TrimSpace(email),
	).Scan(&u.ID, &u.Name, &u.Email, &u.AvatarURL, &u.Locale, &u.Role, &u.PrivacyVersion, &hash, &blocked)
	if err != nil {
		if errors.Is(notFound(err), ErrNotFound) {
			_ = bcrypt.CompareHashAndPassword(dummyHash, []byte(password))
			return "", User{}, ErrBadCredentials
		}
		return "", User{}, err
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) != nil {
		s.recordEvent(ctx, s.pool, u.ID, "login_failed", client)
		return "", User{}, ErrBadCredentials
	}
	// Only revealed after the right password, so it says nothing to a guesser.
	if blocked {
		return "", User{}, ErrBlocked
	}
	token, err := s.openSession(ctx, u.ID, client)
	if err != nil {
		return "", User{}, err
	}
	s.recordEvent(ctx, s.pool, u.ID, "login", client)
	return token, u, nil
}

// newToken returns 32 random bytes, URL-safe encoded.
func newToken() (string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(raw), nil
}

// openSession starts a session for the user, remembering the device it was
// opened from, and returns its bearer token.
func (s *Store) openSession(ctx context.Context, userID string, client Client) (string, error) {
	token, err := newToken()
	if err != nil {
		return "", err
	}
	_, err = s.pool.Exec(ctx, `
		INSERT INTO sessions (token_hash, user_id, expires_at, ip, last_ip, user_agent)
		VALUES ($1, $2, $3, $4, $4, $5)`,
		hashToken(token), userID, time.Now().Add(SessionTTL), client.ip(), client.userAgent())
	return token, err
}

// UserForToken resolves a bearer token to its user, or ErrNotFound if the
// token is unknown or expired. It also marks the session as used from ip,
// at most once a minute so busy clients don't write on every request.
func (s *Store) UserForToken(ctx context.Context, token, ip string) (User, error) {
	return scanUser(s.pool.QueryRow(ctx, `
		WITH touched AS (
			UPDATE sessions SET last_seen_at = now(), last_ip = COALESCE($2, last_ip)
			WHERE token_hash = $1 AND expires_at > now()
			  AND (last_seen_at < now() - interval '1 minute' OR last_ip IS DISTINCT FROM COALESCE($2, last_ip))
		)
		`+userSelect+`
		JOIN sessions se ON se.user_id = u.id
		WHERE se.token_hash = $1 AND se.expires_at > now() AND u.blocked_at IS NULL`, hashToken(token), Client{IP: ip}.ip()))
}

func (s *Store) Logout(ctx context.Context, token string) error {
	_, err := s.pool.Exec(ctx, `DELETE FROM sessions WHERE token_hash = $1`, hashToken(token))
	return err
}

// Password rules: at least 8 characters, and at most 72 bytes because
// bcrypt ignores anything beyond that.
const (
	minPasswordLen = 8
	maxPasswordLen = 72
)

func validatePassword(pw string) error {
	if len(pw) < minPasswordLen {
		return ErrInvalid{"password must be at least 8 characters"}
	}
	if len(pw) > maxPasswordLen {
		return ErrInvalid{"password must be at most 72 bytes"}
	}
	return nil
}

func hashPassword(pw string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
	return string(hash), err
}

// CreateUser inserts a user with a bcrypt-hashed password (used by cmd/adduser
// and sign-up). A taken email is reported as ErrConflict.
func (s *Store) CreateUser(ctx context.Context, name, email, password, role, locale string) (User, error) {
	name, email = strings.TrimSpace(name), strings.ToLower(strings.TrimSpace(email))
	if name == "" || len(name) > 100 {
		return User{}, ErrInvalid{"name is required (at most 100 characters)"}
	}
	if at := strings.Index(email, "@"); at < 1 || at == len(email)-1 || len(email) > 254 {
		return User{}, ErrInvalid{"a valid email is required"}
	}
	if err := validatePassword(password); err != nil {
		return User{}, err
	}
	if role != "admin" && role != "user" {
		return User{}, ErrInvalid{"role must be admin or user"}
	}
	hash, err := hashPassword(password)
	if err != nil {
		return User{}, err
	}
	u, err := scanUser(s.pool.QueryRow(ctx, `
		INSERT INTO users (name, email, password_hash, role, locale)
		VALUES ($1, $2, $3, $4::user_role, $5::locale)
		ON CONFLICT (email) DO NOTHING
		RETURNING id, name, email, avatar_url, locale::text, role::text, privacy_version`,
		name, email, hash, role, NormalizeLocale(locale)))
	if errors.Is(err, ErrNotFound) {
		return User{}, ErrConflict{"an account with this email already exists"}
	}
	return u, err
}

// SignUp creates a regular (non-admin) account and logs it in. Signing up
// means accepting the current privacy policy; callers check the user agreed.
func (s *Store) SignUp(ctx context.Context, name, email, password, locale string, client Client) (string, User, error) {
	u, err := s.CreateUser(ctx, name, email, password, "user", locale)
	if err != nil {
		return "", User{}, err
	}
	if err := s.AcceptPrivacyPolicy(ctx, u.ID, PrivacyPolicyVersion); err != nil {
		return "", User{}, err
	}
	v := PrivacyPolicyVersion
	u.PrivacyVersion = &v
	token, err := s.openSession(ctx, u.ID, client)
	if err == nil {
		s.recordEvent(ctx, s.pool, u.ID, "signup", client)
	}
	return token, u, err
}

// PasswordResetTTL is how long a reset link stays usable.
const PasswordResetTTL = time.Hour

// CreatePasswordReset issues a single-use reset token for the account with
// this email, or ErrNotFound if there is none (callers must not reveal that).
func (s *Store) CreatePasswordReset(ctx context.Context, email string) (string, User, error) {
	u, err := scanUser(s.pool.QueryRow(ctx, userSelect+` WHERE lower(u.email) = lower($1)`,
		strings.TrimSpace(email)))
	if err != nil {
		return "", User{}, err
	}
	token, err := newToken()
	if err != nil {
		return "", User{}, err
	}
	_, err = s.pool.Exec(ctx, `
		INSERT INTO password_reset_tokens (token_hash, user_id, expires_at) VALUES ($1, $2, $3)`,
		hashToken(token), u.ID, time.Now().Add(PasswordResetTTL))
	return token, u, err
}

// ResetPassword sets a new password using a reset token, marks the token used,
// and signs the user out everywhere.
func (s *Store) ResetPassword(ctx context.Context, token, password string, client Client) error {
	if err := validatePassword(password); err != nil {
		return err
	}
	hash, err := hashPassword(password)
	if err != nil {
		return err
	}
	return s.withTx(ctx, func(tx pgx.Tx) error {
		var userID string
		err := tx.QueryRow(ctx, `
			UPDATE password_reset_tokens SET used_at = now()
			WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
			RETURNING user_id`, hashToken(token)).Scan(&userID)
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrInvalid{"this reset link is invalid or has expired"}
		}
		if err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `UPDATE users SET password_hash = $1 WHERE id = $2`, hash, userID); err != nil {
			return err
		}
		if _, err = tx.Exec(ctx, `DELETE FROM sessions WHERE user_id = $1`, userID); err != nil {
			return err
		}
		s.recordEvent(ctx, tx, userID, "password_reset", client)
		return nil
	})
}

// ChangePassword checks the current password, sets the new one, and ends the
// user's other sessions (the one making the request stays logged in).
func (s *Store) ChangePassword(ctx context.Context, userID, currentToken, current, next string) error {
	var hash string
	if err := s.pool.QueryRow(ctx, `SELECT password_hash FROM users WHERE id = $1`, userID).Scan(&hash); err != nil {
		return notFound(err)
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(current)) != nil {
		return ErrInvalid{"current password is incorrect"}
	}
	if err := validatePassword(next); err != nil {
		return err
	}
	newHash, err := hashPassword(next)
	if err != nil {
		return err
	}
	return s.withTx(ctx, func(tx pgx.Tx) error {
		if _, err := tx.Exec(ctx, `UPDATE users SET password_hash = $1 WHERE id = $2`, newHash, userID); err != nil {
			return err
		}
		_, err := tx.Exec(ctx, `DELETE FROM sessions WHERE user_id = $1 AND token_hash <> $2`,
			userID, hashToken(currentToken))
		return err
	})
}
