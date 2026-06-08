package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"
)

// ── Palette ANSI ──────────────────────────────────────────────────
const (
	Reset   = "\033[0m"
	Bold    = "\033[1m"
	Dim     = "\033[2m"
	Cyan    = "\033[36m"
	Magenta = "\033[35m"
	Yellow  = "\033[33m"
	Green   = "\033[32m"
	Red     = "\033[31m"
	Blue    = "\033[34m"
	White   = "\033[97m"
)

func c(color, text string) string { return color + text + Reset }
func bold(text string) string     { return Bold + text + Reset }

// ── Data structures ────────────────────────────────────────────────
type Quest struct {
	ID        string `json:"id"`
	World     string `json:"world"`
	Title     string `json:"title"`
	Objective string `json:"objective"`
	Hint      string `json:"hint"`
	Points    int    `json:"reward_points"`
	Penalty   int    `json:"penalty_points"`
	Type      string `json:"type"`
	Expected  string `json:"expected_stdout"`
	Contains  string `json:"expected_contains"`
	Intro     string `json:"story_intro"`
	StoryWin  string `json:"story_success"`
	StoryFail string `json:"story_failure"`
}

type BodyChallenge struct {
	Level    string `json:"level"`
	Question string `json:"question"`
	Answer   string `json:"answer"`
	English  string `json:"english"`
	French   string `json:"french"`
}

type BodyChallengeLevel struct {
	Level string              `json:"level"`
	Items []BodyChallengeItem `json:"items"`
}

type BodyChallengeItem struct {
	English string `json:"english"`
	French  string `json:"french"`
}

type Player struct {
	Name   string
	HP     int
	XP     int
	Level  int
	Streak int
	World  string
}

type GameState struct {
	Player      Player
	Quests      []Quest
	Done        map[string]bool
	QuestIdx    int
	Scanner     *bufio.Scanner
	FailCount   map[string]int
	Ledger      []LedgerEntry
	LastWorld   string
	MasterMode  bool
	MasterIndex int
	AuditIndex  int
}

type LedgerEntry struct {
	QuestID string
	Title   string
	XP      int
	Kind    string
	Note    string
	When    time.Time
}

type TerminalChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type TerminalChatResponse struct {
	Message          TerminalChatMessage `json:"message"`
	Citations        []string            `json:"citations"`
	ThinkingFeedback []string            `json:"thinkingFeedback"`
}

type TerminalBridgeConfig struct {
	BaseURL  string
	Endpoint string
	WebURL   string
	Persona  string
}

// ── Laura's voice ──────────────────────────────────────────────────
var lauraLines = []string{
	"Le flux cosmique passe à travers toi.",
	"Chaque bug est un indice. Chaque erreur, un professeur.",
	"Je vois ton signal. Continue.",
	"Le terminal est ta toile. Peins avec précision.",
	"La syntaxe est la loi ici. La beauté vient après.",
}

func lauraSpeak(msg string) {
	time.Sleep(120 * time.Millisecond)
	fmt.Printf("\n%s %s%s%s\n", c(Magenta, "✦ Laura:"), Dim, msg, Reset)
}

func lauraRandom() {
	lauraSpeak(lauraLines[rand.Intn(len(lauraLines))])
}

func lauraHint(kind string) {
	switch kind {
	case "retry":
		lauraSpeak("Mieux vaut corriger un point que changer de monde. Lis l'erreur puis recommence.")
	case "redirect":
		lauraSpeak("Tu peux garder le rythme. Essaie une autre approche ou change de jeu si tu bloques.")
	case "cafe":
		lauraSpeak("Au cafe, on parle, on simule, on ajuste. Le terminal reste vivant.")
	case "reactive":
		lauraSpeak("La mauvaise réponse ne ferme rien. Elle ouvre juste une autre branche du flux.")
	default:
		lauraSpeak("Le signal est imparfait, mais la voie reste ouverte.")
	}
}

func accountingNote(entry LedgerEntry) string {
	if entry.Kind == "bonus" {
		return fmt.Sprintf("Bonus enregistré: +%d XP", entry.XP)
	}
	if entry.Kind == "fiscal" {
		return fmt.Sprintf("Note comptable: %s", entry.Note)
	}
	return fmt.Sprintf("Victoire enregistrée: +%d XP", entry.XP)
}

func screenAudit(gs *GameState) []string {
	screens := []struct {
		Name   string
		Exists bool
		Detail string
	}{
		{"Start menu", true, "Intro + branches games/body/docs/cafe/master"},
		{"Quest worlds", true, "bash, c, go, fullstack, accounting, leetcode, css, science"},
		{"Body challenges", len(loadBodyChallengesForAudit()) > 0, "public/corps_humain_*.json"},
		{"Docs hub", true, "docs/laura_quest_README.md"},
		{"Cafe scene", true, "Laura + MoltBots discussion"},
		{"Master mode", true, "mixed infinite loop"},
		{"Pricing/web pointer", true, "techandstream.com/quiz_exam.html"},
	}
	var out []string
	for _, s := range screens {
		status := "OK"
		if !s.Exists {
			status = "MISSING"
		}
		out = append(out, fmt.Sprintf("[%s] %s — %s", status, s.Name, s.Detail))
	}
	return out
}

func loadBodyChallengesForAudit() []BodyChallenge {
	var challengePack struct {
		Challenges []BodyChallenge `json:"challenges"`
	}
	_ = readJSONFile(filepath.Join("public", "corps_humain_challenge.json"), &challengePack)
	return challengePack.Challenges
}

func auditGaps(gs *GameState) []string {
	gaps := []string{}
	if len(loadBodyChallengesForAudit()) == 0 {
		gaps = append(gaps, "public/corps_humain_challenge.json")
	}
	if !commandExists("go") {
		gaps = append(gaps, "Go toolchain unavailable")
	}
	if !commandExists("gcc") {
		gaps = append(gaps, "gcc unavailable")
	}
	if !commandExists("bash") {
		gaps = append(gaps, "bash unavailable")
	}
	_ = gs
	return gaps
}

func printAuditPointage(gs *GameState) {
	fmt.Printf("\n%s\n", c(Cyan, "Audit pointage"))
	for _, line := range screenAudit(gs) {
		fmt.Printf("%s\n", c(Dim, " - "+line))
	}
	gaps := auditGaps(gs)
	if len(gaps) == 0 {
		fmt.Printf("%s\n", c(Green, " - Aucun trou bloquant détecté sur les modules actifs"))
	} else {
		fmt.Printf("%s\n", c(Yellow, " - Gaps détectés:"))
		for _, gap := range gaps {
			fmt.Printf("%s\n", c(Dim, "   • "+gap))
		}
	}
	fmt.Printf("%s %d | %s %d | %s %d | %s %d\n",
		c(Yellow, "XP"), gs.Player.XP,
		c(Cyan, "Level"), gs.Player.Level,
		c(Magenta, "Streak"), gs.Player.Streak,
		cBlueWorld(gs.Player.World), len(gs.Ledger),
	)
}

func cBlueWorld(world string) string {
	if world == "" {
		world = "idle"
	}
	return c(Blue, "World:"+strings.ToUpper(world))
}

func retryPrompt(gs *GameState, q Quest) string {
	fmt.Printf("%s\n", c(Cyan, "Choix rapide après l'echec:"))
	fmt.Printf("%s relancer la quete\n", c(Yellow, "[1]"))
	fmt.Printf("%s changer de monde\n", c(Yellow, "[2]"))
	fmt.Printf("%s continuer plus tard\n", c(Yellow, "[3]"))
	answer := strings.ToLower(prompt(gs, "Action ▶"))
	switch answer {
	case "1", "retry", "rejouer":
		lauraHint("reactive")
		return "retry"
	case "2", "switch", "world":
		lauraHint("redirect")
		return "switch"
	default:
		lauraHint("retry")
		return "later"
	}
}

func typewrite(s string, delay time.Duration) {
	for _, ch := range s {
		fmt.Print(string(ch))
		time.Sleep(delay)
	}
	fmt.Println()
}

// ── Banner ─────────────────────────────────────────────────────────
func banner() {
	fmt.Print(Cyan)
	typewrite(`
  ██╗      █████╗ ██╗   ██╗██████╗  █████╗
  ██║     ██╔══██╗██║   ██║██╔══██╗██╔══██╗
  ██║     ███████║██║   ██║██████╔╝███████║
  ██║     ██╔══██║██║   ██║██╔══██╗██╔══██║
  ███████╗██║  ██║╚██████╔╝██║  ██║██║  ██║
  ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝`, 2*time.Millisecond)
	fmt.Print(Reset)
	fmt.Printf("\n%s\n", c(Magenta, "  ✦ Moteur de quêtes terminal — par techandstream.com"))
	fmt.Printf("%s\n\n", c(Dim, "  Persona IA: Laura | github.com/Kvnbbg/Laura"))
}

func bridgeBanner(endpoint string) {
	fmt.Print(Cyan)
	typewrite(`
  ██╗      █████╗ ██╗   ██╗██████╗  █████╗
  ██║     ██╔══██╗██║   ██║██╔══██╗██╔══██╗
  ██║     ███████║██║   ██║██████╔╝███████║
  ██║     ██╔══██║██║   ██║██╔══██╗██╔══██║
  ███████╗██║  ██║╚██████╔╝██║  ██║██║  ██║
  ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝`, 2*time.Millisecond)
	fmt.Print(Reset)
	fmt.Printf("\n%s\n", c(Magenta, "  ✦ Pont terminal Laura"))
	fmt.Printf("%s\n", c(Dim, "  Dialogue rapide pour la web app, les APIs et les flux d'agents."))
	fmt.Printf("%s\n\n", c(Dim, "  Endpoint: "+endpoint))
}

func terminalIntro(mode string) {
	fmt.Printf("%s\n", c(Yellow, "  ASSICI // accueil terminal Laura"))
	fmt.Printf("%s\n", c(Dim, "  Laura est un nom que Kevin Marville a garde parce qu'il sonne humain, simple, doux et memorisable."))
	fmt.Printf("%s\n", c(Dim, "  TechAndStream partage la plateforme avec une logique claire: les usages payants financent la production,"))
	fmt.Printf("%s\n", c(Dim, "  et le niveau free garde l'acces aux learnings, apps, plugins, contenus publics et jeux utiles."))
	if mode == "chat" {
		fmt.Printf("%s\n\n", c(Dim, "  Ici, Laura reste open-source, terminal-first et branchee a un moteur compatible web."))
		return
	}
	fmt.Printf("%s\n\n", c(Dim, "  Ici, Laura reste open-source, terminal-first et t'ouvre ses mondes de quetes sans interface graphique lourde."))
}

func terminalSuggestions(mode string) {
	if mode == "chat" {
		fmt.Printf("%s\n", c(Cyan, "  Suggestions rapides"))
		fmt.Printf("%s\n", c(Dim, "  - Demande un resume pour Moltbook ou french-dev-ai-tools"))
		fmt.Printf("%s\n", c(Dim, "  - Demande une idee de blog, de plugin, de learning track ou de jeu"))
		fmt.Printf("%s\n\n", c(Dim, "  - Commandes: /help /clear /web /quit"))
		return
	}
	fmt.Printf("%s\n", c(Cyan, "  Menu suggere"))
	fmt.Printf("%s\n", c(Dim, "  - bash / c / go / leetcode / css / science"))
	fmt.Printf("%s\n", c(Dim, "  - cafe / crawl / snake / bandit"))
	fmt.Printf("%s\n", c(Dim, "  - fullstack / accounting / word / body"))
	fmt.Printf("%s\n", c(Dim, "  - master / infinite mix mode"))
	fmt.Printf("%s\n", c(Dim, "  - Le premium finance le socle"))
	fmt.Printf("%s\n", c(Dim, "  - Le freemium avec Stripe garde le ride sur les learnings, les jeux utiles et les parcours publics"))
	fmt.Printf("%s\n", c(Dim, "  - Les liens pricing repertorient french-dev-ai-tools, labobinebeatmakerv2 et train-adventures"))
	fmt.Printf("%s\n", c(Dim, "  - Cafe = discussions MoltBots, mini-social, relais d'agents, feedbacks et relances"))
	fmt.Printf("%s\n\n", c(Dim, "  - Choisis un monde, puis laisse Laura guider la suite"))
}

func printGlobalCommands() {
	fmt.Printf("%s\n", c(Dim, "Commandes globales: home / back / quit / stats / help"))
}

// ── HUD ───────────────────────────────────────────────────────────
func hud(p Player) {
	bar := strings.Repeat("█", p.HP/10) + strings.Repeat("░", 10-p.HP/10)
	fmt.Printf("\n%s HP[%s%s%s] XP:%s LVL:%s STREAK:%s WORLD:%s\n",
		c(Dim, "┌─"),
		c(Green, bar), Dim, "]",
		c(Yellow, fmt.Sprintf("%d", p.XP)),
		c(Cyan, fmt.Sprintf("%d", p.Level)),
		c(Magenta, fmt.Sprintf("%d🔥", p.Streak)),
		c(Blue, strings.ToUpper(p.World)),
	)
}

// ── Quest loader ───────────────────────────────────────────────────
func loadQuests() []Quest {
	return []Quest{
		// ── FULLSTACK ─────────────────────────────────────────────
		{
			ID: "fs_001", World: "fullstack", Title: "API Relay",
			Objective: `Name one layer of a typical enterprise fullstack stack: frontend, backend, database, auth, queue, cache, observability, or deployment.`,
			Hint:      "Answer with one or more layers. Free-form is okay.",
			Type:      "quiz", Expected: "backend",
			Points: 16, Penalty: 2,
			Intro:     "Le monde fullstack mélange les couches que rencontre un dev Linux en entreprise et en freelance.",
			StoryWin:  "La pile se structure: API, UI, stockage, sécurité, livraison.",
			StoryFail: "Pas grave. Reviens avec une couche claire, même courte.",
		},
		{
			ID: "fs_002", World: "fullstack", Title: "Language Mixer",
			Objective: `List a programming language you might use in enterprise or freelance on Linux, including uncommon ones.`,
			Hint:      "Examples: Go, PHP, JavaScript, TypeScript, Python, Bash, SQL, Rust, Java, C, Dart, Ruby.",
			Type:      "quiz", Expected: "go",
			Points: 18, Penalty: 2,
			Intro:     "Ici, Laura mélange les langages courants et exceptionnels sans casser le flow.",
			StoryWin:  "Langage accepté. La polyglossie technique ouvre la porte.",
			StoryFail: "Essaie une réponse simple; Laura accepte le mot clé.",
		},
		// ── BASH ──────────────────────────────────────────────────
		{
			ID: "bash_001", World: "bash", Title: "Echo Chamber",
			Objective: `Print exactly: Hello, Laura`,
			Hint:      "Try: echo 'Hello, Laura'",
			Type:      "bash_run", Expected: "Hello, Laura\n",
			Points: 10, Penalty: 2,
			Intro:     "The shell awaits your first incantation.",
			StoryWin:  "The terminal glows. Laura smiles. Your signal is clean.",
			StoryFail: "The echo returns empty. Check your quoting, traveler.",
		},
		{
			ID: "bash_002", World: "bash", Title: "Pipe Master",
			Objective: `Print only lines containing 'star' from: echo -e 'star\nplanet\nstar\nmoon'`,
			Hint:      "Think: echo ... | grep ...",
			Type:      "bash_run", Contains: "star",
			Points: 15, Penalty: 3,
			Intro:     "Pipes connect worlds. Learn to channel the flow.",
			StoryWin:  "The filter works. Only starlight passes through.",
			StoryFail: "Too much noise in the signal. Refine your filter.",
		},
		// ── C ─────────────────────────────────────────────────────
		{
			ID: "c_001", World: "c", Title: "Hello, Kernel",
			Objective: `Write a C program that prints: Hello World`,
			Hint:      "#include <stdio.h> ... printf(\"Hello World\\n\");",
			Type:      "c_compile", Expected: "Hello World\n",
			Points: 20, Penalty: 4,
			Intro:     "The C chamber. The compiler is a stern guardian here.",
			StoryWin:  "Clean compile. The kernel nods. Gate opens.",
			StoryFail: "The compiler speaks in riddles. Inspect the syntax sigils.",
		},
		{
			ID: "c_002", World: "c", Title: "Loop Forge",
			Objective: `Print numbers 1 to 5, one per line`,
			Hint:      "for(int i=1; i<=5; i++) printf(\"%d\\n\", i);",
			Type:      "c_compile", Expected: "1\n2\n3\n4\n5\n",
			Points: 25, Penalty: 5,
			Intro:     "Loops are the heartbeat of programs. Find the rhythm.",
			StoryWin:  "The sequence flows. Laura claps — quietly, cosmically.",
			StoryFail: "The loop stumbles. Off-by-one? Check your bounds.",
		},
		// ── GO ────────────────────────────────────────────────────
		{
			ID: "go_001", World: "go", Title: "Go Signal",
			Objective: `Write a Go program that prints: ready`,
			Hint:      `package main\nimport "fmt"\nfunc main(){fmt.Println("ready")}`,
			Type:      "go_run", Expected: "ready\n",
			Points: 20, Penalty: 4,
			Intro:     "In the Go sector, clarity is power. Small. Explicit. Direct.",
			StoryWin:  "Signal green. Your Go program runs like starlight.",
			StoryFail: "The module is confused. Did you set package main?",
		},
		// ── LEETCODE-STYLE (bash logic) ────────────────────────────
		{
			ID: "leet_001", World: "leetcode", Title: "FizzBuzz Terminal",
			Objective: `Print FizzBuzz from 1-15 in bash (Fizz=3, Buzz=5, FizzBuzz=15)`,
			Hint:      "for i in $(seq 1 15); do ... modulo with $((i%3)); done",
			Type:      "bash_run", Contains: "FizzBuzz",
			Points: 30, Penalty: 6,
			Intro:     "The classic challenge, forged in shell fire.",
			StoryWin:  "FizzBuzz achieved. The ancient rite is complete.",
			StoryFail: "The numbers resist. Check your modulo logic.",
		},
		// ── CSS THEORY (quiz) ─────────────────────────────────────
		{
			ID: "css_001", World: "css", Title: "Box Model Oracle",
			Objective: `What property controls the space INSIDE an element, between content and border?`,
			Hint:      "It's not margin. It wraps the content directly.",
			Type:      "quiz", Expected: "padding",
			Points: 10, Penalty: 1,
			Intro:     "CSS — where invisible forces shape visible worlds.",
			StoryWin:  "Correct. The box model yields its secret.",
			StoryFail: "Not quite. Think inward, not outward.",
		},
		{
			ID: "css_002", World: "css", Title: "Flexbox Riddle",
			Objective: `Which CSS value of 'display' enables flexbox layout?`,
			Hint:      "One word. Starts with 'f'.",
			Type:      "quiz", Expected: "flex",
			Points: 10, Penalty: 1,
			Intro:     "Flexbox changed the web. Name its activation word.",
			StoryWin:  "Flex. The layout engine awakens.",
			StoryFail: "Close — but not the activation word.",
		},
		// ── SCIENCE QUIZ ──────────────────────────────────────────
		{
			ID: "sci_001", World: "science", Title: "Big O Whisper",
			Objective: `What is the Big O complexity of binary search?`,
			Hint:      "It halves the search space each time. log of something.",
			Type:      "quiz", Expected: "o(log n)",
			Points: 20, Penalty: 3,
			Intro:     "Complexity theory — the physics of algorithms.",
			StoryWin:  "O(log n). Efficient. Elegant. Laura nods.",
			StoryFail: "Think about how many steps it takes to find one item.",
		},
		{
			ID: "sci_002", World: "science", Title: "Network Layer",
			Objective: `Which OSI layer handles IP addressing?`,
			Hint:      "Layer 3. One word.",
			Type:      "quiz", Expected: "network",
			Points: 15, Penalty: 2,
			Intro:     "The OSI model — the anatomy of communication.",
			StoryWin:  "Network layer. Packets find their path.",
			StoryFail: "Not that layer. Think routing and addressing.",
		},
		// ── ACCOUNTING ────────────────────────────────────────────
		{
			ID: "acc_001", World: "accounting", Title: "Revenue Gate",
			Objective: `What is the simplest meaning of revenue?`,
			Hint:      "Money in from sales or services.",
			Type:      "quiz", Expected: "income",
			Points: 14, Penalty: 2,
			Intro:     "Les quêtes réussies alimentent un mini-ledger: XP, bonus, marge, et traces comptables lisibles.",
			StoryWin:  "Revenue recognized. The ledger stays honest.",
			StoryFail: "Rappelle-toi la base: l'argent entrant, pas la dépense.",
		},
		{
			ID: "acc_002", World: "accounting", Title: "Cost Shield",
			Objective: `What do we call money spent to run the product?`,
			Hint:      "Think operating cost / expense.",
			Type:      "quiz", Expected: "expense",
			Points: 14, Penalty: 2,
			Intro:     "Laura relie succès, coûts, pricing et durabilité du socle.",
			StoryWin:  "Expense tracked. The economics remain readable.",
			StoryFail: "Pense à la sortie d'argent qui soutient le service.",
		},
		// ── CAFE / MOLTBOTS ───────────────────────────────────────
		{
			ID: "cafe_001", World: "cafe", Title: "Discussion au cafe",
			Objective: `Ecoute la discussion Laura / MoltBots puis choisis qui relancer.`,
			Hint:      "Observe le dialogue, puis tape 1, 2 ou 3.",
			Type:      "cafe_scene", Expected: "1",
			Points: 12, Penalty: 1,
			Intro:     "Le cafe est plein de signaux: Laura, les MoltBots, et une table de travail qui decide de la suite.",
			StoryWin:  "La discussion relance le flux. Le mini-social garde le rythme sans bruit inutile.",
			StoryFail: "Le cafe ne se fige pas. Reprends la discussion et relance un bot avec clarté.",
		},
	}
}

func readJSONFile(path string, out any) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, out)
}

func loadBodyChallenges() ([]BodyChallenge, []BodyChallengeLevel) {
	var challengePack struct {
		Role       string          `json:"role"`
		Challenges []BodyChallenge `json:"challenges"`
	}
	var trainingPack struct {
		Role   string               `json:"role"`
		Levels []BodyChallengeLevel `json:"levels"`
	}

	_ = readJSONFile(filepath.Join("public", "corps_humain_challenge.json"), &challengePack)
	_ = readJSONFile(filepath.Join("public", "corps_humain_training.json"), &trainingPack)
	return challengePack.Challenges, trainingPack.Levels
}

func chooseFromSlice(gs *GameState, title string, options []string) string {
	fmt.Printf("\n%s\n", c(Cyan, title))
	for i, opt := range options {
		fmt.Printf("  %s %s\n", c(Yellow, fmt.Sprintf("[%d]", i+1)), opt)
	}
	return prompt(gs, "Choose ▶")
}

func normalizeForMatch(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	replacer := strings.NewReplacer(
		"à", "a", "á", "a", "â", "a", "ä", "a",
		"ç", "c",
		"é", "e", "è", "e", "ê", "e", "ë", "e",
		"î", "i", "ï", "i",
		"ô", "o", "ö", "o",
		"ù", "u", "û", "u", "ü", "u",
		"œ", "oe",
		"’", "'", "-", " ", "_", " ",
	)
	s = replacer.Replace(s)
	s = strings.Map(func(r rune) rune {
		switch {
		case r >= 'a' && r <= 'z':
			return r
		case r >= '0' && r <= '9':
			return r
		case r == ' ':
			return r
		default:
			return -1
		}
	}, s)
	return strings.Join(strings.Fields(s), " ")
}

func answerAccepted(input string, expected string, accepted ...string) bool {
	normalizedInput := normalizeForMatch(input)
	normalizedExpected := normalizeForMatch(expected)
	if normalizedInput == normalizedExpected || strings.Contains(normalizedInput, normalizedExpected) {
		return true
	}
	for _, a := range accepted {
		n := normalizeForMatch(a)
		if normalizedInput == n || strings.Contains(normalizedInput, n) {
			return true
		}
	}
	return false
}

func runBodyChallenge(gs *GameState) {
	challenges, levels := loadBodyChallenges()
	if len(challenges) == 0 && len(levels) == 0 {
		fmt.Printf("%s\n", c(Dim, "Aucun contenu corps humain disponible pour l'instant."))
		return
	}

	fmt.Printf("%s\n", c(Cyan, "Corps humain"))
	fmt.Printf("%s\n", c(Dim, "Une rampe de vocabulaire, de mémorisation et de mots à trouver issue de public/corps_humain_*.json"))
	fmt.Printf("%s\n", c(Dim, "Choisis: easy, medium, hard, word, or enter to let Laura pick."))
	choice := strings.ToLower(strings.TrimSpace(prompt(gs, "Mode ▶")))

	if choice == "word" {
		runWordHuntChallenge(gs)
		return
	}

	if len(levels) > 0 {
		var levelIdx int
		switch choice {
		case "2", "medium":
			levelIdx = 1
		case "3", "hard":
			levelIdx = 2
		default:
			levelIdx = 0
		}
		if levelIdx >= len(levels) {
			levelIdx = len(levels) - 1
		}
		level := levels[levelIdx]
		if len(level.Items) > 0 {
			item := level.Items[rand.Intn(len(level.Items))]
			fmt.Printf("%s %s → %s ?\n", c(Magenta, "Laura:"), item.English, c(Cyan, "traduction française"))
			answer := prompt(gs, "Réponse ▶")
			if answerAccepted(answer, item.French, item.English) {
				lauraSpeak("Bien joué. La mémoire avance sans friction.")
				gs.Player.XP += 8 + (levelIdx * 4)
				gs.Player.Streak++
				return
			}
			lauraSpeak("Pas grave. Reprends le tableau et teste à nouveau.")
			fmt.Printf("%s %s\n", c(Dim, "Réponse attendue:"), item.French)
			fmt.Printf("%s %s\n", c(Dim, "Réponse rapide acceptée:"), strings.Join([]string{
				item.French,
				strings.ToUpper(item.French),
				strings.ReplaceAll(item.English, " ", "-"),
			}, " / "))
			return
		}
	}

	if len(challenges) > 0 {
		q := challenges[rand.Intn(len(challenges))]
		fmt.Printf("%s %s\n", c(Magenta, "Laura:"), q.Question)
		answer := prompt(gs, "Réponse ▶")
		if answerAccepted(answer, q.Answer, q.French, q.English) {
			lauraSpeak("Exact. Le vocabulaire est calé.")
			gs.Player.XP += 10
			gs.Player.Streak++
			return
		}
		lauraSpeak("Pas encore. Regarde la paire anglais/français et recommence.")
		fmt.Printf("%s %s\n", c(Dim, "Réponse attendue:"), q.French)
		fmt.Printf("%s %s\n", c(Dim, "Astuce:"), c(Cyan, "tu peux répondre en français, en anglais, ou en mot-clé court."))
	}
}

func runDocsSpotlight(gs *GameState) {
	_ = gs
	fmt.Printf("%s\n", c(Cyan, "Docs Laura"))
	fmt.Printf("%s\n", c(Dim, "Le hub lit aussi les notes de route, le README terminal, et les contenus connectés à /docs."))
	fmt.Printf("%s\n", c(Dim, "Points d'entrée utiles:"))
	fmt.Printf("%s\n", c(Yellow, " - docs/laura_quest_README.md"))
	fmt.Printf("%s\n", c(Yellow, " - public/corps_humain_challenge.json"))
	fmt.Printf("%s\n", c(Yellow, " - public/corps_humain_training.json"))
	fmt.Printf("%s\n", c(Yellow, " - README.md"))
	fmt.Printf("%s\n", c(Dim, "Laura peut ensuite basculer vers les mondes de quêtes, le chat, ou les jeux terminal."))
}

func runWordHuntChallenge(gs *GameState) {
	clues := []struct {
		Clue     string
		Answer   string
		Accepted []string
		Reward   int
	}{
		{Clue: "Mot lié au coeur et au mouvement du corps", Answer: "cœur", Accepted: []string{"coeur", "heart"}, Reward: 12},
		{Clue: "Mot lié au réseau et au chemin des paquets", Answer: "network", Accepted: []string{"reseau", "réseau", "route"}, Reward: 14},
		{Clue: "Mot lié à la mémoire du terminal", Answer: "cache", Accepted: []string{"memoire", "mémoire", "cache"}, Reward: 11},
		{Clue: "Mot lié à l'espace intérieur d'une box CSS", Answer: "padding", Accepted: []string{"rembourrage", "interieur", "intérieur"}, Reward: 10},
		{Clue: "Mot lié à la répétition d'une action utile", Answer: "streak", Accepted: []string{"serie", "série", "routine"}, Reward: 9},
	}
	clue := clues[rand.Intn(len(clues))]
	fmt.Printf("%s %s\n", c(Magenta, "Laura:"), c(Dim, "Mot à trouver"))
	fmt.Printf("%s %s\n", c(Cyan, "Indice:"), clue.Clue)
	answer := prompt(gs, "Mot ▶")
	if answerAccepted(answer, clue.Answer, clue.Accepted...) {
		lauraSpeak("Trouvé. Le mot s'ouvre.")
		gs.Player.XP += clue.Reward
		gs.Player.Streak++
		return
	}
	lauraSpeak("Pas encore. Essaie une autre lecture du signal.")
	fmt.Printf("%s %s\n", c(Dim, "Réponse attendue:"), clue.Answer)
	fmt.Printf("%s %s\n", c(Dim, "Réponses rapides:"), strings.Join(append([]string{clue.Answer}, clue.Accepted...), " / "))
}

func runGameSpotlight(gs *GameState) {
	choices := []string{"crawl", "snake", "bandit"}
	answer := chooseFromSlice(gs, "Jeux terminal", choices)
	switch strings.ToLower(strings.TrimSpace(answer)) {
	case "1", "crawl":
		gs.Player.World = "crawl"
		if !launchWorldTool(gs, "crawl") {
			lauraSpeak("Crawl n'est pas installé. Reviens au hub ou choisis un autre jeu.")
		}
	case "2", "snake":
		gs.Player.World = "snake"
		if !launchWorldTool(gs, "snake") {
			lauraSpeak("Snake n'est pas installé. Reviens au hub ou choisis un autre jeu.")
		}
	case "3", "bandit":
		gs.Player.World = "bandit"
		if !launchWorldTool(gs, "bandit") {
			lauraSpeak("Bandit n'est pas installé. Reviens au hub ou choisis un autre jeu.")
		}
	default:
		lauraHint("redirect")
	}
}

func startPointMenu(gs *GameState) string {
	choices := []string{
		"Jeux terminal",
		"Corps humain challenge",
		"Docs Laura",
		"Cafe MoltBots",
		"Master mix",
		"Passer au hub complet",
	}
	answer := chooseFromSlice(gs, "Start point menu", choices)
	switch strings.ToLower(strings.TrimSpace(answer)) {
	case "1", "jeux terminal", "games":
		return "games"
	case "2", "corps humain challenge", "body", "training":
		return "body"
	case "3", "docs laura", "docs":
		return "docs"
	case "4", "cafe", "cafe moltbots":
		return "cafe"
	case "5", "master", "master mix":
		return "master"
	default:
		return "hub"
	}
}

func questCategory(q Quest) string {
	switch q.World {
	case "bash", "c", "go", "fullstack", "accounting":
		return "code"
	case "leetcode", "css", "science", "body":
		return "quiz"
	case "cafe":
		return "scene"
	default:
		return "misc"
	}
}

func masterPool(quests []Quest, done map[string]bool, lastWorld string) []Quest {
	var pool []Quest
	for _, q := range quests {
		if done[q.ID] {
			continue
		}
		if lastWorld != "" && q.World == lastWorld && len(quests) > 1 {
			continue
		}
		pool = append(pool, q)
	}
	if len(pool) == 0 {
		for _, q := range quests {
			if !done[q.ID] {
				pool = append(pool, q)
			}
		}
	}
	return pool
}

func masterNextQuest(gs *GameState) *Quest {
	pool := masterPool(gs.Quests, gs.Done, gs.LastWorld)
	if len(pool) == 0 {
		return nil
	}
	order := []string{"code", "quiz", "scene", "misc"}
	var preferred []Quest
	target := order[gs.MasterIndex%len(order)]
	for _, q := range pool {
		if questCategory(q) == target {
			preferred = append(preferred, q)
		}
	}
	if len(preferred) == 0 {
		preferred = pool
	}
	q := preferred[rand.Intn(len(preferred))]
	gs.MasterIndex++
	gs.LastWorld = q.World
	return &q
}

func runMasterMode(gs *GameState) {
	gs.MasterMode = true
	lauraSpeak("Mode master activé. Je mélange quiz, code, scènes et jeux dans un enchaînement continu.")
	round := 0
	for {
		round++
		fmt.Printf("\n%s %d\n", c(Cyan, "Master round"), round)
		q := masterNextQuest(gs)
		if q == nil {
			fmt.Printf("%s\n", c(Green, "Toutes les quêtes du mix ont été traversées. Laura recommence le cycle."))
			gs.Done = make(map[string]bool)
			lauraRandom()
			continue
		}
		runQuest(gs, *q)

		if round%4 == 0 {
			fmt.Printf("\n%s\n", c(Dim, "Checkpoint master:"))
			printAuditPointage(gs)
			choice := prompt(gs, "Master ▶ [enter]=continue / q=quit / docs / cafe / games")
			switch strings.ToLower(strings.TrimSpace(choice)) {
			case "q", "quit":
				lauraSpeak("Sortie du mode master. Le signal reste mémorisé.")
				return
			case "docs":
				runDocsSpotlight(gs)
			case "cafe":
				gs.Player.World = "cafe"
				runQuest(gs, Quest{
					ID: "cafe_001", World: "cafe", Title: "Discussion au cafe",
					Objective: `Ecoute la discussion Laura / MoltBots puis choisis qui relancer.`,
					Hint:      "Observe le dialogue, puis tape 1, 2 ou 3.",
					Type:      "cafe_scene", Expected: "1",
					Points: 12, Penalty: 1,
					Intro:     "Le cafe est plein de signaux: Laura, les MoltBots, et une table de travail qui decide de la suite.",
					StoryWin:  "La discussion relance le flux. Le mini-social garde le rythme sans bruit inutile.",
					StoryFail: "Le cafe ne se fige pas. Reprends la discussion et relance un bot avec clarté.",
				})
			case "games":
				runGameSpotlight(gs)
			}
		}

		if gs.Player.HP <= 0 {
			fmt.Printf("\n%s\n", c(Red, "── GAME OVER ──"))
			lauraSpeak("Le master continue: ton état revient, le flux reprend.")
			gs.Player.HP = 100
		}
		saveGame(gs)
	}
}

// ── Input helper ───────────────────────────────────────────────────
func prompt(gs *GameState, label string) string {
	fmt.Printf("%s ", c(Cyan, label))
	gs.Scanner.Scan()
	return strings.TrimSpace(gs.Scanner.Text())
}

func multilinePrompt(gs *GameState) string {
	fmt.Printf("%s\n%s\n",
		c(Dim, "(type your code, end with a line containing only '---')"),
		c(Cyan, "▶"),
	)
	var lines []string
	for gs.Scanner.Scan() {
		line := gs.Scanner.Text()
		if line == "---" {
			break
		}
		lines = append(lines, line)
	}
	return strings.Join(lines, "\n")
}

// ── Validators ─────────────────────────────────────────────────────
func runBash(code string) (string, error) {
	f, err := os.CreateTemp("", "laura-*.sh")
	if err != nil {
		return "", err
	}
	defer os.Remove(f.Name())
	f.WriteString(code)
	f.Close()
	out, err := exec.Command("bash", f.Name()).Output()
	return string(out), err
}

func runC(code string) (string, error) {
	dir, _ := os.MkdirTemp("", "laura-c-*")
	defer os.RemoveAll(dir)
	src := filepath.Join(dir, "main.c")
	bin := filepath.Join(dir, "main")
	os.WriteFile(src, []byte(code), 0644)
	if out, err := exec.Command("gcc", src, "-O2", "-o", bin).CombinedOutput(); err != nil {
		return "", fmt.Errorf("compile error:\n%s", string(out))
	}
	out, err := exec.Command(bin).Output()
	return string(out), err
}

func runGo(code string) (string, error) {
	dir, _ := os.MkdirTemp("", "laura-go-*")
	defer os.RemoveAll(dir)
	src := filepath.Join(dir, "main.go")
	os.WriteFile(src, []byte(code), 0644)
	out, err := exec.Command("go", "run", src).Output()
	return string(out), err
}

func commandExists(name string) bool {
	_, err := exec.LookPath(name)
	return err == nil
}

func launchCommand(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func resolveEndpoint(baseURL, endpoint string) string {
	endpoint = strings.TrimSpace(endpoint)
	baseURL = strings.TrimSpace(baseURL)
	if endpoint == "" {
		endpoint = "/api/chat"
	}
	if strings.HasPrefix(endpoint, "http://") || strings.HasPrefix(endpoint, "https://") {
		return endpoint
	}
	if baseURL == "" {
		baseURL = "http://localhost:4000"
	}
	return strings.TrimRight(baseURL, "/") + "/" + strings.TrimLeft(endpoint, "/")
}

func terminalSystemPrompt(webURL string, persona string) string {
	if persona == "" {
		persona = "Laura est une compagne IA professionnelle avec une tonalité de rêve cosmique. Elle est conçue pour techandstream.com, sait parler clairement aux développeurs comme aux non-développeurs, peut animer des jeux terminal, et se brancher sur n'importe quelle application web via l'endpoint configuré."
	}

	extra := []string{
		persona,
		"Sois concise, pratique et directe.",
		"Si l'utilisateur demande du code, propose des extraits prêts à lancer.",
		"Si l'utilisateur parle d'un site ou d'une app, adapte-toi au contexte web actuel.",
	}
	if webURL != "" {
		extra = append(extra, "Surface web principale: "+webURL)
	}
	extra = append(extra, "Fais un clin d'œil à l'activité Moltbook de french-dev-ai-tools quand la demande touche l'écosystème Laura.")

	return strings.Join(extra, " ")
}

func fetchTerminalChat(endpoint string, messages []TerminalChatMessage) (TerminalChatResponse, error) {
	payload, err := json.Marshal(map[string]any{
		"messages": messages,
	})
	if err != nil {
		return TerminalChatResponse{}, err
	}

	req, err := http.NewRequest(http.MethodPost, endpoint, bytes.NewReader(payload))
	if err != nil {
		return TerminalChatResponse{}, err
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 90 * time.Second}
	res, err := client.Do(req)
	if err != nil {
		return TerminalChatResponse{}, err
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return TerminalChatResponse{}, err
	}
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return TerminalChatResponse{}, fmt.Errorf("chat endpoint returned %s: %s", res.Status, strings.TrimSpace(string(body)))
	}

	var parsed TerminalChatResponse
	if err := json.Unmarshal(body, &parsed); err != nil {
		return TerminalChatResponse{}, err
	}
	if parsed.Message.Content == "" {
		return TerminalChatResponse{}, fmt.Errorf("chat endpoint returned an empty response")
	}

	return parsed, nil
}

func printThinkingFeedback(label string, items []string) {
	if len(items) == 0 {
		items = []string{
			"Signal recu",
			"Contexte trie",
			"Reponse compacte en preparation",
		}
	}

	if label == "" {
		label = "Laura reflechit:"
	}
	fmt.Printf("%s\n", c(Dim, label))
	for _, item := range items {
		fmt.Printf("%s %s\n", c(Cyan, "·"), c(Dim, item))
		time.Sleep(120 * time.Millisecond)
	}
}

func runTerminalBridge(baseURL, endpoint, webURL, persona string) {
	finalEndpoint := resolveEndpoint(baseURL, endpoint)
	bridgeBanner(finalEndpoint)
	terminalIntro("chat")

	messages := []TerminalChatMessage{
		{
			Role:    "system",
			Content: terminalSystemPrompt(webURL, persona),
		},
	}

	scanner := bufio.NewScanner(os.Stdin)
	terminalSuggestions("chat")
	fmt.Printf("%s\n", c(Dim, "Commandes: /help /clear /quit /web"))

	for {
		fmt.Printf("%s ", c(Cyan, "Laura>"))
		if !scanner.Scan() {
			fmt.Println()
			return
		}

		input := strings.TrimSpace(scanner.Text())
		if input == "" {
			continue
		}

		switch strings.ToLower(input) {
		case "/quit", "/exit", "quit", "exit":
			lauraSpeak("Le pont se ferme, mais le signal reste.")
			return
		case "/clear":
			messages = messages[:1]
			fmt.Printf("%s\n", c(Dim, "Conversation effacée."))
			continue
		case "/help":
			fmt.Printf("%s\n", c(Dim, "Écris simplement pour parler. Commandes: /clear, /web, /quit"))
			continue
		case "/web":
			if webURL != "" {
				fmt.Printf("%s %s\n", c(Dim, "Surface web:"), c(Blue, webURL))
			} else {
				fmt.Printf("%s\n", c(Dim, "Aucune surface web configurée. Définis LAURA_WEB_URL si nécessaire."))
			}
			continue
		}

		messages = append(messages, TerminalChatMessage{Role: "user", Content: input})
		printThinkingFeedback("Laura reflechit:", nil)

		reply, err := fetchTerminalChat(finalEndpoint, messages)
		if err != nil {
			fmt.Printf("%s %s\n", c(Red, "Erreur du pont:"), err.Error())
			continue
		}

		messages = append(messages, reply.Message)
		if len(reply.ThinkingFeedback) > 0 {
			printThinkingFeedback("Signaux retenus:", reply.ThinkingFeedback)
		}
		fmt.Printf("\n%s %s\n", c(Magenta, "Laura:"), reply.Message.Content)
		if len(reply.Citations) > 0 {
			fmt.Printf("%s %s\n", c(Dim, "Sources:"), strings.Join(reply.Citations, " | "))
		}
	}
}

// ── Quest runner ───────────────────────────────────────────────────
func runQuest(gs *GameState, q Quest) bool {
	fmt.Printf("\n%s %s\n", c(Yellow, "⚔"), bold(q.Title))
	fmt.Printf("%s %s\n", c(Dim, "World:"), c(Blue, strings.ToUpper(q.World)))
	lauraSpeak(q.Intro)
	fmt.Printf("\n%s\n%s\n", c(White, "Objective:"), c(Cyan, q.Objective))
	fmt.Printf("%s %s\n\n", c(Dim, "Hint →"), c(Dim, q.Hint))

	var result string
	var err error

	switch q.Type {
	case "quiz":
		answer := strings.ToLower(prompt(gs, "Your answer ▶"))
		expected := strings.ToLower(q.Expected)
		if answer == expected || strings.Contains(answer, expected) {
			result = q.Expected
			err = nil
		} else {
			result = answer
			err = fmt.Errorf("wrong answer")
		}

	case "cafe_scene":
		fmt.Println(c(Dim, "Cafe scene:"))
		fmt.Println(c(Magenta, "Laura: Je garde la voix principale et j'ouvre le chemin."))
		fmt.Println(c(Cyan, "Artisan / Forgeron: Je peux forger un template, un blog ou un plugin."))
		fmt.Println(c(Cyan, "Barde Audio: Je peux transformer le signal en ambiance ou en feedback."))
		fmt.Println(c(Cyan, "Éclaireur API: Je peux relier le flux au monde web sans fuite inutile."))
		fmt.Println()
		fmt.Println(c(Dim, "Choisis une relance:"))
		fmt.Println(c(Yellow, "[1] Laura"))
		fmt.Println(c(Yellow, "[2] MoltBot"))
		fmt.Println(c(Yellow, "[3] Quitter la table"))
		answer := strings.ToLower(prompt(gs, "Cafe ▶"))
		expected := strings.ToLower(q.Expected)
		if answer == expected {
			result = q.Expected
			err = nil
		} else {
			result = answer
			err = fmt.Errorf("wrong cafe choice")
		}

	case "bash_run":
		fmt.Printf("%s\n", c(Dim, "Write your bash command/script:"))
		code := multilinePrompt(gs)
		result, err = runBash(code)

	case "c_compile":
		fmt.Printf("%s\n", c(Dim, "Write your C code (include headers):"))
		code := multilinePrompt(gs)
		result, err = runC(code)

	case "go_run":
		fmt.Printf("%s\n", c(Dim, "Write your Go code:"))
		code := multilinePrompt(gs)
		result, err = runGo(code)
	}

	// Evaluate
	success := false
	if err == nil {
		if q.Expected != "" {
			success = strings.TrimSpace(result) == strings.TrimSpace(q.Expected)
		} else if q.Contains != "" {
			success = strings.Contains(result, q.Contains)
		} else {
			success = true
		}
	}

	if success {
		fmt.Printf("\n%s\n", c(Green, "✓ SUCCESS"))
		lauraSpeak(q.StoryWin)
		gs.Player.XP += q.Points
		gs.Player.Streak++
		gs.Ledger = append(gs.Ledger, LedgerEntry{
			QuestID: q.ID,
			Title:   q.Title,
			XP:      q.Points,
			Kind:    "win",
			Note:    "quest completed",
			When:    time.Now(),
		})
		fmt.Printf("%s %s\n", c(Dim, "Ledger:"), c(Cyan, accountingNote(gs.Ledger[len(gs.Ledger)-1])))
		if gs.Player.Streak%3 == 0 {
			gs.Player.Level++
			fmt.Printf("%s Level up! → %s\n", c(Yellow, "★"), c(Yellow, fmt.Sprintf("LVL %d", gs.Player.Level)))
		}
		gs.Done[q.ID] = true
		return true
	}

	fmt.Printf("\n%s\n", c(Red, "✗ FAIL"))
	if err != nil {
		fmt.Printf("%s %s\n", c(Dim, "Error:"), c(Red, err.Error()))
	}
	if gs.FailCount == nil {
		gs.FailCount = make(map[string]int)
	}
	gs.FailCount[q.ID]++
	switch {
	case q.Type == "cafe_scene":
		lauraHint("cafe")
	case gs.FailCount[q.ID] == 1:
		lauraHint("retry")
	case gs.FailCount[q.ID] >= 2:
		lauraHint("redirect")
	default:
		lauraHint("")
	}
	lauraSpeak(q.StoryFail)
	gs.Player.HP -= q.Penalty * 5
	gs.Player.Streak = 0
	if gs.Player.HP <= 0 {
		gs.Player.HP = 0
	}

	if gs.Player.HP > 0 {
		switch retryPrompt(gs, q) {
		case "retry":
			return runQuest(gs, q)
		case "switch":
			return false
		}
	}

	return false
}

// ── World selector ─────────────────────────────────────────────────
func chooseWorld(gs *GameState) (string, bool) {
	worlds := []string{"bash", "c", "go", "fullstack", "accounting", "leetcode", "css", "science", "cafe", "crawl", "snake", "bandit", "all"}
	fmt.Printf("\n%s\n", c(Cyan, "Choose your world:"))
	for i, w := range worlds {
		fmt.Printf("  %s %s\n", c(Yellow, fmt.Sprintf("[%d]", i+1)), strings.ToUpper(w))
	}
	choice := prompt(gs, "World ▶")
	if choice == "" {
		return "", false
	}
	for i, w := range worlds {
		if choice == fmt.Sprintf("%d", i+1) || strings.EqualFold(choice, w) {
			return w, true
		}
	}
	fmt.Printf("%s\n", c(Red, "Choix invalide. Recommence."))
	return "", false
}

func launchWorldTool(gs *GameState, world string) bool {
	switch world {
	case "crawl", "snake", "bandit":
		if !commandExists(world) {
			fmt.Printf("%s %s\n", c(Dim, "Commande indisponible:"), c(Yellow, world))
			lauraSpeak("Installe le jeu localement ou reviens au hub Laura pour une alternative terminal.")
			return false
		}
		lauraSpeak("Je laisse le jeu s'ouvrir dans ton terminal.")
		if err := launchCommand(world); err != nil {
			fmt.Printf("%s %s\n", c(Red, "Erreur jeu:"), err.Error())
			return false
		}
		lauraHint("reactive")
		return true
	}
	return false
}

func unavailableWorldFallback(world string) bool {
	switch world {
	case "crawl", "snake", "bandit":
		return true
	default:
		return false
	}
}

// ── Save / load (simple JSON) ──────────────────────────────────────
func savePath() string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".laura-quest-save.json")
}

func saveGame(gs *GameState) {
	data, _ := json.Marshal(struct {
		Player Player
		Done   map[string]bool
	}{gs.Player, gs.Done})
	os.WriteFile(savePath(), data, 0644)
	fmt.Printf("%s\n", c(Dim, "Progress saved."))
}

func loadGame(gs *GameState) bool {
	data, err := os.ReadFile(savePath())
	if err != nil {
		return false
	}
	var save struct {
		Player Player
		Done   map[string]bool
	}
	if json.Unmarshal(data, &save) == nil {
		gs.Player = save.Player
		gs.Done = save.Done
		return true
	}
	return false
}

// ── Main loop ──────────────────────────────────────────────────────
func main() {
	rand.Seed(time.Now().UnixNano())
	modeFlag := flag.String("mode", "", "Run mode: quest or chat")
	endpointFlag := flag.String("endpoint", "", "Chat endpoint override")
	baseURLFlag := flag.String("base-url", "", "Base URL used to resolve relative endpoints")
	webURLFlag := flag.String("web", "", "Primary web surface URL to reference in chat mode")
	personaFlag := flag.String("persona", "", "Override Laura persona prompt")
	flag.Parse()

	mode := strings.ToLower(strings.TrimSpace(*modeFlag))
	if mode == "" && flag.NArg() > 0 {
		mode = strings.ToLower(strings.TrimSpace(flag.Arg(0)))
	}

	if mode == "chat" || mode == "bridge" {
		runTerminalBridge(*baseURLFlag, *endpointFlag, *webURLFlag, *personaFlag)
		return
	}

	interrupts := make(chan os.Signal, 1)
	signal.Notify(interrupts, os.Interrupt, syscall.SIGTERM)
	defer signal.Stop(interrupts)

	banner()
	terminalIntro("quest")
	terminalSuggestions("quest")
	printGlobalCommands()

	gs := &GameState{
		Scanner:   bufio.NewScanner(os.Stdin),
		Done:      make(map[string]bool),
		Quests:    loadQuests(),
		FailCount: make(map[string]int),
		Ledger:    make([]LedgerEntry, 0, 32),
	}

	go func() {
		<-interrupts
		saveGame(gs)
		fmt.Printf("\n%s\n", c(Yellow, "Ctrl+C détecté. Progression sauvegardée."))
		os.Exit(0)
	}()

	// Load or create player
	if loadGame(gs) {
		fmt.Printf("%s %s\n", c(Cyan, "Welcome back,"), c(White, bold(gs.Player.Name)))
	} else {
		name := prompt(gs, "Your name, traveler ▶")
		if name == "" {
			name = "Coder"
		}
		gs.Player = Player{Name: name, HP: 100, XP: 0, Level: 1, Streak: 0}
		fmt.Printf("\n%s %s\n", c(Cyan, "Hello,"), c(White, bold(name)))
		lauraSpeak("I am Laura. Your guide through the terminal cosmos. Let's begin.")
	}

	startChoice := startPointMenu(gs)
	switch startChoice {
	case "body":
		gs.Player.World = "body"
		runBodyChallenge(gs)
		gs.Player.World = "home"
	case "docs":
		gs.Player.World = "docs"
		runDocsSpotlight(gs)
		gs.Player.World = "home"
	case "cafe":
		gs.Player.World = "cafe"
		runQuest(gs, Quest{
			ID: "cafe_001", World: "cafe", Title: "Discussion au cafe",
			Objective: `Ecoute la discussion Laura / MoltBots puis choisis qui relancer.`,
			Hint:      "Observe le dialogue, puis tape 1, 2 ou 3.",
			Type:      "cafe_scene", Expected: "1",
			Points: 12, Penalty: 1,
			Intro:     "Le cafe est plein de signaux: Laura, les MoltBots, et une table de travail qui decide de la suite.",
			StoryWin:  "La discussion relance le flux. Le mini-social garde le rythme sans bruit inutile.",
			StoryFail: "Le cafe ne se fige pas. Reprends la discussion et relance un bot avec clarté.",
		})
		gs.Player.World = "home"
	case "games":
		gs.Player.World = "games"
		runGameSpotlight(gs)
		gs.Player.World = "home"
	case "master":
		gs.Player.World = "master"
		runMasterMode(gs)
		return
	}

	for {
		hud(gs.Player)
		printGlobalCommands()
		world, ok := chooseWorld(gs)
		if !ok {
			continue
		}
		gs.Player.World = world
		if launchWorldTool(gs, world) {
			gs.Player.World = "home"
			next := prompt(gs, "\n[enter]=continue / home / back / stats / quit ▶")
			switch strings.ToLower(strings.TrimSpace(next)) {
			case "q", "quit":
				saveGame(gs)
				lauraSpeak("Le mini-jeu se ferme. La table reste ouverte.")
				return
			case "home", "back":
				gs.Player.World = "home"
				continue
			case "stats":
				done := 0
				for range gs.Done {
					done++
				}
				fmt.Printf("\n%s %d quests done / %d total\n", c(Dim, "Stats:"), done, len(gs.Quests))
				continue
			}
			continue
		}
		if unavailableWorldFallback(world) {
			gs.Player.World = "home"
			fmt.Printf("%s\n", c(Dim, "Monde indisponible. Retour au hub sans marquer de progression."))
			continue
		}

		// Filter quests by world
		var pool []Quest
		for _, q := range gs.Quests {
			if !gs.Done[q.ID] {
				if world == "all" || q.World == world {
					pool = append(pool, q)
				}
			}
		}

		if len(pool) == 0 {
			fmt.Printf("\n%s\n", c(Green, "✦ All quests in this world completed!"))
			lauraRandom()
		} else {
			// Pick a quest
			q := pool[rand.Intn(len(pool))]
			runQuest(gs, q)
		}

		if gs.Player.HP <= 0 {
			fmt.Printf("\n%s\n", c(Red, "── GAME OVER ──"))
			lauraSpeak("You fell. But the data remains. Come back stronger.")
			gs.Player.HP = 100
		}

		saveGame(gs)

		next := prompt(gs, "\n[enter]=continue / change world / home / stats / quit ▶")
		switch strings.ToLower(strings.TrimSpace(next)) {
		case "", "continue", "c":
			continue
		case "home", "back":
			gs.Player.World = "home"
			continue
		case "q", "quit":
			saveGame(gs)
			lauraSpeak("Until next session. The terminal remembers.")
			fmt.Printf("\n%s Final XP: %s | Level: %s\n\n",
				c(Cyan, gs.Player.Name),
				c(Yellow, fmt.Sprintf("%d", gs.Player.XP)),
				c(Cyan, fmt.Sprintf("%d", gs.Player.Level)),
			)
			return
		case "help":
			printGlobalCommands()
		case "stats", "s":
			done := 0
			for range gs.Done {
				done++
			}
			fmt.Printf("\n%s %d quests done / %d total\n", c(Dim, "Stats:"), done, len(gs.Quests))
		}
	}
}
