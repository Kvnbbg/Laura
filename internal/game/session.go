package game

import (
	"fmt"
	"time"
)

type Session struct {
	Engine *Engine
	State  SaveData
}

func NewSession(engine *Engine, state SaveData) *Session {
	if state.Completed == nil {
		state.Completed = map[string]bool{}
	}
	if state.TopicMaster == nil {
		state.TopicMaster = map[string]int{}
	}
	if state.Player.HP == 0 {
		state.Player.HP = 3
	}
	if state.Player.Level == 0 {
		state.Player.Level = 1
	}
	if state.Player.Name == "" {
		state.Player.Name = "Coder"
	}
	if state.Player.World == "" {
		state.Player.World = "home"
	}
	return &Session{Engine: engine, State: state}
}

func (s *Session) StatsLine() string {
	return fmt.Sprintf("XP %d | Level %d | Streak %d | Completed %d | Worlds %d", s.State.Player.XP, s.State.Player.Level, s.State.Player.Streak, len(s.State.Completed), len(s.Engine.Quests))
}

func (s *Session) MarkCorrect(q Quest) {
	s.State.Completed[q.ID] = true
	s.State.Player.XP += q.Points
	s.State.Player.Streak++
	s.State.TopicMaster[q.World]++
	s.State.LastQuest = q.ID
	s.State.LastTopic = q.World
	s.State.RecentQuests = appendRecent(s.State.RecentQuests, q.ID, 4)
	if s.State.Player.Streak%3 == 0 {
		s.State.Player.Level++
	}
	if s.State.Player.Streak > s.State.StreakBest {
		s.State.StreakBest = s.State.Player.Streak
	}
}

func (s *Session) MarkWrong(q Quest) {
	if q.Penalty > 0 {
		s.State.Player.HP = max(1, s.State.Player.HP-q.Penalty)
	}
	if s.State.Player.Level > 1 {
		s.State.Player.Level--
	}
	s.State.Player.Streak = 0
}

func (s *Session) Save() error {
	s.State.Player.Updated = time.Now()
	return Save(s.State)
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func appendRecent(items []string, id string, capN int) []string {
	filtered := make([]string, 0, capN)
	for _, item := range items {
		if item == id {
			continue
		}
		filtered = append(filtered, item)
	}
	filtered = append(filtered, id)
	if len(filtered) > capN {
		filtered = filtered[len(filtered)-capN:]
	}
	return filtered
}
