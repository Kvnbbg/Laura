package main

import (
	"bufio"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"math/rand"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/Kvnbbg/Laura/internal/bridge"
	"github.com/Kvnbbg/Laura/internal/game"
	"github.com/Kvnbbg/Laura/internal/ui"
)

const (
	version        = "0.1.0"
	projectName    = "Laura"
	projectAuthor  = "Kevin Marville / Techandstream"
	projectSource  = "https://github.com/Kvnbbg/Laura"
	projectLicense = "Apache-2.0"
)

func main() {
	var (
		worldFlag      = flag.String("world", "", "World to start in")
		statsFlag      = flag.Bool("stats", false, "Print stats and exit")
		resetFlag      = flag.Bool("reset", false, "Reset save data")
		noColor        = flag.Bool("no-color", false, "Disable ANSI color")
		noAnimation    = flag.Bool("no-animation", false, "Disable animation")
		versionFlg     = flag.Bool("version", false, "Print version")
		modeFlag       = flag.String("mode", "", "Game mode (e.g. code-data)")
		trackFlag      = flag.String("track", "", "Code/Data Master track: sql|dsa|stats|ml|de|system|go")
		dailyFlag      = flag.Bool("daily", false, "Play today's Code/Data Master daily set")
		weakTopicsFlag = flag.Bool("weak-topics", false, "Train your weakest Code/Data Master topics first")
		reviewFlag     = flag.Bool("review", false, "Review missions you've already completed")
		pathFlag       = flag.Bool("path", false, "Print the learning path for --track and exit")
		bridgeFlag     = flag.Bool("bridge", false, "Emit public-safe Laura -> french-dev-ai-tools MatrixCitizen bridge JSON")
		bridgeCommand  = flag.String("bridge-command", "auto", "Bridge command: auto|add|goto add")
		bridgeSource   = flag.String("bridge-source", "terminal", "Bridge source channel: web|terminal")
		bridgeTarget   = flag.String("bridge-target", "web", "Bridge target channel: web|terminal")
		bridgeUser     = flag.String("bridge-user", "", "Public MatrixCitizen user id for deterministic progress")
		bridgeBot      = flag.String("bridge-bot", "Laura MoltBot", "Public MoltBot display name")
		bridgeRepo     = flag.String("bridge-repo", "", "Laura repo path for OpenClaw status hints")
		mindwalkBridge = flag.Bool("mindwalk-bridge", false, "Emit local-first Mindwalk bridge JSON")
		mindwalkCmd    = flag.String("mindwalk-command", "serve", "Mindwalk command: check|serve|open|build|trace|analyze")
		mindwalkRepo   = flag.String("mindwalk-repo", "", "Repository path to visualize with Mindwalk")
		mindwalkSess   = flag.String("mindwalk-session", "", "Session JSONL path for mindwalk open|trace|analyze")
		mindwalkPort   = flag.Int("mindwalk-port", 8766, "Local Mindwalk serve port")
		mindwalkJudge  = flag.String("mindwalk-judge", "codex", "Mindwalk analyze judge: codex|claude")
		mindwalkNoOpen       = flag.Bool("mindwalk-no-open", true, "Pass --no-open to mindwalk serve/open")
		techandstreamSend    = flag.Bool("techandstream-send", false, "Build bridge payload and POST it to Techandstream")
		techandstreamFetch   = flag.Bool("techandstream-fetch-articles", false, "Fetch the public Techandstream article registry")
		techandstreamAPIKey  = flag.String("techandstream-api-key", "", "API key for Techandstream write endpoint (also TECHANDSTREAM_API_KEY)")
		techandstreamBaseURL = flag.String("techandstream-base-url", "", "Techandstream base URL (also TECHANDSTREAM_BASE_URL)")
		techandstreamTimeout = flag.Duration("techandstream-timeout", 15*time.Second, "HTTP timeout for Techandstream calls")
	)
	flag.Parse()
	_ = noColor

	if *versionFlg {
		fmt.Printf("%s %s\n", projectName, version)
		fmt.Println("Author:", projectAuthor)
		fmt.Println("Source:", projectSource)
		fmt.Println("License:", projectLicense)
		return
	}
	if *resetFlag {
		_ = game.Reset()
		fmt.Println("Save reset.")
		return
	}
	if *bridgeFlag {
		payload := bridge.Build(bridge.Options{
			Command:  *bridgeCommand,
			Source:   *bridgeSource,
			Target:   *bridgeTarget,
			UserID:   *bridgeUser,
			BotName:  *bridgeBot,
			RepoPath: strings.TrimSpace(*bridgeRepo),
		})
		encoder := json.NewEncoder(os.Stdout)
		encoder.SetEscapeHTML(false)
		encoder.SetIndent("", "  ")
		if err := encoder.Encode(payload); err != nil {
			fmt.Fprintf(os.Stderr, "bridge encode failed: %v\n", err)
			os.Exit(1)
		}
		return
	}
	if *mindwalkBridge {
		payload := bridge.BuildMindwalk(bridge.MindwalkOptions{
			Command:     *mindwalkCmd,
			RepoPath:    strings.TrimSpace(*mindwalkRepo),
			SessionPath: strings.TrimSpace(*mindwalkSess),
			Port:        *mindwalkPort,
			Judge:       *mindwalkJudge,
			NoOpen:      *mindwalkNoOpen,
		})
		encoder := json.NewEncoder(os.Stdout)
		encoder.SetEscapeHTML(false)
		encoder.SetIndent("", "  ")
		if err := encoder.Encode(payload); err != nil {
			fmt.Fprintf(os.Stderr, "mindwalk bridge encode failed: %v\n", err)
			os.Exit(1)
		}
		return
	}
	if *techandstreamFetch {
		client, err := bridge.NewClient(bridge.ClientOptions{
			BaseURL: *techandstreamBaseURL,
			Timeout: *techandstreamTimeout,
		})
		if err != nil {
			fmt.Fprintf(os.Stderr, "techandstream client failed: %v\n", err)
			os.Exit(1)
		}
		articles, err := client.FetchArticles(context.Background())
		if err != nil {
			fmt.Fprintf(os.Stderr, "fetch articles failed: %v\n", err)
			os.Exit(1)
		}
		encoder := json.NewEncoder(os.Stdout)
		encoder.SetEscapeHTML(false)
		encoder.SetIndent("", "  ")
		if err := encoder.Encode(articles); err != nil {
			fmt.Fprintf(os.Stderr, "encode articles failed: %v\n", err)
			os.Exit(1)
		}
		return
	}
	if *techandstreamSend {
		client, err := bridge.NewClient(bridge.ClientOptions{
			BaseURL: *techandstreamBaseURL,
			APIKey:  strings.TrimSpace(*techandstreamAPIKey),
			Timeout: *techandstreamTimeout,
		})
		if err != nil {
			fmt.Fprintf(os.Stderr, "techandstream client failed: %v\n", err)
			os.Exit(1)
		}
		payload := bridge.Build(bridge.Options{
			Command:  *bridgeCommand,
			Source:   *bridgeSource,
			Target:   *bridgeTarget,
			UserID:   *bridgeUser,
			BotName:  *bridgeBot,
			RepoPath: strings.TrimSpace(*bridgeRepo),
		})
		if err := client.SendMatrixProgress(context.Background(), payload); err != nil {
			fmt.Fprintf(os.Stderr, "send matrix progress failed: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("Matrix progress sent to Techandstream for public-safe manual review.")
		return
	}

	rand.Seed(time.Now().UnixNano())
	engine := game.NewEngine()
	session := game.NewSession(engine, loadState())
	runMaster := normalizeWorldChoice(*worldFlag) == "master"
	codeDataOpts, codeDataRequested := buildCodeDataOptions(*modeFlag, *trackFlag, *dailyFlag, *weakTopicsFlag, *reviewFlag, *pathFlag)

	if *statsFlag {
		printStats(session.State, engine)
		return
	}

	interrupts := make(chan os.Signal, 1)
	signal.Notify(interrupts, os.Interrupt, syscall.SIGTERM)
	defer signal.Stop(interrupts)
	go func() {
		<-interrupts
		_ = session.Save()
		fmt.Println("\nCtrl+C. Progress saved.")
		os.Exit(0)
	}()

	scanner := bufio.NewScanner(os.Stdin)
	currentWorld := normalizeWorldChoice(*worldFlag)
	if currentWorld == "" {
		currentWorld = session.State.Player.World
	}
	if currentWorld == "" {
		currentWorld = "home"
	}
	session.State.Player.World = currentWorld
	session.State.Player.Name = ensureName(session.State.Player.Name)

	if codeDataRequested {
		if codeDataOpts.path {
			printCodeDataPath(codeDataOpts.track)
			return
		}
		runCodeDataMaster(scanner, session, codeDataOpts, *noAnimation)
		_ = session.Save()
	}

	for {
		ui.PrintHome()
		cmd := strings.ToLower(strings.TrimSpace(ui.Prompt(scanner, "Laura>")))
		switch cmd {
		case "", "home", "back":
			world := askWorld(scanner)
			if world == "" {
				continue
			}
			switch {
			case world == "master" || runMaster:
				runMasterMix(scanner, session, *noAnimation)
			case world == "code-data":
				runCodeDataMaster(scanner, session, codeDataOptions{}, *noAnimation)
			default:
				runWorld(scanner, session, world, *noAnimation)
			}
		case "help":
			ui.PrintHelp()
		case "stats":
			printStats(session.State, engine)
		case "worlds":
			printWorlds()
		case "quit", "q":
			_ = session.Save()
			return
		case "skip":
			fmt.Println("Skipped.")
			_ = session.Save()
		default:
			if game.IsWorld(cmd) || cmd == "master" || cmd == "code-data" {
				switch cmd {
				case "master":
					runMasterMix(scanner, session, *noAnimation)
				case "code-data":
					runCodeDataMaster(scanner, session, codeDataOptions{}, *noAnimation)
				default:
					runWorld(scanner, session, cmd, *noAnimation)
				}
				continue
			}
			fmt.Println("Unknown command. Type help or worlds.")
		}
		_ = session.Save()
	}
}

func loadState() game.SaveData {
	state, err := game.Load()
	if err != nil {
		return game.SaveData{
			Player:    game.Player{Name: "Coder", HP: 3, Level: 1, World: "home"},
			Completed: map[string]bool{},
		}
	}
	return state
}

func ensureName(name string) string {
	if strings.TrimSpace(name) == "" {
		return "Coder"
	}
	return name
}

func normalizeWorldChoice(raw string) string {
	if raw == "" {
		return ""
	}
	if strings.EqualFold(raw, "master") {
		return "master"
	}
	if isCodeDataChoice(raw) {
		return "code-data"
	}
	if game.IsWorld(raw) {
		return game.NormalizeWorld(raw)
	}
	return ""
}

func isCodeDataChoice(raw string) bool {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "code-data", "codedata", "code/data", "code data", "code data master":
		return true
	default:
		return false
	}
}

func printWorlds() {
	ui.PrintWorlds(game.Worlds)
	fmt.Println("Modes: master, code-data")
}

func askWorld(scanner *bufio.Scanner) string {
	printWorlds()
	raw := strings.TrimSpace(ui.Prompt(scanner, "World ▶"))
	if raw == "" {
		return ""
	}
	if game.IsWorld(raw) {
		return game.NormalizeWorld(raw)
	}
	if raw == "1" || raw == "play" {
		return "all"
	}
	if strings.EqualFold(raw, "master") {
		return "master"
	}
	if isCodeDataChoice(raw) {
		return "code-data"
	}
	fmt.Println("Unknown world. Type worlds or choose 1-13.")
	return ""
}

func runWorld(scanner *bufio.Scanner, session *game.Session, world string, noAnimation bool) {
	session.State.Player.World = world
	for {
		target := game.DifficultyTarget(session.State.Player.Level, session.State.Player.Streak)
		quest, ok := session.Engine.RandomQuestAvoid(world, target, session.State.Completed, session.State.LastWorld, session.State.RecentQuests)
		if !ok {
			if launchWorldTool(world) {
				_ = session.Save()
			} else {
				fmt.Println("No quest available.")
			}
			return
		}
		session.State.LastWorld = quest.World
		fmt.Printf("\n[%s L%d] %s\n", strings.ToUpper(quest.World), quest.Level, quest.Title)
		ui.ThinkingEffect(os.Stdout, noAnimation)
		fmt.Println(quest.Objective)
		fmt.Println("Hint:", quest.Hint)
		answer := strings.TrimSpace(ui.Prompt(scanner, "Answer ▶"))
		if strings.EqualFold(answer, "skip") {
			fmt.Println("Skipped.")
			_ = session.Save()
			continue
		}
		if isGlobalCommand(answer) {
			handleGlobalCommand(answer, scanner, session)
			return
		}
		if game.CheckAnswer(answer, quest) {
			session.MarkCorrect(quest)
			fmt.Println("Correct. ", quest.StoryWin)
		} else {
			session.MarkWrong(quest)
			fmt.Println("Wrong. Hint unlocked.")
			fmt.Printf("Correct answer pattern: %s\n", quest.Answer)
			fmt.Println(quest.StoryFail)
			ui.ThinkingHint(os.Stdout, "Cognitive trace: focus on the minimal rule.", noAnimation)
		}
		_ = session.Save()
		ui.PrintPostQuestPrompt()
		next := strings.ToLower(strings.TrimSpace(ui.Prompt(scanner, "▶")))
		switch next {
		case "0", "quit", "q":
			_ = session.Save()
			os.Exit(0)
		case "4", "home", "back":
			session.State.Player.World = "home"
			return
		case "3", "world", "worlds":
			session.State.Player.World = ""
			return
		case "2", "next":
			continue
		case "1", "retry":
			continue
		default:
			continue
		}
	}
}

func runMasterMix(scanner *bufio.Scanner, session *game.Session, noAnimation bool) {
	worlds := []string{"fullstack", "linux", "bash", "go", "c", "css", "leetcode", "body", "chemistry", "math", "logic", "science"}
	if session.State.Player.World == "home" || session.State.Player.World == "" {
		session.State.Player.World = "master"
	}
	for {
		world := worlds[rand.Intn(len(worlds))]
		quest, ok := session.Engine.RandomQuestAvoid(world, game.DifficultyTarget(session.State.Player.Level, session.State.Player.Streak), session.State.Completed, session.State.LastWorld, session.State.RecentQuests)
		if !ok {
			fmt.Println("Master mix has no quest in", world)
			if !askMasterContinue(scanner, session, noAnimation) {
				return
			}
			continue
		}
		session.State.LastWorld = quest.World
		fmt.Printf("\n[MIX %s L%d] %s\n", strings.ToUpper(quest.World), quest.Level, quest.Title)
		ui.ThinkingEffect(os.Stdout, noAnimation)
		fmt.Println(quest.Objective)
		fmt.Println("Hint:", quest.Hint)
		answer := strings.TrimSpace(ui.Prompt(scanner, "Answer ▶"))
		if isGlobalCommand(answer) {
			handleGlobalCommand(answer, scanner, session)
			return
		}
		if game.CheckAnswer(answer, quest) {
			session.MarkCorrect(quest)
			fmt.Println("Correct. ", quest.StoryWin)
		} else {
			session.MarkWrong(quest)
			fmt.Println("Wrong. Hint unlocked.")
			fmt.Printf("Correct answer pattern: %s\n", quest.Answer)
			fmt.Println(quest.StoryFail)
		}
		_ = session.Save()
		session.State.SeenAudit++
		if session.State.SeenAudit%4 == 0 {
			fmt.Println(session.StatsLine())
			fmt.Println("Audit: keep going or change topic.")
		}
		if !askMasterContinue(scanner, session, noAnimation) {
			return
		}
	}
}

func askMasterContinue(scanner *bufio.Scanner, session *game.Session, noAnimation bool) bool {
	ui.PrintPostQuestPrompt()
	fmt.Println("Master: continue / topic / home / quit")
	next := strings.ToLower(strings.TrimSpace(ui.Prompt(scanner, "▶")))
	switch next {
	case "quit", "q", "0":
		_ = session.Save()
		os.Exit(0)
	case "home", "back", "4":
		session.State.Player.World = "home"
		return false
	case "worlds", "topic", "3":
		return false
	case "skip":
		fmt.Println("Skipped.")
		return true
	case "2", "next", "1", "retry", "":
		return true
	default:
		if !noAnimation {
			ui.ThinkingEffect(os.Stdout, false)
		}
		return true
	}
	return true
}

// codeDataOptions configures a Code/Data Master session from CLI flags.
// A zero value means "mixed, no filter" — the default when entering the
// mode through the home menu.
type codeDataOptions struct {
	track      string
	daily      bool
	weakTopics bool
	review     bool
	path       bool
}

const codeDataDailyRounds = 5

// buildCodeDataOptions turns the raw CLI flags into codeDataOptions and
// reports whether the user asked for Code/Data Master at all (any of
// --mode code-data, --track, --daily, --weak-topics, --review).
func buildCodeDataOptions(mode, track string, daily, weakTopics, review, path bool) (codeDataOptions, bool) {
	requested := strings.EqualFold(strings.TrimSpace(mode), "code-data") || track != "" || daily || weakTopics || review || path
	opts := codeDataOptions{daily: daily, weakTopics: weakTopics, review: review, path: path}
	if game.IsCodeDataTrack(track) {
		opts.track = game.NormalizeTrack(track)
	}
	if opts.path && opts.track == "" {
		opts.track = "go"
	}
	return opts, requested
}

func printCodeDataPath(track string) {
	if track == "" {
		track = "go"
	}
	path, ok := game.LearningPath(track)
	if !ok {
		fmt.Println("No learning path yet for", track)
		fmt.Println("Available mission tracks:", strings.Join(game.CodeDataTracks, ", "))
		return
	}
	fmt.Printf("\n[%s] %s\n", strings.ToUpper(path.Track), path.Title)
	fmt.Println(path.Explanation)
	for _, stage := range path.Stages {
		fmt.Printf("\nL%d - %s\n", stage.Level, stage.Title)
		fmt.Println("Concept:", stage.Concept)
		fmt.Println("Practice:", stage.Practice)
	}
}

// runCodeDataMaster mixes missions across Code/Data Master tracks (DSA, SQL,
// stats, ML, data engineering, system design, Go), modeled on runMasterMix:
// adaptive difficulty, dedup-aware random picks, periodic stats audits, and
// global-command interception, with mission-type-aware presentation and
// answer checking layered on top.
func runCodeDataMaster(scanner *bufio.Scanner, session *game.Session, opts codeDataOptions, noAnimation bool) {
	if session.State.Player.World == "home" || session.State.Player.World == "" {
		session.State.Player.World = "code-data"
	}

	tracks := append([]string(nil), game.CodeDataTracks...)
	if opts.weakTopics {
		tracks = game.WeakTopics(session.State.TopicMaster)
		fmt.Println("Weakest topics first:", strings.Join(tracks, ", "))
		if opts.track == "" && len(tracks) > 0 {
			opts.track = tracks[0]
		}
	}
	if opts.daily {
		fmt.Println("Daily Code/Data Master: a fixed set for today. Come back tomorrow for a new one.")
		rand.Seed(dailySeed())
	}
	if opts.review {
		fmt.Println("Review mode: replaying missions you've already completed.")
	}

	rounds := 0
	for {
		track := opts.track
		if track == "" {
			track = tracks[rand.Intn(len(tracks))]
		}

		var quest game.Quest
		var ok bool
		if opts.review {
			quest, ok = pickReviewQuest(session, track)
		} else {
			target := game.DifficultyTarget(session.State.Player.Level, session.State.Player.Streak)
			quest, ok = session.Engine.RandomTrackQuestAvoid(track, target, session.State.Completed, session.State.LastTopic, session.State.RecentQuests)
		}
		if !ok {
			if opts.review {
				fmt.Println("Nothing to review yet in", track+". Complete a few missions first.")
			} else {
				fmt.Println("No missions available in", track, "yet.")
			}
			if !askCodeDataContinue(scanner, session, noAnimation) {
				return
			}
			continue
		}

		session.State.LastTopic = quest.Track
		if runCodeDataMission(scanner, session, quest, noAnimation) {
			return
		}

		rounds++
		session.State.SeenAudit++
		if session.State.SeenAudit%4 == 0 {
			fmt.Println(session.StatsLine())
		}
		if opts.daily && rounds >= codeDataDailyRounds {
			fmt.Println("Daily set complete.", session.StatsLine())
			_ = session.Save()
			return
		}
		if !askCodeDataContinue(scanner, session, noAnimation) {
			return
		}
	}
}

// runCodeDataMission presents one mission, reads the answer (multiline when
// the mission calls for it), checks it, and applies the usual XP/streak/HP
// mutation via session.MarkCorrect/MarkWrong. It returns true when a global
// command was handled and the caller should exit Code/Data Master entirely.
func runCodeDataMission(scanner *bufio.Scanner, session *game.Session, quest game.Quest, noAnimation bool) bool {
	fmt.Printf("\n[%s L%d] %s\n", strings.ToUpper(quest.Track), quest.Level, quest.Title)
	if label := game.MissionTypeLabel(quest.Type); label != "" {
		fmt.Println("Type:", label)
	}
	ui.ThinkingEffect(os.Stdout, noAnimation)
	fmt.Println(quest.Question)
	for i, choice := range quest.Choices {
		fmt.Printf("  %d) %s\n", i+1, choice)
	}
	fmt.Println("Hint:", quest.Hint)

	var answer string
	if quest.Multiline {
		answer = ui.PromptMultiline(scanner, "Answer ▶")
	} else {
		answer = strings.TrimSpace(ui.Prompt(scanner, "Answer ▶"))
	}
	if strings.EqualFold(strings.TrimSpace(answer), "skip") {
		fmt.Println("Skipped.")
		_ = session.Save()
		return false
	}
	if isGlobalCommand(answer) {
		handleGlobalCommand(answer, scanner, session)
		return true
	}

	if game.CheckCodeDataAnswer(answer, quest) {
		session.MarkCorrect(quest)
		fmt.Println("Correct.", quest.StoryWin)
	} else {
		session.MarkWrong(quest)
		fmt.Println("Not quite.")
		fmt.Printf("Expected: %s\n", quest.Answer)
		fmt.Println(quest.StoryFail)
		ui.ThinkingHint(os.Stdout, "Cognitive trace: read the question again, slowly.", noAnimation)
	}
	if quest.Explanation != "" {
		fmt.Println("Why:", quest.Explanation)
	}
	_ = session.Save()
	return false
}

// pickReviewQuest returns a random already-completed mission from the given
// track, supporting --review (practice missions you've already cleared).
func pickReviewQuest(session *game.Session, track string) (game.Quest, bool) {
	pool := session.Engine.FilterTrack(track)
	candidates := make([]game.Quest, 0, len(pool))
	for _, q := range pool {
		if session.State.Completed[q.ID] {
			candidates = append(candidates, q)
		}
	}
	if len(candidates) == 0 {
		return game.Quest{}, false
	}
	return candidates[rand.Intn(len(candidates))], true
}

func askCodeDataContinue(scanner *bufio.Scanner, session *game.Session, noAnimation bool) bool {
	ui.PrintPostQuestPrompt()
	fmt.Println("Code/Data Master: continue / topic / home / quit")
	next := strings.ToLower(strings.TrimSpace(ui.Prompt(scanner, "▶")))
	switch next {
	case "quit", "q", "0":
		_ = session.Save()
		os.Exit(0)
	case "home", "back", "4":
		session.State.Player.World = "home"
		return false
	case "worlds", "topic", "3":
		return false
	case "skip":
		fmt.Println("Skipped.")
		return true
	case "2", "next", "1", "retry", "":
		return true
	default:
		if !noAnimation {
			ui.ThinkingEffect(os.Stdout, false)
		}
		return true
	}
	return true
}

// dailySeed derives a stable RNG seed from today's date (UTC) so the daily
// Code/Data Master set stays the same all day and changes tomorrow.
func dailySeed() int64 {
	y, m, d := time.Now().UTC().Date()
	return int64(y)*10000 + int64(m)*100 + int64(d)
}

func handleGlobalCommand(cmd string, scanner *bufio.Scanner, session *game.Session) {
	switch strings.ToLower(strings.TrimSpace(cmd)) {
	case "quit", "q":
		_ = session.Save()
		os.Exit(0)
	case "home", "back":
		session.State.Player.World = "home"
	case "stats":
		printStats(session.State, session.Engine)
	case "help":
		ui.PrintHelp()
	case "worlds":
		printWorlds()
	}
	_ = scanner
}

func isGlobalCommand(cmd string) bool {
	switch strings.ToLower(strings.TrimSpace(cmd)) {
	case "home", "back", "quit", "q", "help", "stats", "worlds", "skip":
		return true
	default:
		return false
	}
}

func printStats(state game.SaveData, engine *game.Engine) {
	done := len(state.Completed)
	fmt.Printf("XP %d | Level %d | Streak %d | Completed %d | Worlds %d\n", state.Player.XP, state.Player.Level, state.Player.Streak, done, len(engine.Quests))
}

func launchWorldTool(world string) bool {
	switch world {
	case "crawl":
		fmt.Println("Crawl is external. Install or launch it locally, then come back.")
		return false
	case "snake":
		fmt.Println("Snake is external. Use your local terminal game build, then come back.")
		return false
	case "bandit":
		fmt.Println("Bandit is external. Use the OverTheWire flow, then come back.")
		return false
	default:
		return false
	}
}
