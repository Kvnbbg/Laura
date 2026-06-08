package ui

import (
	"bufio"
	"bytes"
	"strings"
	"testing"
)

func TestThinkingEffectNoAnimationDoesNotWritePulse(t *testing.T) {
	var buf bytes.Buffer
	ThinkingEffect(&buf, true)
	if got := buf.String(); got != "" {
		t.Fatalf("expected no animation output, got %q", got)
	}
}

func TestPromptMultilineReadsUntilTerminator(t *testing.T) {
	scanner := bufio.NewScanner(strings.NewReader("SELECT name\nFROM employees\n---\nignored after terminator\n"))
	got := PromptMultiline(scanner, "Answer ▶")
	want := "SELECT name\nFROM employees"
	if got != want {
		t.Fatalf("PromptMultiline() = %q, want %q", got, want)
	}
	if scanner.Scan() && scanner.Text() != "ignored after terminator" {
		t.Fatalf("expected scanner to stop consuming exactly at the terminator, next line was %q", scanner.Text())
	}
}

func TestPromptMultilineEmptyInput(t *testing.T) {
	scanner := bufio.NewScanner(strings.NewReader("---\n"))
	if got := PromptMultiline(scanner, "Answer ▶"); got != "" {
		t.Fatalf("expected empty multiline answer, got %q", got)
	}
}
