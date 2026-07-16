package bridge

import (
	"strings"
	"testing"
	"time"
)

func TestBuildMindwalkPayloadKeepsViewingLocal(t *testing.T) {
	payload := BuildMindwalk(MindwalkOptions{
		Command:  "serve",
		RepoPath: "/tmp/laura repo",
		Port:     8989,
		NoOpen:   true,
		Now:      time.Date(2026, 7, 15, 8, 0, 0, 0, time.UTC),
	})

	if payload.Contract != MindwalkContract {
		t.Fatalf("unexpected contract: %s", payload.Contract)
	}
	if payload.Command != "serve" {
		t.Fatalf("unexpected command: %s", payload.Command)
	}
	if payload.LocalURL != "http://127.0.0.1:8989" {
		t.Fatalf("unexpected local URL: %s", payload.LocalURL)
	}
	if !strings.Contains(payload.CLICommands[0], "mindwalk serve --port 8989 --no-open") {
		t.Fatalf("serve command should be explicit and local: %#v", payload.CLICommands)
	}
	if !strings.Contains(payload.Security.NetworkPolicy, "viewing sends nothing externally") {
		t.Fatalf("network policy should document local-only viewing: %s", payload.Security.NetworkPolicy)
	}
	if !strings.Contains(payload.OpenClaw.StatusCommand, "git -C '/tmp/laura repo' status --short --branch") {
		t.Fatalf("repo path should be shell-quoted in handoff: %s", payload.OpenClaw.StatusCommand)
	}
}

func TestBuildMindwalkAnalyzeRequiresExplicitSessionCommand(t *testing.T) {
	payload := BuildMindwalk(MindwalkOptions{
		Command:     "analyze",
		SessionPath: "/tmp/session file.jsonl",
		Judge:       "claude",
		Now:         time.Date(2026, 7, 15, 8, 0, 0, 0, time.UTC),
	})

	if payload.Command != "analyze" {
		t.Fatalf("unexpected command: %s", payload.Command)
	}
	if got := payload.CLICommands[0]; !strings.Contains(got, "mindwalk analyze '/tmp/session file.jsonl' --judge claude") {
		t.Fatalf("unexpected analyze command: %s", got)
	}
	if !strings.Contains(payload.Security.AnalyzeMode, "explicit-only") {
		t.Fatalf("analyze mode should require an explicit action: %s", payload.Security.AnalyzeMode)
	}
}

func TestNormalizeMindwalkCommand(t *testing.T) {
	if got := NormalizeMindwalkCommand("TRACE"); got != "trace" {
		t.Fatalf("expected trace, got %s", got)
	}
	if got := NormalizeMindwalkCommand("do anything"); got != "serve" {
		t.Fatalf("unknown commands should default to serve, got %s", got)
	}
}
