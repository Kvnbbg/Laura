package bridge

import (
	"fmt"
	"strings"
	"time"
)

const (
	MindwalkContract      = "laura-mindwalk-bridge-v1"
	MindwalkName          = "laura-mindwalk-session-bridge"
	MindwalkTool          = "mindwalk"
	MindwalkRepositoryURL = "https://github.com/cosmtrek/mindwalk"
	MindwalkInstall       = `curl -fsSL https://raw.githubusercontent.com/cosmtrek/mindwalk/master/scripts/install.sh | sh`
)

type MindwalkOptions struct {
	Command     string
	RepoPath    string
	SessionPath string
	Port        int
	Judge       string
	NoOpen      bool
	Now         time.Time
}

type MindwalkPayload struct {
	SchemaVersion       string           `json:"schemaVersion"`
	Name                string           `json:"name"`
	Contract            string           `json:"contract"`
	Tool                string           `json:"tool"`
	ToolRepositoryURL   string           `json:"toolRepositoryUrl"`
	SourceRepository    string           `json:"sourceRepository"`
	SourceRepositoryURL string           `json:"sourceRepositoryUrl"`
	Command             string           `json:"command"`
	RepoPath            string           `json:"repoPath,omitempty"`
	SessionPath         string           `json:"sessionPath,omitempty"`
	Port                int              `json:"port,omitempty"`
	LocalURL            string           `json:"localUrl,omitempty"`
	InstallCommand      string           `json:"installCommand"`
	CLICommands         []string         `json:"cliCommands"`
	Security            MindwalkSecurity `json:"security"`
	OpenClaw            OpenClawHandoff  `json:"openclaw"`
	Context             MindwalkContext  `json:"context"`
	Messages            []Message        `json:"messages"`
	GeneratedAt         string           `json:"generatedAt"`
}

type MindwalkSecurity struct {
	ViewingMode    string   `json:"viewingMode"`
	AnalyzeMode    string   `json:"analyzeMode"`
	NetworkPolicy  string   `json:"networkPolicy"`
	AllowedPayload []string `json:"allowedPayload"`
	BlockedPayload []string `json:"blockedPayload"`
}

type MindwalkContext struct {
	Activity        string           `json:"activity"`
	Repository      string           `json:"repository"`
	Tool            string           `json:"tool"`
	Contract        string           `json:"contract"`
	OpenClaw        OpenClawHandoff  `json:"openclaw"`
	Security        MindwalkSecurity `json:"security"`
	RecommendedNext []string         `json:"recommendedNext"`
	Tags            []string         `json:"tags"`
}

func BuildMindwalk(options MindwalkOptions) MindwalkPayload {
	now := options.Now.UTC()
	if now.IsZero() {
		now = time.Now().UTC()
	}

	command := NormalizeMindwalkCommand(options.Command)
	repoPath := strings.TrimSpace(options.RepoPath)
	sessionPath := strings.TrimSpace(options.SessionPath)
	port := options.Port
	if port <= 0 {
		port = 8766
	}
	judge := strings.TrimSpace(options.Judge)
	if judge == "" {
		judge = "codex"
	}

	security := MindwalkSecurity{
		ViewingMode:   "local-only session visualization",
		AnalyzeMode:   "explicit-only; sends a summarized session through the user's selected local claude or codex CLI",
		NetworkPolicy: "mindwalk viewing sends nothing externally; analyze is opt-in and uses the user's own agent CLI account",
		AllowedPayload: []string{
			"repository file paths",
			"agent session event digests",
			"local citymap and trace JSON",
			"explicit analyze summaries",
		},
		BlockedPayload: []string{
			".env files",
			"API keys or tokens",
			"private uploads",
			"raw secrets from terminal output",
			"automatic third-party installation",
		},
	}
	openclaw := buildOpenClawHandoff(repoPath)
	commands := buildMindwalkCommands(command, repoPath, sessionPath, port, judge, options.NoOpen)

	localURL := ""
	if command == "serve" {
		localURL = fmt.Sprintf("http://127.0.0.1:%d", port)
	}

	context := MindwalkContext{
		Activity:   "codex-session-visualization",
		Repository: SourceRepository,
		Tool:       MindwalkTool,
		Contract:   MindwalkContract,
		OpenClaw:   openclaw,
		Security:   security,
		RecommendedNext: []string{
			"Run mindwalk against local Claude Code and Codex session logs.",
			"Use the visualization to inspect Laura file reads, edits, searches, and wandering.",
			"Only run analyze when the session summary is safe to send through the selected local agent CLI.",
		},
		Tags: []string{"Laura", "Mindwalk", "Codex", "Claude Code", "OpenClaw"},
	}

	return MindwalkPayload{
		SchemaVersion:       SchemaVersion,
		Name:                MindwalkName,
		Contract:            MindwalkContract,
		Tool:                MindwalkTool,
		ToolRepositoryURL:   MindwalkRepositoryURL,
		SourceRepository:    SourceRepository,
		SourceRepositoryURL: SourceRepositoryURL,
		Command:             command,
		RepoPath:            repoPath,
		SessionPath:         sessionPath,
		Port:                port,
		LocalURL:            localURL,
		InstallCommand:      MindwalkInstall + ` && export PATH="$HOME/.local/bin:$PATH"`,
		CLICommands:         commands,
		Security:            security,
		OpenClaw:            openclaw,
		Context:             context,
		Messages: []Message{
			{
				Role:    "user",
				Content: fmt.Sprintf("Use %s to visualize Laura agent sessions with local-first security.", MindwalkTool),
			},
		},
		GeneratedAt: now.Format(time.RFC3339),
	}
}

func NormalizeMindwalkCommand(command string) string {
	normalized := strings.ToLower(strings.TrimSpace(command))
	normalized = strings.ReplaceAll(normalized, "_", " ")
	normalized = strings.ReplaceAll(normalized, "-", " ")
	normalized = strings.Join(strings.Fields(normalized), " ")
	switch normalized {
	case "check", "serve", "open", "build", "trace", "analyze":
		return normalized
	default:
		return "serve"
	}
}

func buildMindwalkCommands(command, repoPath, sessionPath string, port int, judge string, noOpen bool) []string {
	repo := strings.TrimSpace(repoPath)
	if repo == "" {
		repo = "."
	}
	session := strings.TrimSpace(sessionPath)
	if session == "" {
		session = "<session.jsonl>"
	}
	openFlag := ""
	if noOpen {
		openFlag = " --no-open"
	}

	switch command {
	case "check":
		return []string{"command -v mindwalk", "mindwalk --help"}
	case "open":
		return []string{fmt.Sprintf("mindwalk open%s %s", openFlag, shellQuote(session))}
	case "build":
		return []string{fmt.Sprintf("mindwalk build %s -o .mindwalk/laura-citymap.json", shellQuote(repo))}
	case "trace":
		return []string{fmt.Sprintf("mindwalk trace %s -o .mindwalk/laura-trace.json", shellQuote(session))}
	case "analyze":
		return []string{fmt.Sprintf("mindwalk analyze %s --judge %s", shellQuote(session), shellQuote(judge))}
	default:
		return []string{fmt.Sprintf("mindwalk serve --port %d%s", port, openFlag)}
	}
}
