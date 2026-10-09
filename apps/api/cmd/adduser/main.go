// Command adduser creates a user with a bcrypt-hashed password.
//
//	go run ./cmd/adduser -email you@example.com -name "You" -password '…' -role admin
//
// The password can also come from the ADDUSER_PASSWORD environment variable
// so it doesn't end up in shell history.
package main

import (
	"context"
	"flag"
	"fmt"
	"log/slog"
	"os"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/config"
	"github.com/markusmachel/csgrundlagen/apps/api/internal/db"
	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

func main() {
	email := flag.String("email", "", "login email (required)")
	name := flag.String("name", "", "display name (required)")
	password := flag.String("password", os.Getenv("ADDUSER_PASSWORD"), "password, min 8 chars (or set ADDUSER_PASSWORD)")
	role := flag.String("role", "user", "admin or user")
	locale := flag.String("locale", "en", "en, pt-BR or de")
	flag.Parse()

	ctx := context.Background()
	pool, err := db.Connect(ctx, config.Load().DatabaseURL)
	if err != nil {
		fail(err)
	}
	defer pool.Close()
	// Make sure the schema exists even if the API has never been started.
	if err := db.Migrate(ctx, pool, slog.New(slog.NewTextHandler(os.Stderr, nil))); err != nil {
		fail(err)
	}

	u, err := store.New(pool).CreateUser(ctx, *name, *email, *password, *role, *locale)
	if err != nil {
		fail(err)
	}
	fmt.Printf("created %s user %s <%s> (id %s)\n", u.Role, u.Name, u.Email, u.ID)
}

func fail(err error) {
	fmt.Fprintln(os.Stderr, "adduser:", err)
	os.Exit(1)
}
