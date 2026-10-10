// Package config reads runtime settings from the environment.
package config

import "os"

type Config struct {
	DatabaseURL string
	Addr        string
	// BaseURL is the web app's public origin, used in emailed links.
	BaseURL string
	// GoPlaygroundURL is where Go snippets run ("off" disables it).
	GoPlaygroundURL string
}

// Load uses DATABASE_URL, PORT and APP_BASE_URL, defaulting to the docker-compose database
// on localhost and port 8080 (where apps/web's Vite proxy points).
func Load() Config {
	return Config{
		DatabaseURL: getenv("DATABASE_URL", "postgres://csgrundlagen:csgrundlagen@localhost:5432/csgrundlagen"),
		Addr:        ":" + getenv("PORT", "8080"),
		BaseURL:     getenv("APP_BASE_URL", "http://localhost:3000"),
		// Empty means the official Go Playground (httpapi.DefaultGoPlaygroundURL).
		GoPlaygroundURL: os.Getenv("GO_PLAYGROUND_URL"),
	}
}

func getenv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
