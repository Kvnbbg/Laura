package bridge

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

const (
	// DefaultBaseURL is the production HTTPS presentation target for
	// french-dev-ai-tools. The Go CLI never falls back to HTTP.
	DefaultBaseURL = "https://techandstream.com"

	// ArticleRegistryPath is the public JSON feed used by Techandstream
	// to list recent posts.
	ArticleRegistryPath = "/article-registry.json"

	// MatrixProgressPath is the write endpoint that accepts public-safe
	// MatrixCitizen bridge payloads.
	MatrixProgressPath = "/api/bridge/matrix-progress"

	// EnvAPIKey is the optional bearer token for the write endpoint.
	// The server accepts progress without a key in the current local bridge,
	// but production deployments may require it.
	EnvAPIKey = "TECHANDSTREAM_API_KEY"

	// EnvBaseURL lets operators point the CLI at a staging mirror.
	// It still must use HTTPS.
	EnvBaseURL = "TECHANDSTREAM_BASE_URL"
)

var (
	// ErrNonHTTPSURL is returned when the base URL is not HTTPS.
	ErrNonHTTPSURL = errors.New("techandstream: base URL must use HTTPS")

	// ErrPayloadNotSafe is returned when the payload fails public-safety
	// validation before transport.
	ErrPayloadNotSafe = errors.New("techandstream: payload failed public-safety validation")

	// ErrMissingAPIKey is returned when the write endpoint needs a key.
	ErrMissingAPIKey = errors.New("techandstream: API key required for write endpoint")

	// ErrUnexpectedResponse is returned when the server reply cannot be parsed.
	ErrUnexpectedResponse = errors.New("techandstream: unexpected response from server")
)

// Article mirrors the public article-registry.json entry shape.
type Article struct {
	Title    string   `json:"title"`
	URL      string   `json:"url"`
	Category string   `json:"category,omitempty"`
	Updated  string   `json:"updated,omitempty"`
	Thread   string   `json:"thread,omitempty"`
	Tags     []string `json:"tags,omitempty"`
}

// ClientOptions configures the secure Techandstream client.
type ClientOptions struct {
	BaseURL            string
	APIKey             string
	Timeout            time.Duration
	InsecureSkipVerify bool // reserved for tests against httptest; never true in production
}

// Client is a minimal, secure HTTP client for techandstream.com.
// It enforces HTTPS, validates redirects, and refuses to send blocked payloads.
type Client struct {
	BaseURL    string
	APIKey     string
	HTTPClient *http.Client
}

// NewClient creates a client from options or environment variables.
// The base URL is required to use HTTPS.
func NewClient(opts ClientOptions) (*Client, error) {
	base := strings.TrimSpace(opts.BaseURL)
	if base == "" {
		base = strings.TrimSpace(os.Getenv(EnvBaseURL))
	}
	if base == "" {
		base = DefaultBaseURL
	}
	base = strings.TrimRight(base, "/")

	u, err := url.Parse(base)
	if err != nil {
		return nil, fmt.Errorf("techandstream: invalid base URL %q: %w", base, err)
	}
	if u.Scheme != "https" {
		return nil, fmt.Errorf("%w: %q", ErrNonHTTPSURL, base)
	}

	timeout := opts.Timeout
	if timeout <= 0 {
		timeout = 15 * time.Second
	}

	transport := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: opts.InsecureSkipVerify},
	}

	return &Client{
		BaseURL: base,
		APIKey:  strings.TrimSpace(opts.APIKey),
		HTTPClient: &http.Client{
			Timeout:   timeout,
			Transport: transport,
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				if len(via) >= 3 {
					return errors.New("techandstream: too many redirects")
				}
				// Enforce HTTPS on every redirect target.
				if req.URL.Scheme != "https" {
					return fmt.Errorf("%w: redirect to %q", ErrNonHTTPSURL, req.URL.String())
				}
				return nil
			},
		},
	}, nil
}

// ResolveURL returns an absolute URL for a path.
func (c *Client) ResolveURL(path string) string {
	return c.BaseURL + path
}

// FetchArticles retrieves the public article registry from Techandstream.
func (c *Client) FetchArticles(ctx context.Context) ([]Article, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.ResolveURL(ArticleRegistryPath), nil)
	if err != nil {
		return nil, fmt.Errorf("techandstream: build request: %w", err)
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "laura-go-cli/1.0")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("techandstream: fetch articles failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("techandstream: articles returned HTTP %d", resp.StatusCode)
	}

	var articles []Article
	if err := json.NewDecoder(resp.Body).Decode(&articles); err != nil {
		return nil, fmt.Errorf("techandstream: decode articles failed: %w", err)
	}
	return articles, nil
}

// ValidatePayloadForTransport checks that the payload is public-safe and that
// the security envelope matches the trusted Techandstream/french-dev-ai-tools
// contract before any network call.
func ValidatePayloadForTransport(payload Payload) error {
	if payload.Security.PublicOrigin != PublicOrigin {
		return fmt.Errorf("%w: public origin mismatch %q", ErrPayloadNotSafe, payload.Security.PublicOrigin)
	}
	if payload.Security.TargetRepository != TargetRepository {
		return fmt.Errorf("%w: target repository mismatch %q", ErrPayloadNotSafe, payload.Security.TargetRepository)
	}
	if payload.Security.WriteMode != "manual-publish-only" {
		return fmt.Errorf("%w: write mode must be manual-publish-only, got %q", ErrPayloadNotSafe, payload.Security.WriteMode)
	}

	// Marshal the payload so we can scan the wire representation for common
	// secret-like tokens. This is a last-resort guard, not a substitute for
	// never putting secrets in the payload in the first place.
	scanPayload := payload
	scanPayload.Security.BlockedPayload = nil
	scanPayload.Context.BridgeSecurity.BlockedPayload = nil
	data, err := json.Marshal(scanPayload)
	if err != nil {
		return fmt.Errorf("techandstream: marshal payload for validation: %w", err)
	}
	text := string(data)
	for _, pattern := range []string{
		".env", "PRIVATE_KEY", "API_KEY", "SECRET", "TOKEN", "PASSWORD",
		"sk-", "ghp_", "github_pat_", "xoxb-", "xoxa-", "xoxr-",
	} {
		if strings.Contains(text, pattern) {
			return fmt.Errorf("%w: payload contains forbidden token %q", ErrPayloadNotSafe, pattern)
		}
	}
	return nil
}

// SendMatrixProgress posts the bridge payload to Techandstream.
// It validates the payload, requires an API key, and enforces HTTPS.
func (c *Client) SendMatrixProgress(ctx context.Context, payload Payload) error {
	if err := ValidatePayloadForTransport(payload); err != nil {
		return err
	}
	if c.APIKey == "" {
		return ErrMissingAPIKey
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("techandstream: marshal payload: %w", err)
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		c.ResolveURL(MatrixProgressPath),
		bytes.NewReader(body),
	)
	if err != nil {
		return fmt.Errorf("techandstream: build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "laura-go-cli/1.0")
	req.Header.Set("Authorization", "Bearer "+c.APIKey)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("techandstream: send matrix progress failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("techandstream: matrix progress returned HTTP %d: %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		Status  string `json:"status"`
		Message string `json:"message"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return fmt.Errorf("%w: %v", ErrUnexpectedResponse, err)
	}
	if result.Status != "" && result.Status != "accepted" {
		return fmt.Errorf("techandstream: unexpected status %q: %s", result.Status, result.Message)
	}
	return nil
}
