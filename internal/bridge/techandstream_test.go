package bridge

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestNewClientDefaultsToHTTPSProductionURL(t *testing.T) {
	client, err := NewClient(ClientOptions{})
	if err != nil {
		t.Fatalf("NewClient failed: %v", err)
	}
	if client.BaseURL != DefaultBaseURL {
		t.Fatalf("expected base URL %q, got %q", DefaultBaseURL, client.BaseURL)
	}
	if client.HTTPClient.Timeout != 15*time.Second {
		t.Fatalf("expected default timeout 15s, got %v", client.HTTPClient.Timeout)
	}
}

func TestNewClientRejectsHTTPBaseURL(t *testing.T) {
	_, err := NewClient(ClientOptions{BaseURL: "http://techandstream.com"})
	if !errors.Is(err, ErrNonHTTPSURL) {
		t.Fatalf("expected ErrNonHTTPSURL, got %v", err)
	}
}

func TestNewClientRejectsHTTPRedirectTarget(t *testing.T) {
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "http://evil.example/", http.StatusFound)
	}))
	defer server.Close()

	client, err := NewClient(ClientOptions{InsecureSkipVerify: true})
	if err != nil {
		t.Fatalf("NewClient failed: %v", err)
	}
	client.BaseURL = server.URL

	req, _ := http.NewRequest(http.MethodGet, server.URL+"/", nil)
	_, err = client.HTTPClient.Do(req)
	if err == nil {
		t.Fatal("expected redirect to HTTP to fail")
	}
	if !strings.Contains(err.Error(), "must use HTTPS") {
		t.Fatalf("expected HTTPS enforcement error, got %v", err)
	}
}

func TestFetchArticlesParsesRegistry(t *testing.T) {
	articles := []Article{
		{Title: "Hello", URL: "https://techandstream.com/hello", Category: "blog", Updated: "2026-07-16"},
		{Title: "World", URL: "https://techandstream.com/world", Category: "code", Updated: "2026-07-15"},
	}
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != ArticleRegistryPath {
			http.NotFound(w, r)
			return
		}
		_ = json.NewEncoder(w).Encode(articles)
	}))
	defer server.Close()

	client, err := NewClient(ClientOptions{BaseURL: server.URL, InsecureSkipVerify: true})
	if err != nil {
		t.Fatalf("NewClient failed: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	got, err := client.FetchArticles(ctx)
	if err != nil {
		t.Fatalf("FetchArticles failed: %v", err)
	}
	if len(got) != 2 {
		t.Fatalf("expected 2 articles, got %d", len(got))
	}
	if got[0].Title != "Hello" {
		t.Fatalf("unexpected first article title: %q", got[0].Title)
	}
}

func TestValidatePayloadForTransportAcceptsTrustedPayload(t *testing.T) {
	payload := Build(Options{
		Command:  "add",
		Source:   "terminal",
		Target:   "web",
		UserID:   "coder",
		BotName:  "Laura MoltBot",
		RepoPath: "/tmp/laura",
	})
	if err := ValidatePayloadForTransport(payload); err != nil {
		t.Fatalf("valid payload rejected: %v", err)
	}
}

func TestValidatePayloadForTransportRejectsBadOrigin(t *testing.T) {
	payload := Build(Options{})
	payload.Security.PublicOrigin = "https://evil.example"
	if err := ValidatePayloadForTransport(payload); !errors.Is(err, ErrPayloadNotSafe) {
		t.Fatalf("expected ErrPayloadNotSafe for bad origin, got %v", err)
	}
}

func TestValidatePayloadForTransportRejectsSecretToken(t *testing.T) {
	payload := Build(Options{})
	payload.Context.Tags = append(payload.Context.Tags, "sk-1234567890abcdef")
	if err := ValidatePayloadForTransport(payload); !errors.Is(err, ErrPayloadNotSafe) {
		t.Fatalf("expected ErrPayloadNotSafe for secret token, got %v", err)
	}
}

func TestSendMatrixProgressRequiresAPIKey(t *testing.T) {
	client, err := NewClient(ClientOptions{BaseURL: DefaultBaseURL})
	if err != nil {
		t.Fatalf("NewClient failed: %v", err)
	}
	payload := Build(Options{})
	err = client.SendMatrixProgress(context.Background(), payload)
	if !errors.Is(err, ErrMissingAPIKey) {
		t.Fatalf("expected ErrMissingAPIKey, got %v", err)
	}
}

func TestSendMatrixProgressPostsPayload(t *testing.T) {
	var received []byte
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != MatrixProgressPath {
			http.NotFound(w, r)
			return
		}
		if r.Method != http.MethodPost {
			t.Errorf("expected POST, got %s", r.Method)
		}
		if auth := r.Header.Get("Authorization"); auth != "Bearer test-key" {
			t.Errorf("expected Bearer test-key, got %q", auth)
		}
		received, _ = ioReadAll(r.Body)
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "accepted"})
	}))
	defer server.Close()

	client, err := NewClient(ClientOptions{BaseURL: server.URL, APIKey: "test-key", InsecureSkipVerify: true})
	if err != nil {
		t.Fatalf("NewClient failed: %v", err)
	}

	payload := Build(Options{Command: "add", Source: "terminal", Target: "web"})
	err = client.SendMatrixProgress(context.Background(), payload)
	if err != nil {
		t.Fatalf("SendMatrixProgress failed: %v", err)
	}
	if len(received) == 0 {
		t.Fatal("server received no payload")
	}
	if !strings.Contains(string(received), `"schemaVersion"`) {
		t.Fatalf("payload missing schemaVersion: %s", received)
	}
}

func TestSendMatrixProgressRejectsNonAcceptedStatus(t *testing.T) {
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "rejected"})
	}))
	defer server.Close()

	client, err := NewClient(ClientOptions{BaseURL: server.URL, APIKey: "test-key", InsecureSkipVerify: true})
	if err != nil {
		t.Fatalf("NewClient failed: %v", err)
	}

	payload := Build(Options{Command: "add", Source: "terminal", Target: "web"})
	err = client.SendMatrixProgress(context.Background(), payload)
	if err == nil || !strings.Contains(err.Error(), "unexpected status") {
		t.Fatalf("expected unexpected status error, got %v", err)
	}
}

func TestSendMatrixProgressRejectsHTTPBaseURL(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
	defer server.Close()

	_, err := NewClient(ClientOptions{BaseURL: server.URL, APIKey: "test-key"})
	if !errors.Is(err, ErrNonHTTPSURL) {
		t.Fatalf("expected ErrNonHTTPSURL for plain HTTP test server, got %v", err)
	}
}

// ioReadAll is a tiny helper so this test file stays dependency-free.
func ioReadAll(r ioReader) ([]byte, error) {
	return io.ReadAll(r)
}

type ioReader interface {
	Read(p []byte) (n int, err error)
}
