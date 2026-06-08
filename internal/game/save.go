package game

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
)

func SavePath() string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".local", "share", "laura", "save.json")
}

func Save(state SaveData) error {
	path := SavePath()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	tmp := path + ".tmp"
	data, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		return err
	}
	if err := os.WriteFile(tmp, data, 0o600); err != nil {
		return err
	}
	if err := os.Rename(tmp, path); err != nil {
		_ = os.Remove(tmp)
		return err
	}
	return nil
}

func Load() (SaveData, error) {
	path := SavePath()
	raw, err := os.ReadFile(path)
	if err != nil {
		return SaveData{}, err
	}
	var state SaveData
	if err := json.Unmarshal(raw, &state); err != nil {
		backup := path + ".corrupt"
		_ = os.Rename(path, backup)
		return SaveData{}, errors.New("corrupted save backed up")
	}
	if state.Completed == nil {
		state.Completed = map[string]bool{}
	}
	return state, nil
}

func Reset() error {
	path := SavePath()
	_ = os.Remove(path)
	_ = os.Remove(path + ".tmp")
	return nil
}
