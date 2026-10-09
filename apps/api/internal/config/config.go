// Package config reads runtime settings from the environment.
package config

import "os"

type Config struct {
	DatabaseURL string
	Addr        string
}

// Load uses DATABASE_URL and PORT, defaulting to the docker-compose database
// on localhost and port 8080 (where apps/web's Vite proxy points).
func Load() Config {
	return Config{
		DatabaseURL: getenv("DATABASE_URL", "postgres://csgrundlagen:csgrundlagen@localhost:5432/csgrundlagen"),
		Addr:        ":" + getenv("PORT", "8080"),
	}
}

func getenv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
