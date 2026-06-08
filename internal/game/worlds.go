package game

import "strings"

var Worlds = []string{
	"bash", "c", "go", "linux", "fullstack", "accounting", "leetcode", "cs", "css", "science", "body", "chemistry", "math", "logic",
	"cafe", "crawl", "snake", "bandit", "all",
}

func NormalizeWorld(input string) string {
	s := strings.TrimSpace(strings.ToLower(input))
	switch s {
	case "sci", "cs theory", "cs", "computer science":
		return "cs"
	case "science":
		return "science"
	case "math", "mental math":
		return "math"
	case "body", "human body", "anatomy":
		return "body"
	case "chem", "chemistry":
		return "chemistry"
	case "logic", "reasoning":
		return "logic"
	case "linux", "unix":
		return "linux"
	case "full-stack", "full stack":
		return "fullstack"
	case "acc", "ledger", "accounting":
		return "accounting"
	}
	return s
}

func IsWorld(input string) bool {
	n := NormalizeWorld(input)
	for _, w := range Worlds {
		if w == n {
			return true
		}
	}
	return false
}
