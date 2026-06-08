package game

import (
	"strings"
	"testing"
)

func TestSavePathHasLocalShare(t *testing.T) {
	path := SavePath()
	if path == "" || !strings.HasSuffix(path, "save.json") {
		t.Fatalf("unexpected save path: %s", path)
	}
}

func TestSaveAndLoadRoundTrip(t *testing.T) {
	tmp := t.TempDir()
	t.Setenv("HOME", tmp)

	state := SaveData{
		Player:    Player{Name: "Laura", HP: 3, XP: 12, Level: 2, World: "bash"},
		Completed: map[string]bool{"bash-echo": true},
		LastWorld: "bash",
	}
	if err := Save(state); err != nil {
		t.Fatalf("save failed: %v", err)
	}
	got, err := Load()
	if err != nil {
		t.Fatalf("load failed: %v", err)
	}
	if !got.Completed["bash-echo"] || got.Player.Name != "Laura" {
		t.Fatalf("unexpected round trip: %+v", got)
	}
}
