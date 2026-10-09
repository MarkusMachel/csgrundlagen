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

const userSelect = `SELECT u.id, u.name, u.email, u.avatar_url, u.locale::text, u.role::text FROM users u`

func scanUser(row interface{ Scan(...any) error }) (User, error) {
	var u User
	err := row.Scan(&u.ID, &u.Name, &u.Email, &u.AvatarURL, &u.Locale, &u.Role)
	return u, notFound(err)
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

// Login checks the password and opens a session, returning the bearer token.
func (s *Store) Login(ctx context.Context, email, password string) (string, User, error) {
	var hash string
	var u User
	err := s.pool.QueryRow(ctx, `
		SELECT u.id, u.name, u.email, u.avatar_url, u.locale::text, u.role::text, u.password_hash
		FROM users u WHERE lower(u.email) = lower($1)`, strings.TrimSpace(email),
	).Scan(&u.ID, &u.Name, &u.Email, &u.AvatarURL, &u.Locale, &u.Role, &hash)
	if err != nil {
		if errors.Is(notFound(err), ErrNotFound) {
			_ = bcrypt.CompareHashAndPassword(dummyHash, []byte(password))
			return "", User{}, ErrBadCredentials
		}
		return "", User{}, err
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) != nil {
		return "", User{}, ErrBadCredentials
	}

	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", User{}, err
	}
	token := base64.RawURLEncoding.EncodeToString(raw)
	if _, err := s.pool.Exec(ctx, `
		INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)`,
		hashToken(token), u.ID, time.Now().Add(SessionTTL)); err != nil {
		return "", User{}, err
	}
	return token, u, nil
}

// UserForToken resolves a bearer token to its user, or ErrNotFound if the
// token is unknown or expired.
func (s *Store) UserForToken(ctx context.Context, token string) (User, error) {
	return scanUser(s.pool.QueryRow(ctx, userSelect+`
		JOIN sessions se ON se.user_id = u.id
		WHERE se.token_hash = $1 AND se.expires_at > now()`, hashToken(token)))
}

func (s *Store) Logout(ctx context.Context, token string) error {
	_, err := s.pool.Exec(ctx, `DELETE FROM sessions WHERE token_hash = $1`, hashToken(token))
	return err
}

// CreateUser inserts a user with a bcrypt-hashed password (used by cmd/adduser).
func (s *Store) CreateUser(ctx context.Context, name, email, password, role, locale string) (User, error) {
	if strings.TrimSpace(name) == "" || !strings.Contains(email, "@") || len(password) < 8 {
		return User{}, ErrInvalid{"name, a valid email, and a password of at least 8 characters are required"}
	}
	if role != "admin" && role != "user" {
		return User{}, ErrInvalid{"role must be admin or user"}
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return User{}, err
	}
	return scanUser(s.pool.QueryRow(ctx, `
		INSERT INTO users (name, email, password_hash, role, locale)
		VALUES ($1, $2, $3, $4::user_role, $5::locale)
		RETURNING id, name, email, avatar_url, locale::text, role::text`,
		name, strings.ToLower(strings.TrimSpace(email)), string(hash), role, NormalizeLocale(locale)))
}
