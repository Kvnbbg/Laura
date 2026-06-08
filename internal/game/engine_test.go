package game

import "testing"

func TestCheckAnswer(t *testing.T) {
	q := Quest{Answer: "o(log n)", Accepted: []string{"log n"}}
	if !CheckAnswer("O(log n)", q) {
		t.Fatal("expected exact answer to pass")
	}
	if !CheckAnswer("log n", q) {
		t.Fatal("expected accepted answer to pass")
	}
	if CheckAnswer("wrong", q) {
		t.Fatal("expected wrong answer to fail")
	}
}

func TestNormalizeWorld(t *testing.T) {
	if got := NormalizeWorld("SCIENCE"); got != "science" {
		t.Fatalf("expected science, got %s", got)
	}
	if got := NormalizeWorld("cs theory"); got != "cs" {
		t.Fatalf("expected cs, got %s", got)
	}
}

func TestRandomQuestRespectsLevel(t *testing.T) {
	engine := NewEngine()
	quest, ok := engine.RandomQuest("cs", 1, map[string]bool{}, "")
	if !ok {
		t.Fatal("expected a quest")
	}
	if quest.Level > 2 {
		t.Fatalf("expected low/mid quest, got level %d", quest.Level)
	}
}

func TestFilterUnavailableWorldsReturnEmpty(t *testing.T) {
	engine := NewEngine()
	if got := engine.Filter("bandit"); len(got) != 0 {
		t.Fatalf("expected no embedded quests for bandit, got %d", len(got))
	}
}

func TestRandomQuestAvoidPreventsRecentDuplicate(t *testing.T) {
	engine := NewEngine()
	quest, ok := engine.RandomQuestAvoid("bash", 1, map[string]bool{}, "", []string{"bash-echo"})
	if !ok {
		t.Fatal("expected quest")
	}
	if quest.ID == "bash-echo" && len(engine.Filter("bash")) > 1 {
		t.Fatal("expected recent duplicate to be avoided")
	}
}

func TestDifficultyTargetSoftensAndRises(t *testing.T) {
	if got := DifficultyTarget(1, 0); got != 1 {
		t.Fatalf("expected 1, got %d", got)
	}
	if got := DifficultyTarget(1, 3); got != 2 {
		t.Fatalf("expected 2, got %d", got)
	}
	if got := DifficultyTarget(4, 0); got != 3 {
		t.Fatalf("expected cap 3, got %d", got)
	}
}
