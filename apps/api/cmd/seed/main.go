// Command seed loads a question bank (questions + reading material) from a
// JSON file into the database. It is idempotent: materials are matched by
// URL and questions by prompt, so re-running it only adds what is missing.
//
//	go run ./cmd/seed                                  # seeds/dotnet-interview.json
//	go run ./cmd/seed -file seeds/other-bank.json
package main

import (
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"sort"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/config"
	"github.com/markusmachel/csgrundlagen/apps/api/internal/db"
	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

type bank struct {
	Name      string `json:"name"`
	Materials []struct {
		Key         string `json:"key"`
		Type        string `json:"type"`
		Title       string `json:"title"`
		URL         string `json:"url"`
		Author      string `json:"author"`
		Description string `json:"description"`
	} `json:"materials"`
	Questions []struct {
		Prompt      string   `json:"prompt"`
		Tags        []string `json:"tags"`
		Difficulty  string   `json:"difficulty"`
		Options     []string `json:"options"`
		Correct     int      `json:"correct"` // index into Options
		Explanation string   `json:"explanation"`
		Materials   []string `json:"materials"` // material keys
	} `json:"questions"`
}

func main() {
	file := flag.String("file", "seeds/dotnet-interview.json", "question bank JSON")
	flag.Parse()
	if err := run(*file); err != nil {
		fmt.Fprintln(os.Stderr, "seed:", err)
		os.Exit(1)
	}
}

func run(file string) error {
	raw, err := os.ReadFile(file)
	if err != nil {
		return err
	}
	var b bank
	if err := json.Unmarshal(raw, &b); err != nil {
		return fmt.Errorf("parse %s: %w", file, err)
	}

	ctx := context.Background()
	pool, err := db.Connect(ctx, config.Load().DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()
	if err := db.Migrate(ctx, pool, slog.New(slog.NewTextHandler(os.Stderr, nil))); err != nil {
		return err
	}
	st := store.New(pool)

	// A material's tags are the union of the tags of the questions citing it.
	tagsFor := map[string]map[string]bool{}
	for _, q := range b.Questions {
		for _, k := range q.Materials {
			if tagsFor[k] == nil {
				tagsFor[k] = map[string]bool{}
			}
			for _, t := range q.Tags {
				tagsFor[k][t] = true
			}
		}
	}

	materialID := map[string]string{}
	var newMaterials, newQuestions, skipped int
	for _, m := range b.Materials {
		id, err := st.FindMaterialIDByURL(ctx, m.URL)
		switch {
		case err == nil:
		case errors.Is(err, store.ErrNotFound):
			tags := make([]string, 0, len(tagsFor[m.Key]))
			for t := range tagsFor[m.Key] {
				tags = append(tags, t)
			}
			sort.Strings(tags)
			author, desc := m.Author, m.Description
			created, err := st.CreateMaterial(ctx, "", store.NewMaterial{
				Type: m.Type, Title: m.Title, URL: m.URL, Author: &author, Description: &desc, Tags: tags,
			})
			if err != nil {
				return fmt.Errorf("material %q: %w", m.Key, err)
			}
			id = created.ID
			newMaterials++
		default:
			return err
		}
		materialID[m.Key] = id
	}

	letters := []string{"A", "B", "C", "D", "E"}
	for i, q := range b.Questions {
		if _, err := st.FindQuestionIDByPrompt(ctx, q.Prompt); err == nil {
			skipped++
			continue
		} else if !errors.Is(err, store.ErrNotFound) {
			return err
		}
		if q.Correct < 0 || q.Correct >= len(q.Options) || len(q.Options) > len(letters) {
			return fmt.Errorf("question %d: correct index %d out of range", i+1, q.Correct)
		}
		opts := make([]store.Option, len(q.Options))
		for j, label := range q.Options {
			opts[j] = store.Option{ID: letters[j], Label: label}
		}
		var related []string
		for _, k := range q.Materials {
			id, ok := materialID[k]
			if !ok {
				return fmt.Errorf("question %d: unknown material key %q", i+1, k)
			}
			related = append(related, id)
		}
		correct, diff := letters[q.Correct], q.Difficulty
		if _, err := st.CreateQuestion(ctx, "", store.NewQuestion{
			Type: "multiple-choice", Prompt: q.Prompt, Tags: q.Tags, Difficulty: &diff,
			Explanation: q.Explanation, Options: opts, CorrectOptionID: &correct,
			RelatedMaterialIDs: related,
		}); err != nil {
			return fmt.Errorf("question %d: %w", i+1, err)
		}
		newQuestions++
	}

	fmt.Printf("%s: added %d questions (%d already present), %d new materials (%d total in bank)\n",
		b.Name, newQuestions, skipped, newMaterials, len(b.Materials))
	return nil
}
