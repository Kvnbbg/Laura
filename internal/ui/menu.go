package ui

import "fmt"

var HomeOptions = []string{
	"1 Play",
	"2 Continue",
	"3 Worlds",
	"4 Mini games",
	"5 Docs",
	"6 Stats",
	"0 Quit",
}

func PrintHome() {
	fmt.Println("\nLaura")
	for _, line := range HomeOptions {
		fmt.Println(line)
	}
}

func PrintWorlds(worlds []string) {
	fmt.Println("Worlds:", worlds)
}

func PrintPostQuestPrompt() {
	fmt.Println("1 Retry 2 Next 3 World 4 Home 0 Quit")
}
