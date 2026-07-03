package bridge

import (
	"encoding/json"
	"net/url"
	"strings"
	"testing"
	"time"
)

func TestBuildGotoAddPayloadUsesTrustedTechandstreamRoute(t *testing.T) {
	payload := Build(Options{
		Command:  "goto add",
		Source:   "terminal",
		Target:   "web",
		UserID:   "Coder",
		BotName:  "Laura MoltBot",
		RepoPath: "/tmp/laura repo",
		Now:      time.Date(2026, 7, 2, 12, 30, 0, 0, time.UTC),
	})

	route, err := url.Parse(payload.TechandstreamRoute)
	if err != nil {
		t.Fatalf("parse Techandstream route: %v", err)
	}
	if route.Scheme != "https" || route.Host != "techandstream.com" {
		t.Fatalf("unexpected route origin: %s", payload.TechandstreamRoute)
	}
	if route.Path != "/matrix-citizen/add" {
		t.Fatalf("unexpected route path: %s", route.Path)
	}
	if got := route.Query().Get("from"); got != "terminal/web" {
		t.Fatalf("unexpected from query: %q", got)
	}
	if route.Query().Has("action") {
		t.Fatalf("goto add route should not carry action query: %s", route.RawQuery)
	}
	if payload.Operation != "goto_add" {
		t.Fatalf("unexpected operation: %s", payload.Operation)
	}
}

func TestBuildPayloadCarriesSecurityAndOpenClawHandoff(t *testing.T) {
	payload := Build(Options{
		Command:  "add",
		Source:   "web",
		Target:   "terminal",
		UserID:   "matrix-user",
		BotName:  "Laura MoltBot",
		RepoPath: "/tmp/laura",
		Now:      time.Date(2026, 7, 2, 12, 30, 0, 0, time.UTC),
	})

	if payload.Security.TargetRepository != TargetRepository {
		t.Fatalf("target repository mismatch: %s", payload.Security.TargetRepository)
	}
	if payload.Security.WriteMode != "manual-publish-only" {
		t.Fatalf("unexpected write mode: %s", payload.Security.WriteMode)
	}
	if !contains(payload.Security.BlockedPayload, "API keys or tokens") {
		t.Fatalf("blocked payload should include API key guard: %#v", payload.Security.BlockedPayload)
	}
	if payload.Context.MatrixProgress.Contract != ProgressContract {
		t.Fatalf("matrix progress contract mismatch: %s", payload.Context.MatrixProgress.Contract)
	}
	if payload.Context.BridgeSecurity.PublicOrigin != PublicOrigin {
		t.Fatalf("context security origin mismatch: %s", payload.Context.BridgeSecurity.PublicOrigin)
	}
	if payload.OpenClaw.Agent != "main" {
		t.Fatalf("OpenClaw agent should be main: %s", payload.OpenClaw.Agent)
	}
	if !strings.Contains(payload.OpenClaw.CrestodianRole, "setup/status/doctor") {
		t.Fatalf("Crestodian role should stay setup-scoped: %s", payload.OpenClaw.CrestodianRole)
	}
	if !strings.Contains(payload.OpenClaw.StatusCommand, "git -C /tmp/laura status --short --branch") {
		t.Fatalf("unexpected status command: %s", payload.OpenClaw.StatusCommand)
	}

	data, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("payload should marshal: %v", err)
	}
	if !strings.Contains(string(data), `"matrixProgress"`) {
		t.Fatalf("payload should include API-ready matrixProgress context: %s", data)
	}
}

func TestBuildNormalizesUnknownInputs(t *testing.T) {
	payload := Build(Options{
		Command: "publish now",
		Source:  "mobile",
		Target:  "terminal",
		Now:     time.Date(2026, 7, 2, 12, 30, 0, 0, time.UTC),
	})

	if payload.Command != "auto" {
		t.Fatalf("unknown commands should normalize to auto, got %s", payload.Command)
	}
	if payload.ChannelPair != "web/terminal" {
		t.Fatalf("unexpected normalized channel pair: %s", payload.ChannelPair)
	}
	if payload.Citizen.Username != "laura_moltbot" {
		t.Fatalf("unexpected fallback username: %s", payload.Citizen.Username)
	}
}

func contains(values []string, target string) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}
	return false
}
