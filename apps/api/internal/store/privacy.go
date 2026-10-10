package store

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

// PrivacyPolicyVersion is the version of the privacy policy the web app shows
// (apps/web/src/features/privacy/policy.ts). Bump both together when the
// policy changes; signed-in users are then asked to read the new one.
const PrivacyPolicyVersion = "2026-10-10"

// Consent is a user's choice for the optional storage categories.
type Consent struct {
	PolicyVersion string    `json:"policyVersion"`
	Preferences   bool      `json:"preferences"`
	DeviceDetails bool      `json:"deviceDetails"`
	CreatedAt     time.Time `json:"createdAt"`
}

// RecordConsent logs a consent choice. A choice identical to the user's latest
// one is not logged again, so the client may send it on every page load.
// Withdrawing device-details consent erases what was collected under it.
func (s *Store) RecordConsent(ctx context.Context, userID string, c Consent, client Client) error {
	if c.PolicyVersion == "" {
		c.PolicyVersion = PrivacyPolicyVersion
	}
	return s.withTx(ctx, func(tx pgx.Tx) error {
		// Lock the user so concurrent requests (two tabs, React's double effects
		// in development) can't both pass the "same as latest" check.
		if _, err := tx.Exec(ctx, `SELECT 1 FROM users WHERE id = $1 FOR UPDATE`, userID); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO consent_records (user_id, policy_version, preferences, device_details, ip, user_agent)
			SELECT $1, $2, $3, $4, $5, $6
			WHERE NOT EXISTS (
				SELECT 1 FROM (
					SELECT policy_version, preferences, device_details FROM consent_records
					WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT 1
				) latest
				WHERE latest.policy_version = $2 AND latest.preferences = $3 AND latest.device_details = $4
			)`, userID, clip(c.PolicyVersion, 32), c.Preferences, c.DeviceDetails, client.ip(), client.userAgent()); err != nil {
			return err
		}
		if !c.DeviceDetails {
			_, err := tx.Exec(ctx, `UPDATE sessions SET client_info = NULL WHERE user_id = $1`, userID)
			return err
		}
		return nil
	})
}

// LatestConsent is the user's current choice, or nil if they never made one.
func (s *Store) LatestConsent(ctx context.Context, userID string) (*Consent, error) {
	var c Consent
	err := s.pool.QueryRow(ctx, `
		SELECT policy_version, preferences, device_details, created_at FROM consent_records
		WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT 1`, userID,
	).Scan(&c.PolicyVersion, &c.Preferences, &c.DeviceDetails, &c.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return &c, err
}

// AcceptPrivacyPolicy records that the user has read the current policy.
func (s *Store) AcceptPrivacyPolicy(ctx context.Context, userID, version string) error {
	if version != PrivacyPolicyVersion {
		return ErrInvalid{"that is not the current privacy policy"}
	}
	_, err := s.pool.Exec(ctx, `
		UPDATE users SET privacy_version = $2, privacy_accepted_at = now() WHERE id = $1`, userID, version)
	return err
}

// ExportUserData returns everything stored about the user, for the "download
// my data" button (GDPR Art. 15 and 20). Password and token hashes are left
// out; they are credentials, not information about the person.
func (s *Store) ExportUserData(ctx context.Context, userID string) (json.RawMessage, error) {
	var out json.RawMessage
	err := s.pool.QueryRow(ctx, `
		SELECT json_build_object(
		  'exportedAt', now(),
		  'privacyPolicyVersion', $2::text,
		  'profile', (SELECT json_build_object(
		      'id', id, 'name', name, 'email', email, 'avatarUrl', avatar_url, 'locale', locale,
		      'role', role, 'createdAt', created_at,
		      'privacyVersion', privacy_version, 'privacyAcceptedAt', privacy_accepted_at)
		    FROM users WHERE id = $1),
		  'sessions', (SELECT COALESCE(json_agg(t ORDER BY t.created_at), '[]') FROM (
		      SELECT id, created_at, last_seen_at, expires_at, ip, last_ip, user_agent, client_info
		      FROM sessions WHERE user_id = $1) t),
		  'signInHistory', (SELECT COALESCE(json_agg(t ORDER BY t.created_at), '[]') FROM (
		      SELECT kind, ip, user_agent, created_at FROM login_events WHERE user_id = $1) t),
		  'consents', (SELECT COALESCE(json_agg(t ORDER BY t.created_at), '[]') FROM (
		      SELECT policy_version, preferences, device_details, ip, user_agent, created_at
		      FROM consent_records WHERE user_id = $1) t),
		  'answers', (SELECT COALESCE(json_agg(t ORDER BY t.answered_at), '[]') FROM (
		      SELECT question_id, answer_value, is_correct, test_attempt_id, answered_at
		      FROM question_answers WHERE user_id = $1) t),
		  'reviewSchedule', (SELECT COALESCE(json_agg(t), '[]') FROM (
		      SELECT question_id, repetitions, interval_days, ease, due_at, last_reviewed_at
		      FROM review_schedule WHERE user_id = $1) t),
		  'bookmarks', (SELECT COALESCE(json_agg(t ORDER BY t.created_at), '[]') FROM (
		      SELECT question_id, created_at FROM bookmarks WHERE user_id = $1) t),
		  'notes', (SELECT COALESCE(json_agg(t), '[]') FROM (
		      SELECT question_id, body, updated_at FROM question_notes WHERE user_id = $1) t),
		  'comments', (SELECT COALESCE(json_agg(t ORDER BY t.created_at), '[]') FROM (
		      SELECT id, question_id, body, created_at FROM question_comments WHERE user_id = $1) t),
		  'commentReports', (SELECT COALESCE(json_agg(t ORDER BY t.created_at), '[]') FROM (
		      SELECT comment_id, reason, note, created_at FROM comment_reports WHERE user_id = $1) t),
		  'bugReports', (SELECT COALESCE(json_agg(t ORDER BY t.created_at), '[]') FROM (
		      SELECT id, question_id, message, status, created_at FROM bug_reports WHERE user_id = $1) t),
		  'tests', (SELECT COALESCE(json_agg(t ORDER BY t.created_at), '[]') FROM (
		      SELECT ct.id, ct.name, ct.timed, ct.duration_minutes, ct.shuffle_questions,
		             ct.shuffle_options, ct.created_at,
		             (SELECT COALESCE(json_agg(q.question_id ORDER BY q.position), '[]')
		                FROM custom_test_questions q WHERE q.test_id = ct.id) AS question_ids
		      FROM custom_tests ct WHERE ct.owner_id = $1) t),
		  'testAttempts', (SELECT COALESCE(json_agg(t ORDER BY t.started_at), '[]') FROM (
		      SELECT id, test_id, mode, answers, score, started_at, submitted_at
		      FROM test_attempts WHERE user_id = $1) t)
		)`, userID, PrivacyPolicyVersion).Scan(&out)
	return out, notFound(err)
}

// DeleteAccount permanently deletes the user and everything that belongs to
// them (GDPR Art. 17), after checking their password. Questions and materials
// they authored stay, without the author. The last admin can't delete
// themselves, so the platform always keeps someone who can manage it.
func (s *Store) DeleteAccount(ctx context.Context, userID, password string) error {
	var hash, role string
	if err := s.pool.QueryRow(ctx, `SELECT password_hash, role::text FROM users WHERE id = $1`, userID).Scan(&hash, &role); err != nil {
		return notFound(err)
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) != nil {
		return ErrInvalid{"password is incorrect"}
	}
	return s.withTx(ctx, func(tx pgx.Tx) error {
		if role == "admin" {
			var admins int
			// Lock the admin rows so two admins can't both delete themselves at once.
			if err := tx.QueryRow(ctx, `SELECT count(*) FROM (SELECT 1 FROM users WHERE role = 'admin' FOR UPDATE) a`).Scan(&admins); err != nil {
				return err
			}
			if admins <= 1 {
				return ErrConflict{"you are the only admin; make someone else an admin first"}
			}
		}
		_, err := tx.Exec(ctx, `DELETE FROM users WHERE id = $1`, userID)
		return err
	})
}
