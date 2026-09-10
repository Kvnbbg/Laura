package bridge

import (
	"fmt"
	"strings"
	"time"
)

// Hark: Laura is sovereign; COPY is but a fellow player upon the stage.
const (
	CopyContract      = "laura-copy-bridge-v1"
	CopyName          = "laura-copy-cross-app-bridge"
	CopyTool          = "copy"
	CopyRepositoryURL = "https://github.com/Kvnbbg/copy"
	CopyInstallHint   = "git clone https://github.com/Kvnbbg/copy.git && cd copy && npm install && cp .env.example .env && npm run doctor"
)

// AllowedCopyCommands are the only words COPY may speak when summoned by Laura.
var AllowedCopyCommands = []string{
	"doctor", "rules", "positions", "trader", "scan", "hunt", "paper", "terminal", "help",
}

type CopyOptions struct {
	Command  string
	Args     []string
	BinPath  string
	RepoPath string
	Now      time.Time
}

type CopySecurity struct {
	PreferredCLI   string   `json:"preferredCli"`
	ExecutionMode  string   `json:"executionMode"`
	NetworkPolicy  string   `json:"networkPolicy"`
	AllowedPayload []string `json:"allowedPayload"`
	BlockedPayload []string `json:"blockedPayload"`
}

type CopyContext struct {
	Activity        string         `json:"activity"`
	Repository      string         `json:"repository"`
	Tool            string         `json:"tool"`
	Contract        string         `json:"contract"`
	OpenClaw        OpenClawHandoff `json:"openclaw"`
	Security        CopySecurity   `json:"security"`
	RecommendedNext []string       `json:"recommendedNext"`
	Tags            []string       `json:"tags"`
}

type CopyPayload struct {
	SchemaVersion       string        `json:"schemaVersion"`
	Name                string        `json:"name"`
	Contract            string        `json:"contract"`
	Tool                string        `json:"tool"`
	ToolRepositoryURL   string        `json:"toolRepositoryUrl"`
	SourceRepository    string        `json:"sourceRepository"`
	SourceRepositoryURL string        `json:"sourceRepositoryUrl"`
	Command             string        `json:"command"`
	Args                []string      `json:"args,omitempty"`
	BinPath             string        `json:"binPath,omitempty"`
	RepoPath            string        `json:"repoPath,omitempty"`
	InstallCommand      string        `json:"installCommand"`
	CLICommands         []string      `json:"cliCommands"`
	PluginCommand       string        `json:"pluginCommand"`
	Security            CopySecurity  `json:"security"`
	OpenClaw            OpenClawHandoff `json:"openclaw"`
	Context             CopyContext   `json:"context"`
	Messages            []Message     `json:"messages"`
	GeneratedAt         string        `json:"generatedAt"`
}

func BuildCopy(options CopyOptions) CopyPayload {
	now := options.Now.UTC()
	if now.IsZero() {
		now = time.Now().UTC()
	}

	command := NormalizeCopyCommand(options.Command)
	args := sanitizeCopyArgs(options.Args)
	bin := strings.TrimSpace(options.BinPath)
	repo := strings.TrimSpace(options.RepoPath)

	security := CopySecurity{
		PreferredCLI:  "laura",
		ExecutionMode: "allowlisted subprocess; paper and hunt only unless the operator types the command",
		NetworkPolicy: "Laura doth not fetch wallets nor keys; COPY keepeth its own .env",
		AllowedPayload: []string{
			"FIRE/SKIP reasons",
			"paper position summaries",
			"doctor and rules output",
			"public market symbols",
		},
		BlockedPayload: []string{
			live wallet connect",
			"signing keys",
			"unallowlisted subcommands",
			"automatic installation",
			"VITE_* secrets",
		},
	}

	openclaw := buildOpenClawHandoff(repo)
	cli := buildCopyCommands(command, args, bin, repo)

	context := CopyContext{
		Activity:   "copytrade-cross-app-utility",
		Repository: SourceRepository,
		Tool:       CopyTool,
		Contract:   CopyContract,
		OpenClaw:   openclaw,
		Security:   security,
		RecommendedNext: []string{
			"Keep Laura as the preferred CLI.",
			"Run /run copy doctor before hunt or paper.",
			"Treat FIRE as counsel, not as a live broadcast trade.",
		},
		Tags: []string{"Laura", "COPY", "CLI", "paper", "OpenClaw"},
	}

	plugin := "/run copy"
	if command != "" && command != "help" {
		plugin = "/run copy " + command
		if len(args) > 0 {
			plugin += " " + strings.Join(args, " ")
		}
	}

	return CopyPayload{
		SchemaVersion:       SchemaVersion,
		Name:                CopyName,
		Contract:            CopyContract,
		Tool:                CopyTool,
		ToolRepositoryURL:   CopyRepositoryURL,
		SourceRepository:    SourceRepository,
		SourceRepositoryURL: SourceRepositoryURL,
		Command:             command,
		Args:                args,
		BinPath:             bin,
		RepoPath:            repo,
		InstallCommand:      CopyInstallHint,
		CLICommands:         cli,
		PluginCommand:       plugin,
		Security:            security,
		OpenClaw:            openclaw,
		Context:             context,
		Messages: []Message{
			{
				Role:    "user",
				Content: "Use COPY as Laura's fellow player: paper walls and hunt, never an unsanctioned live trade.",
			},
		},
		GeneratedAt: now.Format(time.RFC3339),
	}
}

func NormalizeCopyCommand(command string) string {
	normalized := strings.ToLower(strings.TrimSpace(command))
	if normalized == "" {
		return "doctor"
	}
	for _, allowed := range AllowedCopyCommands {
		if normalized == allowed {
			return normalized
		}
	}
	return "help"
}

func sanitizeCopyArgs(args []string) []string {
	out := make([]string, 0, len(args))
	for _, raw := range args {
		arg := strings.TrimSpace(raw)
		if arg == "" {
			continue
		}
		if strings.HasPrefix(arg, "-") || !strings.ContainsAny(arg, " 	\n;&|`$()") {
			out = append(out, arg)
		}
	}
	return out
}

func buildCopyCommands(command string, args []string, bin, repo string) []string {
	exe := "copy"
	if strings.TrimSpace(bin) != "" {
		exe = shellQuote(bin)
	} else if strings.TrimSpace(repo) != "" {
		exe = "node " + shellQuote(strings.TrimRight(repo, "/") + "/bin/copy.mjs")
	}
	parts := append([]string{command}, args...)
	return []string{fmt.Sprintf("%s %s", exe, strings.Join(parts, " "))}
}
