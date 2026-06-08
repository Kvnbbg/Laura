package game

import (
	_ "embed"
	"encoding/json"
	"math/rand"
	"strings"
)

//go:embed quests_data.json
var questsJSON []byte

//go:embed codedata_quests.json
var codeDataQuestsJSON []byte

type Engine struct {
	Quests         []Quest
	CodeDataQuests []Quest
}

func NewEngine() *Engine {
	quests, err := loadQuests(questsJSON)
	if err != nil || len(quests) == 0 {
		quests = defaultQuests()
	}
	codeData, err := loadQuests(codeDataQuestsJSON)
	if err != nil {
		codeData = nil
	}
	return &Engine{Quests: quests, CodeDataQuests: codeData}
}

func loadQuests(raw []byte) ([]Quest, error) {
	var quests []Quest
	if err := json.Unmarshal(raw, &quests); err != nil {
		return nil, err
	}
	return quests, nil
}

func defaultQuests() []Quest {
	return []Quest{
		{ID: "linux-perm", World: "linux", Level: 1, Title: "Permission Gate", Objective: "Read chmod meaning", Hint: "rwx", Difficulty: "easy", Points: 10, Penalty: 1, Question: "What does x usually mean in Unix permissions?", Answer: "execute", Accepted: []string{"x", "exec"}, Short: true, StoryWin: "Permissions decoded.", StoryFail: "Think execute."},
		{ID: "body-heart", World: "body", Level: 1, Title: "Pulse Gate", Objective: "Know the heart role", Hint: "pump blood", Difficulty: "easy", Points: 10, Penalty: 1, Question: "What does the heart do?", Answer: "pump blood", Accepted: []string{"circulate blood", "pump"}, Short: true, StoryWin: "Heartbeat stable.", StoryFail: "Focus on function."},
		{ID: "chem-water", World: "chemistry", Level: 1, Title: "Water Mark", Objective: "Name the formula for water", Hint: "H2O", Difficulty: "easy", Points: 10, Penalty: 1, Question: "Chemical formula for water?", Answer: "h2o", Accepted: []string{"h20"}, Short: true, StoryWin: "Chemistry aligned.", StoryFail: "Remember two hydrogens."},
		{ID: "math-mental", World: "math", Level: 1, Title: "Quick Sum", Objective: "Mental calc under 10 seconds", Hint: "7+8", Difficulty: "easy", Points: 10, Penalty: 1, Question: "7 + 8 = ?", Answer: "15", Accepted: []string{"fifteen"}, Short: true, StoryWin: "Mental math clean.", StoryFail: "Add carefully."},
		{ID: "logic-chain", World: "logic", Level: 1, Title: "If Then", Objective: "Recognize a valid implication", Hint: "if A then B", Difficulty: "easy", Points: 10, Penalty: 1, Question: "What does an implication usually mean?", Answer: "if then", Accepted: []string{"implication", "conditional"}, Short: true, StoryWin: "Logic holds.", StoryFail: "Think conditional."},
		{ID: "science-atom", World: "science", Level: 1, Title: "Atomic Start", Objective: "Basic science fact", Hint: "matter and atoms", Difficulty: "easy", Points: 10, Penalty: 1, Question: "What is matter made of?", Answer: "atoms", Accepted: []string{"particles"}, Short: true, StoryWin: "Science grounded.", StoryFail: "Think basic structure."},
		{ID: "bash-echo", World: "bash", Level: 1, Title: "Echo Chamber", Objective: "Print exactly: Hello, Laura", Hint: "echo 'Hello, Laura'", Difficulty: "easy", Points: 10, Penalty: 1, Question: "Print Hello, Laura", Answer: "Hello, Laura", Accepted: []string{"hello, laura"}, Short: true, StoryWin: "Signal clean.", StoryFail: "Check quoting."},
		{ID: "bash-pipe", World: "bash", Level: 2, Title: "Pipe Gate", Objective: "Use a pipe to filter text", Hint: "grep, awk, sed", Difficulty: "medium", Points: 16, Penalty: 2, Question: "What symbol chains commands in Bash?", Answer: "|", Accepted: []string{"pipe"}, Short: true, StoryWin: "Stream linked.", StoryFail: "Think pipeline."},
		{ID: "go-ready", World: "go", Level: 1, Title: "Go Signal", Objective: "Write a Go program that prints ready", Hint: "package main; fmt.Println(\"ready\")", Difficulty: "easy", Points: 12, Penalty: 1, Question: "Which package is required for a Go main program?", Answer: "main", Accepted: []string{"package main"}, Short: true, StoryWin: "Go runs clean.", StoryFail: "Set package main."},
		{ID: "go-json", World: "go", Level: 2, Title: "JSON Relay", Objective: "Decode structured data", Hint: "encoding/json", Difficulty: "medium", Points: 18, Penalty: 2, Question: "Which standard package handles JSON?", Answer: "encoding/json", Accepted: []string{"json"}, Short: true, StoryWin: "Payload decoded.", StoryFail: "Use stdlib JSON."},
		{ID: "css-flex", World: "css", Level: 1, Title: "Flexbox Riddle", Objective: "What display value enables flexbox?", Hint: "flex", Difficulty: "easy", Points: 10, Penalty: 1, Question: "CSS display value for flexbox?", Answer: "flex", Accepted: []string{"display flex"}, Short: true, StoryWin: "Layout unlocked.", StoryFail: "Think display."},
		{ID: "css-grid", World: "css", Level: 2, Title: "Grid Layer", Objective: "Which display value creates grid layout?", Hint: "grid", Difficulty: "medium", Points: 14, Penalty: 2, Question: "CSS display value for grid layout?", Answer: "grid", Accepted: []string{"display grid"}, Short: true, StoryWin: "Grid stabilised.", StoryFail: "Think grid."},
		{ID: "cs-big-o", World: "cs", Level: 1, Title: "Big O Whisper", Objective: "What is binary search complexity?", Hint: "O(log n)", Difficulty: "medium", Points: 16, Penalty: 2, Question: "Binary search complexity?", Answer: "o(log n)", Accepted: []string{"log n", "log"}, Short: true, StoryWin: "Efficiency achieved.", StoryFail: "Halving matters."},
		{ID: "cs-graph", World: "cs", Level: 3, Title: "Graph Gate", Objective: "Name a traversal pattern", Hint: "dfs or bfs", Difficulty: "hard", Points: 24, Penalty: 3, Question: "Pick a graph traversal algorithm.", Answer: "dfs", Accepted: []string{"bfs", "depth first search", "breadth first search"}, Short: true, StoryWin: "Traversal mastered.", StoryFail: "Traversal means DFS or BFS."},
		{ID: "fullstack-layers", World: "fullstack", Level: 1, Title: "API Relay", Objective: "Name a stack layer.", Hint: "backend/frontend/database/auth/cache", Difficulty: "medium", Points: 16, Penalty: 2, Question: "Name one enterprise fullstack layer.", Answer: "backend", Accepted: []string{"frontend", "database", "auth", "cache", "queue"}, Short: true, StoryWin: "Stack aligned.", StoryFail: "Pick a concrete layer."},
		{ID: "fullstack-ship", World: "fullstack", Level: 3, Title: "Ship it", Objective: "Choose the deploy target", Hint: "web / mobile / api / queue", Difficulty: "hard", Points: 24, Penalty: 3, Question: "What do you usually monitor in production?", Answer: "api", Accepted: []string{"web", "mobile", "queue", "database"}, Short: true, StoryWin: "Production shaped.", StoryFail: "Think systems, not slogans."},
		{ID: "accounting-revenue", World: "accounting", Level: 1, Title: "Revenue Gate", Objective: "What is revenue?", Hint: "income from sales or services", Difficulty: "easy", Points: 12, Penalty: 1, Question: "Revenue means?", Answer: "income", Accepted: []string{"sales", "services"}, Short: true, StoryWin: "Ledger honest.", StoryFail: "Think incoming money."},
		{ID: "accounting-margin", World: "accounting", Level: 2, Title: "Margin Check", Objective: "Revenue minus cost equals what?", Hint: "profit", Difficulty: "medium", Points: 16, Penalty: 2, Question: "Revenue minus cost = ?", Answer: "profit", Accepted: []string{"margin", "gross profit"}, Short: true, StoryWin: "Margin visible.", StoryFail: "Revenue is not profit."},
		{ID: "cafe-001", World: "cafe", Level: 1, Title: "Discussion au cafe", Objective: "Choose who relaunches the flow.", Hint: "1 Laura / 2 MoltBot / 3 Quitter", Difficulty: "easy", Points: 8, Penalty: 1, Question: "Who relaunches?", Answer: "1", Accepted: []string{"laura"}, Short: true, StoryWin: "The table keeps moving.", StoryFail: "Try again, no freeze."},
	}
}

func (e *Engine) Filter(world string) []Quest {
	world = NormalizeWorld(world)
	if world == "" || world == "all" {
		return append([]Quest(nil), e.Quests...)
	}
	out := make([]Quest, 0, len(e.Quests))
	for _, q := range e.Quests {
		if q.World == world {
			out = append(out, q)
		}
	}
	return out
}

func (e *Engine) RandomQuest(world string, level int, done map[string]bool, lastWorld string) (Quest, bool) {
	pool := e.Filter(world)
	if len(pool) == 0 {
		return Quest{}, false
	}
	candidates := make([]Quest, 0, len(pool))
	for _, q := range pool {
		if done != nil && done[q.ID] {
			continue
		}
		if q.Level > 0 && level > 0 && q.Level > level+1 {
			continue
		}
		if lastWorld != "" && q.World == lastWorld && len(pool) > 1 {
			continue
		}
		candidates = append(candidates, q)
	}
	if len(candidates) == 0 {
		candidates = pool
	}
	return candidates[rand.Intn(len(candidates))], true
}

func (e *Engine) RandomQuestAvoid(world string, level int, done map[string]bool, lastWorld string, recent []string) (Quest, bool) {
	pool := e.Filter(world)
	if len(pool) == 0 {
		return Quest{}, false
	}
	recentSet := map[string]bool{}
	for _, id := range recent {
		recentSet[id] = true
	}
	candidates := make([]Quest, 0, len(pool))
	for _, q := range pool {
		if done != nil && done[q.ID] {
			continue
		}
		if recentSet[q.ID] && len(pool) > 1 {
			continue
		}
		if q.Level > 0 && level > 0 && q.Level > level+1 {
			continue
		}
		if lastWorld != "" && q.World == lastWorld && len(pool) > 1 {
			continue
		}
		candidates = append(candidates, q)
	}
	if len(candidates) == 0 {
		candidates = pool
	}
	return candidates[rand.Intn(len(candidates))], true
}

func QuestDifficultyLabel(level int) string {
	switch {
	case level <= 1:
		return "easy"
	case level == 2:
		return "medium"
	default:
		return "hard"
	}
}

func DifficultyTarget(level int, streak int) int {
	target := level
	if streak >= 3 {
		target++
	}
	if target < 1 {
		target = 1
	}
	if target > 3 {
		target = 3
	}
	return target
}

func NormalizeAnswer(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	replacer := strings.NewReplacer("à", "a", "â", "a", "ä", "a", "ç", "c", "é", "e", "è", "e", "ê", "e", "ë", "e", "î", "i", "ï", "i", "ô", "o", "ö", "o", "ù", "u", "û", "u", "ü", "u", "œ", "oe", "’", "'", "-", " ", "_", " ")
	s = replacer.Replace(s)
	var b strings.Builder
	for _, r := range s {
		switch {
		case r >= 'a' && r <= 'z':
			b.WriteRune(r)
		case r >= '0' && r <= '9':
			b.WriteRune(r)
		case r == ' ':
			b.WriteRune(r)
		}
	}
	return strings.Join(strings.Fields(b.String()), " ")
}

func CheckAnswer(input string, quest Quest) bool {
	in := NormalizeAnswer(input)
	if in == NormalizeAnswer(quest.Answer) || strings.Contains(in, NormalizeAnswer(quest.Answer)) {
		return true
	}
	for _, a := range quest.Accepted {
		na := NormalizeAnswer(a)
		if in == na || strings.Contains(in, na) {
			return true
		}
	}
	return false
}
