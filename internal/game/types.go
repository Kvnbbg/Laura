package game

import "time"

type Quest struct {
	ID         string   `json:"id"`
	World      string   `json:"world"`
	Level      int      `json:"level"`
	Title      string   `json:"title"`
	Objective  string   `json:"objective"`
	Hint       string   `json:"hint"`
	Difficulty string   `json:"difficulty"`
	Points     int      `json:"points"`
	Penalty    int      `json:"penalty"`
	Question   string   `json:"question"`
	Answer     string   `json:"answer"`
	Accepted   []string `json:"accepted,omitempty"`
	Available  bool     `json:"available"`
	Short      bool     `json:"short"`
	StoryWin   string   `json:"story_win"`
	StoryFail  string   `json:"story_fail"`

	// Code/Data Master extensions (all optional; existing quest data omits them).
	Track       string   `json:"track,omitempty"`
	Type        string   `json:"type,omitempty"`
	Multiline   bool     `json:"multiline,omitempty"`
	Tolerance   float64  `json:"tolerance,omitempty"`
	Choices     []string `json:"choices,omitempty"`
	Explanation string   `json:"explanation,omitempty"`
}

type Player struct {
	Name    string    `json:"name"`
	HP      int       `json:"hp"`
	XP      int       `json:"xp"`
	Level   int       `json:"level"`
	Streak  int       `json:"streak"`
	World   string    `json:"world"`
	Updated time.Time `json:"updated"`
}

type SaveData struct {
	Player       Player          `json:"player"`
	Completed    map[string]bool `json:"completed"`
	LastWorld    string          `json:"lastWorld"`
	LastQuest    string          `json:"lastQuest"`
	LastTopic    string          `json:"lastTopic"`
	StreakBest   int             `json:"streakBest"`
	SeenAudit    int             `json:"seenAudit"`
	TopicMaster  map[string]int  `json:"topicMaster,omitempty"`
	RecentQuests []string        `json:"recentQuests,omitempty"`
}

type Result struct {
	Correct    bool
	Points     int
	XPDelta    int
	HPDelta    int
	RetryHint  string
	Streak     int
	LevelUp    bool
	AcceptedAs string
}
