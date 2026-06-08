package ui

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"strings"
	"time"
)

func Prompt(scanner *bufio.Scanner, label string) string {
	fmt.Printf("%s ", label)
	if !scanner.Scan() {
		return ""
	}
	return strings.TrimSpace(scanner.Text())
}

// PromptMultiline reads lines until one trims to exactly "---" and returns
// the collected lines joined by newlines — the convention for multiline
// code/SQL answers in Code/Data Master missions.
func PromptMultiline(scanner *bufio.Scanner, label string) string {
	fmt.Printf("%s\n(end with a line containing only ---)\n", label)
	var lines []string
	for scanner.Scan() {
		line := scanner.Text()
		if strings.TrimSpace(line) == "---" {
			break
		}
		lines = append(lines, line)
	}
	return strings.Join(lines, "\n")
}

func PrintHelp() {
	fmt.Println("Commands: home, back, quit, q, skip, help, stats, worlds")
}

func SupportsAnimation(noAnimation bool) bool {
	if noAnimation {
		return false
	}
	if os.Getenv("CI") != "" {
		return false
	}
	info, err := os.Stdout.Stat()
	if err != nil || (info.Mode()&os.ModeCharDevice) == 0 {
		return false
	}
	return true
}

func ThinkingEffect(w io.Writer, noAnimation bool) {
	if !SupportsAnimation(noAnimation) {
		return
	}
	fmt.Fprint(w, "Laura thinking")
	for i := 0; i < 3; i++ {
		time.Sleep(80 * time.Millisecond)
		fmt.Fprint(w, ".")
	}
	fmt.Fprintln(w)
	fmt.Fprintln(w, "  /\\_/\\")
	fmt.Fprintln(w, " ( o.o )")
	fmt.Fprintln(w, "  > ^ <")
}

func ThinkingHint(w io.Writer, line string, noAnimation bool) {
	if !SupportsAnimation(noAnimation) {
		fmt.Fprintln(w, line)
		return
	}
	parts := splitHint(line)
	for _, chunk := range parts {
		fmt.Fprintln(w, chunk)
		time.Sleep(40 * time.Millisecond)
	}
}

func splitHint(s string) []string {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	if len(s) <= 24 {
		return []string{s}
	}
	if len(s) <= 48 {
		return []string{s[:24], s[24:]}
	}
	if len(s) <= 72 {
		return []string{s[:24], s[24:48], s[48:]}
	}
	return []string{s[:24], s[24:48], s[len(s)-24:]}
}
