package store

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
)

// ErrBlocked is returned when a blocked account tries to sign in.
var ErrBlocked = errors.New("this account is blocked")

// UserChange is what an admin may change about another account; nil leaves
// a field as it is.
type UserChange struct {
	Role    *string `json:"role"`
	Blocked *bool   `json:"blocked"`
}

// lockAdmins locks every admin row and returns how many there are, so two
// admins can't demote, block or delete each other at the same moment and
// leave nobody in charge.
func lockAdmins(ctx context.Context, tx pgx.Tx) (int, error) {
	var n int
	err := tx.QueryRow(ctx, `SELECT count(*) FROM (SELECT 1 FROM users WHERE role = 'admin' FOR UPDATE) a`).Scan(&n)
	return n, err
}

// ChangeUser applies an admin's change to another account. Admins can't
// change themselves this way, and the last admin can't be demoted or blocked.
// Blocking signs the user out everywhere.
func (s *Store) ChangeUser(ctx context.Context, actorID, userID string, c UserChange) error {
	if actorID == userID {
		return ErrInvalid{"you can't change your own role or block yourself"}
	}
	if c.Role != nil && *c.Role != "admin" && *c.Role != "user" {
		return ErrInvalid{"role must be admin or user"}
	}
	return s.withTx(ctx, func(tx pgx.Tx) error {
		admins, err := lockAdmins(ctx, tx)
		if err != nil {
			return err
		}
		var role string
		var blocked bool
		if err := tx.QueryRow(ctx, `SELECT role::text, blocked_at IS NOT NULL FROM users WHERE id = $1 FOR UPDATE`, userID).Scan(&role, &blocked); err != nil {
			return notFound(err)
		}
		losesAdmin := role == "admin" && ((c.Role != nil && *c.Role != "admin") || (c.Blocked != nil && *c.Blocked && !blocked))
		if losesAdmin && admins <= 1 {
			return ErrConflict{"this is the only admin; make someone else an admin first"}
		}
		if c.Role != nil {
			if _, err := tx.Exec(ctx, `UPDATE users SET role = $2::user_role WHERE id = $1`, userID, *c.Role); err != nil {
				return err
			}
		}
		if c.Blocked != nil {
			if *c.Blocked {
				if _, err := tx.Exec(ctx, `UPDATE users SET blocked_at = COALESCE(blocked_at, now()) WHERE id = $1`, userID); err != nil {
					return err
				}
				if _, err := tx.Exec(ctx, `DELETE FROM sessions WHERE user_id = $1`, userID); err != nil {
					return err
				}
			} else if _, err := tx.Exec(ctx, `UPDATE users SET blocked_at = NULL WHERE id = $1`, userID); err != nil {
				return err
			}
		}
		return nil
	})
}

// AdminDeleteUser deletes another account and everything that belongs to it.
// Admins delete their own account from the Account page instead.
func (s *Store) AdminDeleteUser(ctx context.Context, actorID, userID string) error {
	if actorID == userID {
		return ErrInvalid{"delete your own account from the Account page"}
	}
	return s.withTx(ctx, func(tx pgx.Tx) error {
		admins, err := lockAdmins(ctx, tx)
		if err != nil {
			return err
		}
		var role string
		if err := tx.QueryRow(ctx, `SELECT role::text FROM users WHERE id = $1`, userID).Scan(&role); err != nil {
			return notFound(err)
		}
		if role == "admin" && admins <= 1 {
			return ErrConflict{"this is the only admin; make someone else an admin first"}
		}
		_, err = tx.Exec(ctx, `DELETE FROM users WHERE id = $1`, userID)
		return err
	})
}
