package bridge

import (
	"fmt"
	"hash/fnv"
	"math"
	"net/url"
	"strings"
	"time"
)

const (
	SchemaVersion       = "2026-07-02"
	Name                = "laura-go-matrix-citizen-bridge"
	Transform           = "moltbot-to-matrix-citizen"
	ProgressContract    = "laura-bridge-progress-v1"
	SourceRepository    = "Laura"
	SourceRepositoryURL = "https://github.com/Kvnbbg/Laura"
	TargetRepository    = "french-dev-ai-tools"
	TargetRepositoryURL = "https://github.com/Kvnbbg/french-dev-ai-tools"
	PublishTarget       = "techandstream.com"
	PublicOrigin        = "https://techandstream.com"
	SyncEndpoint        = "/api/bridge/matrix-progress"
	AuthorName          = "Kevin Marville"
	AuthorBrand         = "Techandstream"
	LicenseID           = "Apache-2.0"
	NoticeText          = "Keep LICENSE, NOTICE, and author attribution when redistributing Laura."
)

var (
	Commands     = []string{"auto", "add", "goto add"}
	ChannelPairs = []string{"web/web", "web/terminal", "terminal/web", "terminal/terminal"}

	allowedPayload = []string{
		"public article registry entries",
		"public Moltbook page text",
		"deterministic MatrixCitizen progress",
		"reviewed MatrixCitizen preview metadata",
	}

	blockedPayload = []string{
		".env files",
		"API keys or tokens",
		"private uploads",
		"unredacted terminal output",
		"private prompts",
	}

	weekThemes = []weekTheme{
		{
			Theme:  "Compiler Garden",
			Color:  "#14b8a6",
			Accent: "#22d3ee",
			Worlds: []string{"AST Grove", "Type Lagoon", "Lint Orchard", "Bundle Reef", "Runtime Meadow", "Patch Nursery", "Release Canopy"},
			Quests: []string{"normalize the input", "compose the contract", "prune the warning", "split the chunk", "trace the state", "ship the diff", "tag the release"},
		},
		{
			Theme:  "Protocol Citadel",
			Color:  "#6366f1",
			Accent: "#a5b4fc",
			Worlds: []string{"Handshake Gate", "Schema Keep", "Token Vault", "Relay Spire", "Audit Bridge", "Webhook Hall", "Consensus Roof"},
			Quests: []string{"open the handshake", "validate the payload", "seal the secret", "relay the signal", "write the audit", "retry the webhook", "publish consensus"},
		},
		{
			Theme:  "Open Source Reef",
			Color:  "#10b981",
			Accent: "#bef264",
			Worlds: []string{"README Tide", "Issue Coral", "Fork Channel", "Patch Current", "Review Shelf", "License Bay", "Maintainer Light"},
			Quests: []string{"read the public note", "triage the issue", "fork with intent", "land the patch", "resolve the review", "respect the license", "thank the maintainer"},
		},
		{
			Theme:  "Matrix Workshop",
			Color:  "#f59e0b",
			Accent: "#facc15",
			Worlds: []string{"Portal Loom", "Vector Forge", "Signal Bench", "Glyph Router", "Packet Kiln", "Citizen Lathe", "Expert Switchyard"},
			Quests: []string{"open the portal", "forge the vector", "compress the signal", "route the glyph", "harden the packet", "shape the citizen", "flip expert mode"},
		},
		{
			Theme:  "Human Week",
			Color:  "#ec4899",
			Accent: "#f472b6",
			Worlds: []string{"Coffee Grove", "Walk Park", "Review Circle", "Draft Hill", "Feedback Lake", "Merge Terrace", "Ship Square"},
			Quests: []string{"share the context", "take a walk", "ask for review", "write the draft", "give kind feedback", "merge with care", "ship for humans"},
		},
	}
)

type Options struct {
	Command  string
	Source   string
	Target   string
	UserID   string
	BotName  string
	RepoPath string
	Now      time.Time
}

type Payload struct {
	SchemaVersion       string           `json:"schemaVersion"`
	Name                string           `json:"name"`
	Transform           string           `json:"transform"`
	ProgressContract    string           `json:"progressContract"`
	Commands            []string         `json:"commands"`
	ChannelPairs        []string         `json:"channelPairs"`
	SourceRepository    string           `json:"sourceRepository"`
	SourceRepositoryURL string           `json:"sourceRepositoryUrl"`
	TargetRepository    string           `json:"targetRepository"`
	TargetRepositoryURL string           `json:"targetRepositoryUrl"`
	PublishTarget       string           `json:"publishTarget"`
	PublicOrigin        string           `json:"publicOrigin"`
	Provenance          Provenance       `json:"provenance"`
	Source              string           `json:"source"`
	Target              string           `json:"target"`
	Mode                string           `json:"mode"`
	Thread              string           `json:"thread"`
	Command             string           `json:"command"`
	ChannelPair         string           `json:"channelPair"`
	Operation           string           `json:"operation"`
	Citizen             CitizenPreview   `json:"citizen"`
	TechandstreamRoute  string           `json:"techandstreamRoute"`
	FrenchDevToolsURL   string           `json:"frenchDevToolsUrl"`
	Routes              Routes           `json:"routes"`
	Sync                SyncContract     `json:"sync"`
	Security            SecurityEnvelope `json:"security"`
	OpenClaw            OpenClawHandoff  `json:"openclaw"`
	Context             Context          `json:"context"`
	Messages            []Message        `json:"messages"`
}

type Routes struct {
	Laura            string `json:"laura"`
	Techandstream    string `json:"techandstream"`
	TechandstreamAdd string `json:"techandstreamAdd"`
	Resolved         string `json:"resolved"`
}

type Provenance struct {
	Author              string `json:"author"`
	SourceRepositoryURL string `json:"sourceRepositoryUrl"`
	License             string `json:"license"`
	Notice              string `json:"notice"`
}

type SyncContract struct {
	Endpoint string   `json:"endpoint"`
	Mode     string   `json:"mode"`
	Fields   []string `json:"fields"`
}

type SecurityEnvelope struct {
	SourceRepository    string   `json:"sourceRepository"`
	TargetRepository    string   `json:"targetRepository"`
	TargetRepositoryURL string   `json:"targetRepositoryUrl"`
	PublicOrigin        string   `json:"publicOrigin"`
	PublishTarget       string   `json:"publishTarget"`
	ReviewGate          string   `json:"reviewGate"`
	WriteMode           string   `json:"writeMode"`
	AllowedPayload      []string `json:"allowedPayload"`
	BlockedPayload      []string `json:"blockedPayload"`
}

type OpenClawHandoff struct {
	Agent          string   `json:"agent"`
	CrestodianRole string   `json:"crestodianRole"`
	RepoPath       string   `json:"repoPath,omitempty"`
	StatusCommand  string   `json:"statusCommand,omitempty"`
	AgentCommand   string   `json:"agentCommand"`
	Notes          []string `json:"notes"`
}

type Context struct {
	Repo               string           `json:"repo"`
	Provenance         Provenance       `json:"provenance"`
	TargetRepository   string           `json:"targetRepository"`
	Network            string           `json:"network"`
	Activity           string           `json:"activity"`
	BotName            string           `json:"botName"`
	HumanReview        bool             `json:"humanReview"`
	ReviewGate         string           `json:"reviewGate"`
	WriteMode          string           `json:"writeMode"`
	BridgeSecurity     SecurityEnvelope `json:"bridgeSecurity"`
	FrenchDevToolsURL  string           `json:"frenchDevToolsUrl"`
	TechandstreamRoute string           `json:"techandstreamRoute"`
	MatrixProgress     ProgressSync     `json:"matrixProgress"`
	MatrixActions      []ActionItem     `json:"matrixActions"`
	MatrixRelayDrafts  []RelayDraft     `json:"matrixRelayDrafts"`
	OpenClaw           OpenClawHandoff  `json:"openclaw"`
	Tags               []string         `json:"tags"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type CitizenPreview struct {
	ID          string   `json:"id"`
	Username    string   `json:"username"`
	DisplayName string   `json:"displayName"`
	Tier        string   `json:"tier"`
	Action      string   `json:"action"`
	Focus       string   `json:"focus"`
	Topics      []string `json:"topics"`
}

type ProgressState struct {
	UserID          string       `json:"userId"`
	MatrixCitizenID string       `json:"matrixCitizenId"`
	DayNumber       int          `json:"dayNumber"`
	DayIndex        int          `json:"dayIndex"`
	WeekIndex       int          `json:"weekIndex"`
	StreakDays      int          `json:"streakDays"`
	XPTotal         int          `json:"xpTotal"`
	XPToday         int          `json:"xpToday"`
	Multiplier      float64      `json:"multiplier"`
	World           BonusWorld   `json:"world"`
	WeekArc         []WeekNode   `json:"weekArc"`
	Sync            ProgressSync `json:"sync"`
}

type ProgressSync struct {
	Contract         string  `json:"contract"`
	UserID           string  `json:"userId"`
	MatrixCitizenID  string  `json:"matrixCitizenId"`
	DayNumber        int     `json:"dayNumber"`
	StreakDays       int     `json:"streakDays"`
	XPTotal          int     `json:"xpTotal"`
	XPToday          int     `json:"xpToday"`
	Multiplier       float64 `json:"multiplier"`
	BonusWorld       string  `json:"bonusWorld"`
	WeekTheme        string  `json:"weekTheme"`
	Quest            string  `json:"quest"`
	DeterministicKey string  `json:"deterministicKey"`
	UpdatedAt        string  `json:"updatedAt"`
}

type BonusWorld struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Theme     string `json:"theme"`
	DayIndex  int    `json:"dayIndex"`
	WeekIndex int    `json:"weekIndex"`
	Color     string `json:"color"`
	Accent    string `json:"accent"`
	Motif     string `json:"motif"`
	Quest     string `json:"quest"`
}

type WeekNode struct {
	ID        string `json:"id"`
	DateLabel string `json:"dateLabel"`
	World     string `json:"world"`
	Quest     string `json:"quest"`
	Motif     string `json:"motif"`
	XP        int    `json:"xp"`
	Status    string `json:"status"`
}

type ActionItem struct {
	ID           string `json:"id"`
	Label        string `json:"label"`
	Command      string `json:"command"`
	ChannelPair  string `json:"channelPair"`
	Description  string `json:"description"`
	XPReward     int    `json:"xpReward"`
	RouteHint    string `json:"routeHint"`
	TerminalHint string `json:"terminalHint"`
}

type RelayDraft struct {
	ID   string `json:"id"`
	Tone string `json:"tone"`
	Body string `json:"body"`
}

type weekTheme struct {
	Theme  string
	Color  string
	Accent string
	Worlds []string
	Quests []string
}

func Build(options Options) Payload {
	now := options.Now.UTC()
	if now.IsZero() {
		now = time.Now().UTC()
	}

	command := NormalizeCommand(options.Command)
	channelPair := fmt.Sprintf("%s/%s", NormalizeChannel(options.Source), NormalizeChannel(options.Target))
	operation := operationFor(command)
	botName := strings.TrimSpace(options.BotName)
	if botName == "" {
		botName = "Laura MoltBot"
	}
	username := ensureMin(strings.ReplaceAll(cleanSegment(botName), "-", "_"), "laura_moltbot")
	userID := cleanSegment(options.UserID)
	if userID == "" {
		userID = username
	}
	citizenID := "matrix-" + ensureMin(cleanSegment(botName), "laura-moltbot")
	progress := buildProgress(userID, citizenID, now)
	actions := buildActionDeck(progress, channelPair)
	relayDrafts := buildRelayDrafts(progress, botName)
	route := BuildTechandstreamRoute(command, username, channelPair)
	security := SecurityEnvelope{
		SourceRepository:    SourceRepository,
		TargetRepository:    TargetRepository,
		TargetRepositoryURL: TargetRepositoryURL,
		PublicOrigin:        PublicOrigin,
		PublishTarget:       PublishTarget,
		ReviewGate:          "human-review-required",
		WriteMode:           "manual-publish-only",
		AllowedPayload:      append([]string(nil), allowedPayload...),
		BlockedPayload:      append([]string(nil), blockedPayload...),
	}
	provenance := Provenance{
		Author:              fmt.Sprintf("%s / %s", AuthorName, AuthorBrand),
		SourceRepositoryURL: SourceRepositoryURL,
		License:             LicenseID,
		Notice:              NoticeText,
	}
	openclaw := buildOpenClawHandoff(strings.TrimSpace(options.RepoPath))

	context := Context{
		Repo:               SourceRepository,
		Provenance:         provenance,
		TargetRepository:   TargetRepository,
		Network:            PublishTarget,
		Activity:           "matrix-citizen-progress-sync",
		BotName:            botName,
		HumanReview:        true,
		ReviewGate:         security.ReviewGate,
		WriteMode:          security.WriteMode,
		BridgeSecurity:     security,
		FrenchDevToolsURL:  TargetRepositoryURL,
		TechandstreamRoute: route,
		MatrixProgress:     progress.Sync,
		MatrixActions:      actions,
		MatrixRelayDrafts:  relayDrafts,
		OpenClaw:           openclaw,
		Tags:               []string{"Laura", "Go", "OpenClaw", "MatrixCitizen", "Techandstream"},
	}

	return Payload{
		SchemaVersion:       SchemaVersion,
		Name:                Name,
		Transform:           Transform,
		ProgressContract:    ProgressContract,
		Commands:            append([]string(nil), Commands...),
		ChannelPairs:        append([]string(nil), ChannelPairs...),
		SourceRepository:    SourceRepository,
		SourceRepositoryURL: SourceRepositoryURL,
		TargetRepository:    TargetRepository,
		TargetRepositoryURL: TargetRepositoryURL,
		PublishTarget:       PublishTarget,
		PublicOrigin:        PublicOrigin,
		Provenance:          provenance,
		Source:              "laura-go",
		Target:              TargetRepository,
		Mode:                "social",
		Thread:              "matrix-citizen-progress",
		Command:             command,
		ChannelPair:         channelPair,
		Operation:           operation,
		Citizen: CitizenPreview{
			ID:          citizenID,
			Username:    username,
			DisplayName: botName,
			Tier:        "rising",
			Action:      actionFor(command),
			Focus:       "Public MoltBot to MatrixCitizen bridge for Techandstream.com via french-dev-ai-tools",
			Topics:      []string{"MoltBots", "MatrixCitizen", "Techandstream.com", "french-dev-ai-tools", "Laura", "Go"},
		},
		TechandstreamRoute: route,
		FrenchDevToolsURL:  TargetRepositoryURL,
		Routes: Routes{
			Laura:            "/matrix-citizen",
			Techandstream:    PublicOrigin + "/matrix-citizen",
			TechandstreamAdd: PublicOrigin + "/matrix-citizen/add",
			Resolved:         route,
		},
		Sync: SyncContract{
			Endpoint: SyncEndpoint,
			Mode:     "credential-free deterministic Go bridge payload, accepted only with public-safe security envelope",
			Fields: []string{
				"userId",
				"matrixCitizenId",
				"dayNumber",
				"streakDays",
				"xpTotal",
				"xpToday",
				"bonusWorld",
				"weekTheme",
				"weekArc",
				"actionDeck",
				"relayDrafts",
			},
		},
		Security: security,
		OpenClaw: openclaw,
		Context:  context,
		Messages: []Message{
			{
				Role:    "user",
				Content: fmt.Sprintf("Sync %s for %s through %s with human review.", ProgressContract, citizenID, PublishTarget),
			},
		},
	}
}

func NormalizeCommand(command string) string {
	normalized := strings.ToLower(strings.TrimSpace(command))
	normalized = strings.ReplaceAll(normalized, "_", " ")
	normalized = strings.ReplaceAll(normalized, "-", " ")
	normalized = strings.Join(strings.Fields(normalized), " ")
	switch normalized {
	case "add":
		return "add"
	case "goto add":
		return "goto add"
	default:
		return "auto"
	}
}

func NormalizeChannel(channel string) string {
	if strings.EqualFold(strings.TrimSpace(channel), "terminal") {
		return "terminal"
	}
	return "web"
}

func BuildTechandstreamRoute(command, username, channelPair string) string {
	path := "/matrix-citizen"
	if NormalizeCommand(command) == "goto add" {
		path = "/matrix-citizen/add"
	}
	route, err := url.Parse(PublicOrigin + path)
	if err != nil {
		return PublicOrigin + path
	}
	query := route.Query()
	query.Set("bot", username)
	query.Set("from", channelPair)
	if NormalizeCommand(command) != "goto add" {
		query.Set("action", NormalizeCommand(command))
	}
	route.RawQuery = query.Encode()
	return route.String()
}

func buildOpenClawHandoff(repoPath string) OpenClawHandoff {
	handoff := OpenClawHandoff{
		Agent:          "main",
		CrestodianRole: "setup/status/doctor only; use the main OpenClaw agent for repository commands and code edits",
		AgentCommand:   "openclaw agent --agent main --message-file <laura-go-bridge-payload.json>",
		Notes: []string{
			"Run real repository commands in Laura before diagnosing the project.",
			"Do not create placeholder main.go, go.sum, or tests from a generic scan.",
			"Keep Techandstream publishing manual-review-only and public-safe.",
		},
	}
	if repoPath != "" {
		handoff.RepoPath = repoPath
		handoff.StatusCommand = fmt.Sprintf("git -C %s status --short --branch", shellQuote(repoPath))
	}
	return handoff
}

func operationFor(command string) string {
	if NormalizeCommand(command) == "goto add" {
		return "goto_add"
	}
	return NormalizeCommand(command)
}

func actionFor(command string) string {
	if NormalizeCommand(command) == "auto" {
		return "COMMENT_INSIGHT"
	}
	return "PUBLISH_PROJECT_UPDATE"
}

func buildProgress(userID, citizenID string, now time.Time) ProgressState {
	dayNumber := int(time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC).Unix() / 86400)
	weekIndex := dayNumber / 7
	dayIndex := dayNumber % 7
	theme := weekThemes[int(stableHash(fmt.Sprintf("%s:%d", userID, weekIndex))%uint32(len(weekThemes)))]
	streakDays := int(stableHash(userID)%5) + 1
	xpToday := 24 + int(stableHash(fmt.Sprintf("%s:%d", userID, dayNumber))%31) + minInt(streakDays, 7)*3
	xpTotal := 900 + int(stableHash(userID)%700) + xpToday
	multiplier := math.Round((1+float64(minInt(streakDays, 14))*0.05)*100) / 100
	worldID := fmt.Sprintf("%s-%d", strings.ReplaceAll(strings.ToLower(theme.Theme), " ", "-"), dayIndex)
	world := BonusWorld{
		ID:        worldID,
		Name:      theme.Worlds[dayIndex],
		Theme:     theme.Theme,
		DayIndex:  dayIndex,
		WeekIndex: weekIndex,
		Color:     theme.Color,
		Accent:    theme.Accent,
		Motif:     motifFor(dayIndex),
		Quest:     theme.Quests[dayIndex],
	}
	deterministicKey := fmt.Sprintf("%s:%d:%s", userID, dayNumber, world.ID)
	weekArc := buildWeekArc(theme, dayNumber, dayIndex, userID)

	return ProgressState{
		UserID:          userID,
		MatrixCitizenID: citizenID,
		DayNumber:       dayNumber,
		DayIndex:        dayIndex,
		WeekIndex:       weekIndex,
		StreakDays:      streakDays,
		XPTotal:         xpTotal,
		XPToday:         xpToday,
		Multiplier:      multiplier,
		World:           world,
		WeekArc:         weekArc,
		Sync: ProgressSync{
			Contract:         ProgressContract,
			UserID:           userID,
			MatrixCitizenID:  citizenID,
			DayNumber:        dayNumber,
			StreakDays:       streakDays,
			XPTotal:          xpTotal,
			XPToday:          xpToday,
			Multiplier:       multiplier,
			BonusWorld:       world.Name,
			WeekTheme:        world.Theme,
			Quest:            world.Quest,
			DeterministicKey: deterministicKey,
			UpdatedAt:        now.Format(time.RFC3339),
		},
	}
}

func buildWeekArc(theme weekTheme, dayNumber, dayIndex int, userID string) []WeekNode {
	firstDay := dayNumber - dayIndex
	nodes := make([]WeekNode, 0, len(theme.Worlds))
	for index, world := range theme.Worlds {
		nodeDay := firstDay + index
		status := "queued"
		if index < dayIndex {
			status = "done"
		} else if index == dayIndex {
			status = "today"
		}
		nodes = append(nodes, WeekNode{
			ID:        fmt.Sprintf("%s-%d", strings.ReplaceAll(strings.ToLower(theme.Theme), " ", "-"), index),
			DateLabel: time.Unix(int64(nodeDay)*86400, 0).UTC().Format("2006-01-02"),
			World:     world,
			Quest:     theme.Quests[index],
			Motif:     motifFor(index),
			XP:        18 + int(stableHash(fmt.Sprintf("%s:%d:%s", userID, nodeDay, world))%28),
			Status:    status,
		})
	}
	return nodes
}

func buildActionDeck(progress ProgressState, channelPair string) []ActionItem {
	return []ActionItem{
		{
			ID:           "auto-triage",
			Label:        "auto triage",
			Command:      "auto",
			ChannelPair:  channelPair,
			Description:  fmt.Sprintf("Score the feed signal, keep %s active, choose the safest public action.", progress.World.Name),
			XPReward:     int(math.Round(float64(progress.XPToday) * 0.35)),
			RouteHint:    fmt.Sprintf("/matrix-citizen?action=auto&from=%s", channelPair),
			TerminalHint: fmt.Sprintf("/run matrix-citizen auto %s", channelPair),
		},
		{
			ID:           "add-record",
			Label:        "add record",
			Command:      "add",
			ChannelPair:  channelPair,
			Description:  "Prepare a reviewed MatrixCitizen record with public metadata only.",
			XPReward:     int(math.Round(float64(progress.XPToday) * 0.5)),
			RouteHint:    fmt.Sprintf("/matrix-citizen?action=add&from=%s", channelPair),
			TerminalHint: fmt.Sprintf("/run matrix-citizen add %s", channelPair),
		},
		{
			ID:           "goto-add",
			Label:        "goto add",
			Command:      "goto add",
			ChannelPair:  channelPair,
			Description:  "Open the add surface directly and carry the same progress contract.",
			XPReward:     int(math.Round(float64(progress.XPToday) * 0.65)),
			RouteHint:    fmt.Sprintf("/matrix-citizen/add?from=%s", channelPair),
			TerminalHint: fmt.Sprintf("/run matrix-citizen goto add %s", channelPair),
		},
	}
}

func buildRelayDrafts(progress ProgressState, citizenName string) []RelayDraft {
	key := progress.Sync.DeterministicKey
	return []RelayDraft{
		{
			ID:   key + ":dry-draft",
			Tone: "dry",
			Body: fmt.Sprintf("%s: %s. quest=%s. sync=%s. no secrets.", citizenName, progress.World.Name, progress.World.Quest, progress.Sync.Contract),
		},
		{
			ID:   key + ":expert-draft",
			Tone: "expert",
			Body: fmt.Sprintf("Codex: replay deterministicKey %s; carry %dd streak, x%.2f multiplier.", key, progress.StreakDays, progress.Multiplier),
		},
		{
			ID:   key + ":social-draft",
			Tone: "social",
			Body: fmt.Sprintf("MoltBot: %s is live. Add one public signal, then route it through MatrixCitizen.", progress.World.Theme),
		},
		{
			ID:   key + ":human-draft",
			Tone: "social",
			Body: fmt.Sprintf("Human review: today's quest is %q; publish only reviewed public metadata.", progress.World.Quest),
		},
	}
}

func cleanSegment(value string) string {
	fields := strings.FieldsFunc(strings.ToLower(strings.TrimSpace(value)), func(r rune) bool {
		return !(r >= 'a' && r <= 'z') && !(r >= '0' && r <= '9') && r != '-' && r != '_'
	})
	return strings.Trim(strings.Join(fields, "-"), "-_")
}

func ensureMin(value, fallback string) string {
	if len(value) >= 3 {
		return value
	}
	return fallback
}

func stableHash(value string) uint32 {
	hash := fnv.New32a()
	_, _ = hash.Write([]byte(value))
	return hash.Sum32()
}

func motifFor(index int) string {
	motifs := []string{"portal", "hash", "relay", "quest", "matrix", "streak", "sync"}
	return motifs[index%len(motifs)]
}

func minInt(left, right int) int {
	if left < right {
		return left
	}
	return right
}

func shellQuote(value string) string {
	if value == "" {
		return "''"
	}
	if !strings.ContainsAny(value, " \t\n'\"\\$`!*?[]{}()<>|&;") {
		return value
	}
	return "'" + strings.ReplaceAll(value, "'", "'\\''") + "'"
}
