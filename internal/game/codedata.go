package game

import (
	"math"
	"math/rand"
	"sort"
	"strconv"
	"strings"
)

// CodeDataTracks lists the learning tracks available in Code/Data Master mode.
var CodeDataTracks = []string{"dsa", "sql", "stats", "ml", "de", "system"}

// NormalizeTrack maps user-typed aliases onto the canonical track keys.
func NormalizeTrack(input string) string {
	s := strings.TrimSpace(strings.ToLower(input))
	switch s {
	case "dsa", "algo", "algorithms", "leetcode", "data structures":
		return "dsa"
	case "sql", "database", "db", "databases":
		return "sql"
	case "stats", "statistics", "probability":
		return "stats"
	case "ml", "machine learning", "machinelearning":
		return "ml"
	case "de", "data engineering", "dataeng", "etl":
		return "de"
	case "system", "system design", "systemdesign", "design":
		return "system"
	}
	return s
}

// IsCodeDataTrack reports whether input names a Code/Data Master track.
func IsCodeDataTrack(input string) bool {
	n := NormalizeTrack(input)
	for _, t := range CodeDataTracks {
		if t == n {
			return true
		}
	}
	return false
}

// FilterTrack returns the Code/Data Master quests for a track ("" or "all"
// returns every code-data quest).
func (e *Engine) FilterTrack(track string) []Quest {
	track = NormalizeTrack(track)
	if track == "" || track == "all" {
		return append([]Quest(nil), e.CodeDataQuests...)
	}
	out := make([]Quest, 0, len(e.CodeDataQuests))
	for _, q := range e.CodeDataQuests {
		if q.Track == track {
			out = append(out, q)
		}
	}
	return out
}

// RandomTrackQuestAvoid selects within a Code/Data Master track, applying
// the same dedup/level/recency filters as RandomQuestAvoid but relaxing
// them in tiers (lastTrack, then level, then recency) before ever falling
// back to a quest the player has already completed. A flat fallback to the
// whole pool — as RandomQuestAvoid does — would let "no duplicate too soon"
// regress whenever cross-track mixing happens to pick the same track twice
// in a row (lastTrack == track would otherwise zero out every candidate).
func (e *Engine) RandomTrackQuestAvoid(track string, level int, done map[string]bool, lastTrack string, recent []string) (Quest, bool) {
	pool := e.FilterTrack(track)
	if len(pool) == 0 {
		return Quest{}, false
	}
	recentSet := map[string]bool{}
	for _, id := range recent {
		recentSet[id] = true
	}

	notDone := func(q Quest) bool { return done == nil || !done[q.ID] }
	notRecent := func(q Quest) bool { return !recentSet[q.ID] || len(pool) <= 1 }
	inLevel := func(q Quest) bool { return q.Level <= 0 || level <= 0 || q.Level <= level+1 }
	freshTrack := func(q Quest) bool { return lastTrack == "" || q.Track != lastTrack || len(pool) <= 1 }

	tiers := []func(Quest) bool{
		func(q Quest) bool { return notDone(q) && notRecent(q) && inLevel(q) && freshTrack(q) },
		func(q Quest) bool { return notDone(q) && notRecent(q) && inLevel(q) },
		func(q Quest) bool { return notDone(q) && notRecent(q) },
		func(q Quest) bool { return notDone(q) },
	}
	for _, keep := range tiers {
		candidates := make([]Quest, 0, len(pool))
		for _, q := range pool {
			if keep(q) {
				candidates = append(candidates, q)
			}
		}
		if len(candidates) > 0 {
			return candidates[rand.Intn(len(candidates))], true
		}
	}
	return pool[rand.Intn(len(pool))], true
}

// WeakTopics ranks Code/Data Master tracks from least to most mastered,
// using the same per-world TopicMaster counters MarkCorrect already keeps
// (code-data quests carry World == Track, so no session changes are needed).
func WeakTopics(topicMaster map[string]int) []string {
	type ranked struct {
		track string
		score int
	}
	pairs := make([]ranked, 0, len(CodeDataTracks))
	for _, t := range CodeDataTracks {
		pairs = append(pairs, ranked{track: t, score: topicMaster[t]})
	}
	sort.SliceStable(pairs, func(i, j int) bool { return pairs[i].score < pairs[j].score })
	out := make([]string, 0, len(pairs))
	for _, p := range pairs {
		out = append(out, p.track)
	}
	return out
}

// CheckNumeric reports whether input and expected both parse as numbers and,
// if so, whether they're within tolerance of each other. The first return
// value is false when either side fails to parse as a number — callers
// should fall back to text-based matching in that case.
func CheckNumeric(input, expected string, tolerance float64) (numeric bool, ok bool) {
	in, err1 := strconv.ParseFloat(strings.TrimSpace(input), 64)
	exp, err2 := strconv.ParseFloat(strings.TrimSpace(expected), 64)
	if err1 != nil || err2 != nil {
		return false, false
	}
	return true, math.Abs(in-exp) <= tolerance
}

var lineBreakReplacer = strings.NewReplacer("\r\n", " ", "\n", " ", "\r", " ")

// CheckCodeDataAnswer checks an answer against a Code/Data Master quest,
// applying numeric tolerance when the quest declares one, and otherwise
// falling back to the standard normalized/accepted-answer matching.
//
// Multiline answers (code/SQL ending in "---") arrive with embedded line
// breaks; NormalizeAnswer drops characters it doesn't recognize — including
// "\n" — rather than treating them as separators, which would silently glue
// "salary" and "FROM" into "salaryfrom" across a line break. Folding line
// breaks to spaces here keeps multiline answers comparable to single-line
// canonical answers without changing NormalizeAnswer's existing contract.
func CheckCodeDataAnswer(input string, quest Quest) bool {
	input = lineBreakReplacer.Replace(input)
	if quest.Tolerance > 0 {
		if numeric, ok := CheckNumeric(input, quest.Answer, quest.Tolerance); numeric {
			return ok
		}
	}
	return CheckAnswer(input, quest)
}

// MissionTypeLabel turns a Code/Data Master mission type key into a short
// human-readable label for the HUD.
func MissionTypeLabel(t string) string {
	switch t {
	case "mcq":
		return "Multiple choice"
	case "code":
		return "Write code"
	case "fillcode":
		return "Fill the code"
	case "predict":
		return "Predict output"
	case "bigo":
		return "Big O"
	case "sql":
		return "SQL query"
	case "debug":
		return "Debug snippet"
	case "datamodel":
		return "Data model choice"
	case "mentalcalc":
		return "Mental calc"
	default:
		return ""
	}
}
