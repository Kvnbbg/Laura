package bridge

import (
	"strings"
	"time"
)

const (
	RuneContract      = "laura-rune-bridge-v1"
	RuneName          = "laura-rune-pilot-kit"
	RuneTool          = "rune"
	RuneRepositoryURL = "https://github.com/unstablebuild/rune"
	RuneLicense       = "GPL-3.0-or-later"
)

type RuneOptions struct {
	Command  string
	RepoPath string
	Now      time.Time
}

type RunePayload struct {
	SchemaVersion     string   `json:"schemaVersion"`
	Name              string   `json:"name"`
	Contract          string   `json:"contract"`
	Tool              string   `json:"tool"`
	ToolRepositoryURL string   `json:"toolRepositoryUrl"`
	ToolLicense       string   `json:"toolLicense"`
	PreferredCLI      string   `json:"preferredCli"`
	Command           string   `json:"command"`
	RepoPath          string   `json:"repoPath,omitempty"`
	PluginCommand     string   `json:"pluginCommand"`
	InstallHints      []string `json:"installHints"`
	Vendoring         string   `json:"vendoring"`
	GeneratedAt       string   `json:"generatedAt"`
}

func NormalizeRuneCommand(command string) string {
	switch strings.ToLower(strings.TrimSpace(command)) {
	case "check", "status", "deps", "clone-hint", "build", "version", "run", "agent", "help":
		return strings.ToLower(strings.TrimSpace(command))
	default:
		return "status"
	}
}

func BuildRune(options RuneOptions) RunePayload {
	now := options.Now.UTC()
	if now.IsZero() {
		now = time.Now().UTC()
	}
	command := NormalizeRuneCommand(options.Command)
	return RunePayload{
		SchemaVersion:     RuneContract,
		Name:              RuneName,
		Contract:          RuneContract,
		Tool:              RuneTool,
		ToolRepositoryURL: RuneRepositoryURL,
		ToolLicense:       RuneLicense,
		PreferredCLI:      "laura",
		Command:           command,
		RepoPath:          strings.TrimSpace(options.RepoPath),
		PluginCommand:     "/run rune " + command,
		InstallHints: []string{
			"Install Ubuntu cgo deps (see docs/RUNE_KIT.md)",
			"git clone https://github.com/unstablebuild/rune.git",
			"make rune",
		},
		Vendoring:   "forbidden-keep-separate-checkout",
		GeneratedAt: now.Format(time.RFC3339),
	}
}
