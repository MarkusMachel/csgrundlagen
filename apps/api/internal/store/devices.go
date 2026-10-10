package store

import (
	"context"
	"encoding/json"
	"time"

	"github.com/jackc/pgx/v5/pgconn"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/useragent"
)

// Client identifies the device a request came from.
type Client struct {
	IP        string
	UserAgent string
}

// Long headers are cut so a client can't fill the table with junk.
const maxUserAgent = 512

func (c Client) ip() *string {
	if c.IP == "" {
		return nil
	}
	return &c.IP
}

func (c Client) userAgent() *string {
	if c.UserAgent == "" {
		return nil
	}
	ua := c.UserAgent
	if len(ua) > maxUserAgent {
		ua = ua[:maxUserAgent]
	}
	return &ua
}

type execer interface {
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}

// recordEvent appends to the sign-in history. It is best effort: failing to
// log must never block a login, so errors are dropped.
func (s *Store) recordEvent(ctx context.Context, db execer, userID, kind string, client Client) {
	_, _ = db.Exec(ctx, `
		INSERT INTO login_events (user_id, kind, ip, user_agent) VALUES ($1, $2, $3, $4)`,
		userID, kind, client.ip(), client.userAgent())
}

// Session is one signed-in device, as shown on the Account page and to admins.
type Session struct {
	ID         string          `json:"id"`
	CreatedAt  time.Time       `json:"createdAt"`
	LastSeenAt time.Time       `json:"lastSeenAt"`
	ExpiresAt  time.Time       `json:"expiresAt"`
	IP         *string         `json:"ip,omitempty"`
	LastIP     *string         `json:"lastIp,omitempty"`
	UserAgent  *string         `json:"userAgent,omitempty"`
	ClientInfo json.RawMessage `json:"clientInfo,omitempty"`
	Current    bool            `json:"current"`
	useragent.Info
}

const sessionSelect = `
	SELECT id, created_at, last_seen_at, expires_at, ip, last_ip, user_agent, client_info,
	       token_hash = $2
	FROM sessions WHERE user_id = $1 AND expires_at > now()
	ORDER BY last_seen_at DESC`

func (s *Store) sessions(ctx context.Context, userID, currentTokenHash string) ([]Session, error) {
	rows, err := s.pool.Query(ctx, sessionSelect, userID, currentTokenHash)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Session{}
	for rows.Next() {
		var se Session
		if err := rows.Scan(&se.ID, &se.CreatedAt, &se.LastSeenAt, &se.ExpiresAt, &se.IP, &se.LastIP,
			&se.UserAgent, &se.ClientInfo, &se.Current); err != nil {
			return nil, err
		}
		if se.UserAgent != nil {
			se.Info = useragent.Parse(*se.UserAgent)
		} else {
			se.Info = useragent.Parse("")
		}
		out = append(out, se)
	}
	return out, rows.Err()
}

// ListSessions returns the user's active sessions, flagging the one that
// belongs to currentToken.
func (s *Store) ListSessions(ctx context.Context, userID, currentToken string) ([]Session, error) {
	return s.sessions(ctx, userID, hashToken(currentToken))
}

// RevokeSession signs one of the user's devices out. ErrNotFound if the
// session doesn't exist or belongs to someone else.
func (s *Store) RevokeSession(ctx context.Context, userID, sessionID string) error {
	tag, err := s.pool.Exec(ctx, `DELETE FROM sessions WHERE id = $1 AND user_id = $2`, sessionID, userID)
	if err == nil && tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return err
}

// RevokeAllSessions signs the user out everywhere.
func (s *Store) RevokeAllSessions(ctx context.Context, userID string) (int64, error) {
	tag, err := s.pool.Exec(ctx, `DELETE FROM sessions WHERE user_id = $1`, userID)
	return tag.RowsAffected(), err
}

// ClientInfo is what the browser reports about itself (POST /api/me/device).
// Every field is optional; strings are trimmed to a sane length.
type ClientInfo struct {
	Timezone    string   `json:"timezone,omitempty"`
	Language    string   `json:"language,omitempty"`
	Languages   []string `json:"languages,omitempty"`
	Platform    string   `json:"platform,omitempty"`
	Screen      string   `json:"screen,omitempty"`   // "1920x1080"
	Viewport    string   `json:"viewport,omitempty"` // "1440x900"
	PixelRatio  float64  `json:"pixelRatio,omitempty"`
	Touch       bool     `json:"touch,omitempty"`
	ColorScheme string   `json:"colorScheme,omitempty"` // light or dark
}

func clip(s string, n int) string {
	if len(s) > n {
		return s[:n]
	}
	return s
}

func (ci ClientInfo) sanitized() ClientInfo {
	ci.Timezone = clip(ci.Timezone, 64)
	ci.Language = clip(ci.Language, 35)
	ci.Platform = clip(ci.Platform, 64)
	ci.Screen = clip(ci.Screen, 20)
	ci.Viewport = clip(ci.Viewport, 20)
	ci.ColorScheme = clip(ci.ColorScheme, 10)
	if len(ci.Languages) > 8 {
		ci.Languages = ci.Languages[:8]
	}
	for i, l := range ci.Languages {
		ci.Languages[i] = clip(l, 35)
	}
	if ci.PixelRatio < 0 || ci.PixelRatio > 10 {
		ci.PixelRatio = 0
	}
	return ci
}

// SaveClientInfo stores the browser's self-report on the session behind token,
// but only if the user's latest consent allows device details.
func (s *Store) SaveClientInfo(ctx context.Context, token string, info ClientInfo) error {
	tag, err := s.pool.Exec(ctx, `
		UPDATE sessions se SET client_info = $2
		WHERE se.token_hash = $1 AND (
			SELECT device_details FROM consent_records c
			WHERE c.user_id = se.user_id ORDER BY c.created_at DESC, c.id DESC LIMIT 1)`,
		hashToken(token), info.sanitized())
	if err == nil && tag.RowsAffected() == 0 {
		return ErrConflict{"device details need consent"}
	}
	return err
}

// LoginEvent is one entry in a user's sign-in history.
type LoginEvent struct {
	ID        int64     `json:"id"`
	Kind      string    `json:"kind"`
	IP        *string   `json:"ip,omitempty"`
	UserAgent *string   `json:"userAgent,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
	useragent.Info
}

func (s *Store) loginEvents(ctx context.Context, userID string, limit int) ([]LoginEvent, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, kind, ip, user_agent, created_at FROM login_events
		WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT $2`, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []LoginEvent{}
	for rows.Next() {
		var e LoginEvent
		if err := rows.Scan(&e.ID, &e.Kind, &e.IP, &e.UserAgent, &e.CreatedAt); err != nil {
			return nil, err
		}
		ua := ""
		if e.UserAgent != nil {
			ua = *e.UserAgent
		}
		e.Info = useragent.Parse(ua)
		out = append(out, e)
	}
	return out, rows.Err()
}

// AdminUser is one row of the admin Users list.
type AdminUser struct {
	User
	CreatedAt      time.Time  `json:"createdAt"`
	LastSeenAt     *time.Time `json:"lastSeenAt,omitempty"`
	ActiveSessions int        `json:"activeSessions"`
	// Device types of the active sessions, e.g. ["desktop", "mobile"].
	Devices         []string `json:"devices"`
	Answers         int      `json:"answers"`
	FailedLogins24h int      `json:"failedLogins24h"`
}

// AdminUsers lists every account with its activity summary, most recently
// active first.
func (s *Store) AdminUsers(ctx context.Context) ([]AdminUser, error) {
	return s.adminUsers(ctx, "")
}

// adminUsers lists every account, or only the one with this id.
func (s *Store) adminUsers(ctx context.Context, onlyID string) ([]AdminUser, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT u.id, u.name, u.email, u.avatar_url, u.locale::text, u.role::text, u.privacy_version, u.created_at,
		       (SELECT max(last_seen_at) FROM sessions se WHERE se.user_id = u.id),
		       (SELECT count(*) FROM sessions se WHERE se.user_id = u.id AND se.expires_at > now()),
		       COALESCE((SELECT array_agg(se.user_agent) FROM sessions se
		                 WHERE se.user_id = u.id AND se.expires_at > now()), '{}'),
		       (SELECT count(*) FROM question_answers qa WHERE qa.user_id = u.id),
		       (SELECT count(*) FROM login_events le WHERE le.user_id = u.id
		          AND le.kind = 'login_failed' AND le.created_at > now() - interval '24 hours')
		FROM users u
		WHERE $1 = '' OR u.id::text = $1
		ORDER BY 9 DESC NULLS LAST, u.created_at DESC`, onlyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []AdminUser{}
	for rows.Next() {
		var a AdminUser
		var agents []*string
		if err := rows.Scan(&a.ID, &a.Name, &a.Email, &a.AvatarURL, &a.Locale, &a.Role, &a.PrivacyVersion, &a.CreatedAt,
			&a.LastSeenAt, &a.ActiveSessions, &agents, &a.Answers, &a.FailedLogins24h); err != nil {
			return nil, err
		}
		a.Devices = deviceTypes(agents)
		out = append(out, a)
	}
	return out, rows.Err()
}

// deviceTypes returns the distinct device types behind the user agents, in a
// fixed order.
func deviceTypes(agents []*string) []string {
	seen := map[string]bool{}
	for _, ua := range agents {
		s := ""
		if ua != nil {
			s = *ua
		}
		seen[useragent.Parse(s).Device] = true
	}
	out := []string{}
	for _, d := range []string{"desktop", "mobile", "tablet", "bot"} {
		if seen[d] {
			out = append(out, d)
		}
	}
	return out
}

// AdminUserDetail is everything an admin sees about one account.
type AdminUserDetail struct {
	User     AdminUser    `json:"user"`
	Sessions []Session    `json:"sessions"`
	Events   []LoginEvent `json:"events"`
	// Consent is the latest consent choice; nil if the user never made one.
	Consent           *Consent   `json:"consent"`
	PrivacyAcceptedAt *time.Time `json:"privacyAcceptedAt,omitempty"`
}

func (s *Store) AdminUserDetail(ctx context.Context, userID string) (AdminUserDetail, error) {
	var d AdminUserDetail
	users, err := s.adminUsers(ctx, userID)
	if err != nil {
		return d, err
	}
	if len(users) == 0 {
		return d, ErrNotFound
	}
	d.User = users[0]
	if d.Sessions, err = s.sessions(ctx, userID, ""); err != nil {
		return d, err
	}
	if d.Events, err = s.loginEvents(ctx, userID, 50); err != nil {
		return d, err
	}
	if d.Consent, err = s.LatestConsent(ctx, userID); err != nil {
		return d, err
	}
	err = s.pool.QueryRow(ctx, `SELECT privacy_accepted_at FROM users WHERE id = $1`, userID).Scan(&d.PrivacyAcceptedAt)
	return d, err
}

// LoginEventRetention is how long the sign-in history is kept.
const LoginEventRetention = 90 * 24 * time.Hour

// PurgeExpired deletes expired sessions, used or expired reset tokens and
// sign-in history older than LoginEventRetention.
func (s *Store) PurgeExpired(ctx context.Context) error {
	if _, err := s.pool.Exec(ctx, `DELETE FROM sessions WHERE expires_at < now()`); err != nil {
		return err
	}
	if _, err := s.pool.Exec(ctx,
		`DELETE FROM password_reset_tokens WHERE expires_at < now() OR used_at IS NOT NULL`); err != nil {
		return err
	}
	_, err := s.pool.Exec(ctx, `DELETE FROM login_events WHERE created_at < $1`,
		time.Now().Add(-LoginEventRetention))
	return err
}
