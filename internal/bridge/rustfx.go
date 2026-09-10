package bridge

import (
	"strings"
	"time"
)

const (
	RustfxContract      = "laura-rustfx-web3-v1"
	RustfxName          = "laura-rustfx-pilot"
	RustfxTool          = "rustfx-web3"
	RustfxRepositoryURL = "https://github.com/Kvnbbg/rustFX"
)

type RustfxOptions struct {
	Command  string
	RepoPath string
	Now      time.Time
}

type RustfxPayload struct {
	SchemaVersion       string   `json:"schemaVersion"`
	Name                string   `json:"name"`
	Contract            string   `json:"contract"`
	Tool                string   `json:"tool"`
	ToolRepositoryURL   string   `json:"toolRepositoryUrl"`
	PreferredCLI        string   `json:"preferredCli"`
	Language            string   `json:"language"`
	Command             string   `json:"command"`
	RepoPath            string   `json:"repoPath,omitempty"`
	PluginCommand       string   `json:"pluginCommand"`
	InstallHints        []string `json:"installHints"`
	Custody             string   `json:"custody"`
	GeneratedAt         string   `json:"generatedAt"`
}

func NormalizeRustfxCommand(command string) string {
	switch strings.ToLower(strings.TrimSpace(command)) {
	case "coins", "catalog":
		return "coins"
	case "build":
		return "build"
	case "check", "install":
		return "check"
	default:
		return "status"
	}
}

func BuildRustfx(options RustfxOptions) RustfxPayload {
	now := options.Now.UTC()
	if now.IsZero() {
		now = time.Now().UTC()
	}
	command := NormalizeRustfxCommand(options.Command)
	return RustfxPayload{
		SchemaVersion:     RustfxContract,
		Name:              RustfxName,
		Contract:          RustfxContract,
		Tool:              RustfxTool,
		ToolRepositoryURL: RustfxRepositoryURL,
		PreferredCLI:      "laura",
		Language:          "rust",
		Command:           command,
		RepoPath:          strings.TrimSpace(options.RepoPath),
		PluginCommand:     "/run rustfx " + command,
		InstallHints: []string{
			"rustup toolchain install stable",
			"cargo build -p rustfx-web3 --release",
		},
		Custody:     "none",
		GeneratedAt: now.Format(time.RFC3339),
	}
}
