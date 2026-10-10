package httpapi

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// DefaultGoPlaygroundURL is the official playground's compile endpoint.
const DefaultGoPlaygroundURL = "https://go.dev/_/compile"

const (
	maxRunCode     = 64 << 10 // bytes of source
	maxRunOutput   = 64 << 10 // bytes of output passed back
	runCallTimeout = 20 * time.Second
)

// RunResult is what POST /api/run returns.
type RunResult struct {
	// Output is stdout and stderr interleaved as the program wrote them.
	Output string `json:"output"`
	// Errors holds compile (or vet) errors; the program didn't run if set.
	Errors string `json:"errors,omitempty"`
	// ExitCode is the program's exit status (0 = success).
	ExitCode int `json:"exitCode"`
}

// run executes a snippet so output questions can be checked by running
// them. Only Go is run server-side (JavaScript runs in the browser), and it
// runs in the Go Playground sandbox, never on this server.
func (s *Server) run(w http.ResponseWriter, r *http.Request) {
	if s.opts.GoPlaygroundURL == "off" {
		writeError(w, http.StatusServiceUnavailable, "Running code is disabled on this server")
		return
	}
	var body struct {
		Language string `json:"language"`
		Code     string `json:"code"`
	}
	if !decode(w, r, &body) {
		return
	}
	if body.Language != "go" {
		writeError(w, http.StatusBadRequest, "only go runs on the server; javascript runs in the browser")
		return
	}
	if strings.TrimSpace(body.Code) == "" || len(body.Code) > maxRunCode {
		writeError(w, http.StatusBadRequest, "code is required (at most 64 KB)")
		return
	}
	res, err := s.runGo(r.Context(), body.Code)
	if err != nil {
		s.log.Error("go playground", "err", err)
		writeError(w, http.StatusBadGateway, "The Go playground could not run the code, try again later")
		return
	}
	writeJSON(w, http.StatusOK, res)
}

// playgroundResponse is the Go Playground's /compile reply (version 2).
type playgroundResponse struct {
	Errors    string
	VetErrors string
	Status    int
	Events    []struct {
		Message string
		Kind    string // stdout | stderr
	}
}

func (s *Server) runGo(ctx context.Context, code string) (RunResult, error) {
	ctx, cancel := context.WithTimeout(ctx, runCallTimeout)
	defer cancel()
	form := url.Values{"version": {"2"}, "body": {code}, "withVet": {"true"}}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.opts.GoPlaygroundURL,
		strings.NewReader(form.Encode()))
	if err != nil {
		return RunResult{}, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return RunResult{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return RunResult{}, fmt.Errorf("playground answered %s", resp.Status)
	}
	var pr playgroundResponse
	if err := json.NewDecoder(io.LimitReader(resp.Body, 4*maxRunOutput)).Decode(&pr); err != nil {
		return RunResult{}, fmt.Errorf("decode playground reply: %w", err)
	}
	var out strings.Builder
	for _, e := range pr.Events {
		if out.Len()+len(e.Message) > maxRunOutput {
			out.WriteString("\n… output truncated")
			break
		}
		out.WriteString(e.Message)
	}
	errs := strings.TrimSpace(pr.Errors)
	if errs == "" {
		errs = strings.TrimSpace(pr.VetErrors)
	}
	return RunResult{Output: out.String(), Errors: errs, ExitCode: pr.Status}, nil
}
