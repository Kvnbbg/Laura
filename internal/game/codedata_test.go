package game

import "testing"

func TestCodeDataQuestsLoad(t *testing.T) {
	engine := NewEngine()
	if len(engine.CodeDataQuests) == 0 {
		t.Fatal("expected Code/Data Master missions to load")
	}
	for _, q := range engine.CodeDataQuests {
		if !IsCodeDataTrack(q.Track) {
			t.Fatalf("quest %s has unknown track %q", q.ID, q.Track)
		}
		if q.Type == "" {
			t.Fatalf("quest %s is missing a mission type", q.ID)
		}
	}
}

func TestNormalizeTrackAliases(t *testing.T) {
	cases := map[string]string{
		"SQL":              "sql",
		"algo":             "dsa",
		"leetcode":         "dsa",
		"db":               "sql",
		"design":           "system",
		"data engineering": "de",
		"golang":           "go",
		"backend go":       "go",
	}
	for in, want := range cases {
		if got := NormalizeTrack(in); got != want {
			t.Fatalf("NormalizeTrack(%q) = %q, want %q", in, got, want)
		}
	}
	if IsCodeDataTrack("not-a-track") {
		t.Fatal("expected unknown alias to not be a track")
	}
}

func TestFilterTrackRotatesAcrossTracks(t *testing.T) {
	engine := NewEngine()
	for _, track := range CodeDataTracks {
		pool := engine.FilterTrack(track)
		if len(pool) == 0 {
			t.Fatalf("expected missions for track %s", track)
		}
		for _, q := range pool {
			if q.Track != track {
				t.Fatalf("FilterTrack(%s) returned quest from track %s", track, q.Track)
			}
		}
	}
}

func TestGoTrackHasEngineeringConceptMissions(t *testing.T) {
	engine := NewEngine()
	pool := engine.FilterTrack("golang")
	if len(pool) < 6 {
		t.Fatalf("expected at least 6 Go missions, got %d", len(pool))
	}
	levels := map[int]bool{}
	for _, q := range pool {
		if q.Track != "go" || q.World != "go" {
			t.Fatalf("expected Go mission to carry go track/world, got track=%q world=%q", q.Track, q.World)
		}
		if q.Explanation == "" {
			t.Fatalf("expected Go mission %s to explain the engineering concept", q.ID)
		}
		levels[q.Level] = true
	}
	for _, level := range []int{1, 2, 3} {
		if !levels[level] {
			t.Fatalf("expected Go missions to include level %d, got levels %v", level, levels)
		}
	}
}

func TestRandomTrackQuestAvoidPreventsRecentDuplicate(t *testing.T) {
	engine := NewEngine()
	pool := engine.FilterTrack("dsa")
	if len(pool) < 2 {
		t.Fatal("need at least two dsa missions to test dedup")
	}
	recent := []string{pool[0].ID}
	for i := 0; i < 20; i++ {
		quest, ok := engine.RandomTrackQuestAvoid("dsa", 3, map[string]bool{}, "", recent)
		if !ok {
			t.Fatal("expected a quest")
		}
		if quest.ID == pool[0].ID {
			t.Fatalf("expected recently seen quest %s to be avoided", pool[0].ID)
		}
	}
}

func TestRandomTrackQuestAvoidNeverResurrectsDoneOverFreshAlternatives(t *testing.T) {
	engine := NewEngine()
	pool := engine.FilterTrack("sql")
	if len(pool) < 2 {
		t.Fatal("need at least two sql missions for this test")
	}
	// Mark every quest but one as done, and pin lastTrack to "sql" — the
	// scenario that, with a flat fallback to the whole pool, would have let
	// a just-completed quest resurface immediately (lastTrack == track
	// zeroes out every candidate before the done filter gets a say).
	done := map[string]bool{}
	var remaining Quest
	for i, q := range pool {
		if i == 0 {
			remaining = q
			continue
		}
		done[q.ID] = true
	}
	for i := 0; i < 20; i++ {
		quest, ok := engine.RandomTrackQuestAvoid("sql", 3, done, "sql", nil)
		if !ok {
			t.Fatal("expected a quest")
		}
		if quest.ID != remaining.ID {
			t.Fatalf("expected the only non-done quest %s, got a done quest %s back", remaining.ID, quest.ID)
		}
	}
}

func TestRandomTrackQuestAvoidUnknownTrack(t *testing.T) {
	engine := NewEngine()
	if _, ok := engine.RandomTrackQuestAvoid("not-a-track", 1, map[string]bool{}, "", nil); ok {
		t.Fatal("expected no quest for unknown track")
	}
}

func TestWeakTopicsRanksAscending(t *testing.T) {
	mastery := map[string]int{"dsa": 5, "sql": 0, "stats": 2, "ml": 5, "de": 1, "system": 3, "go": 4}
	ranked := WeakTopics(mastery)
	if len(ranked) != len(CodeDataTracks) {
		t.Fatalf("expected %d tracks, got %d", len(CodeDataTracks), len(ranked))
	}
	if ranked[0] != "sql" {
		t.Fatalf("expected weakest topic first (sql), got %s", ranked[0])
	}
	for i := 1; i < len(ranked); i++ {
		if mastery[ranked[i-1]] > mastery[ranked[i]] {
			t.Fatalf("expected ascending mastery order, got %v", ranked)
		}
	}
}

func TestGoLearningPathExplainsEngineeringConcepts(t *testing.T) {
	path, ok := LearningPath("golang")
	if !ok {
		t.Fatal("expected Go learning path")
	}
	if path.Track != "go" {
		t.Fatalf("expected go path, got %q", path.Track)
	}
	if path.Explanation == "" {
		t.Fatal("expected learning path explanation")
	}
	if len(path.Stages) < 6 {
		t.Fatalf("expected at least 6 Go path stages, got %d", len(path.Stages))
	}
	for _, stage := range path.Stages {
		if stage.Concept == "" || stage.Practice == "" {
			t.Fatalf("expected stage %q to include concept and practice", stage.Title)
		}
	}
}

func TestCheckNumericTolerance(t *testing.T) {
	if numeric, ok := CheckNumeric("0.51", "0.5", 0.02); !numeric || !ok {
		t.Fatal("expected 0.51 to match 0.5 within tolerance 0.02")
	}
	if numeric, ok := CheckNumeric("0.6", "0.5", 0.02); !numeric || ok {
		t.Fatal("expected 0.6 to fall outside tolerance of 0.5")
	}
	if numeric, _ := CheckNumeric("not-a-number", "0.5", 0.02); numeric {
		t.Fatal("expected non-numeric input to be reported as non-numeric")
	}
}

func TestCheckCodeDataAnswerUsesToleranceThenFallsBack(t *testing.T) {
	numericQuest := Quest{Answer: "5", Tolerance: 0.5}
	if !CheckCodeDataAnswer("5.2", numericQuest) {
		t.Fatal("expected 5.2 to pass within tolerance of 5")
	}
	if CheckCodeDataAnswer("9", numericQuest) {
		t.Fatal("expected 9 to fail outside tolerance of 5")
	}

	textQuest := Quest{Answer: "hash map", Accepted: []string{"3"}, Tolerance: 0}
	if !CheckCodeDataAnswer("3", textQuest) {
		t.Fatal("expected accepted-list match to pass through to CheckAnswer")
	}
	if !CheckCodeDataAnswer("Hash Map", textQuest) {
		t.Fatal("expected normalized text match to pass through to CheckAnswer")
	}
}

func TestCheckCodeDataAnswerSQLMultilineNormalizes(t *testing.T) {
	quest := Quest{
		Type:      "sql",
		Multiline: true,
		Answer:    "select name salary from employees where salary 50000",
	}
	typed := "SELECT name, salary\nFROM employees\nWHERE salary > 50000;"
	if !CheckCodeDataAnswer(typed, quest) {
		t.Fatalf("expected punctuated multiline SQL to normalize and match: %q", NormalizeAnswer(typed))
	}
	if CheckCodeDataAnswer("SELECT * FROM employees;", quest) {
		t.Fatal("expected an unrelated query to fail")
	}
}
