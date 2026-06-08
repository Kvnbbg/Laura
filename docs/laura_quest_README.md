# Laura Quest — Moteur RPG terminal + pont de chat

**Language:** Go (sans Python)
**Persona:** Laura — guide IA au rêve cosmique, techandstream.com
**GitHub:** https://github.com/Kvnbbg/Laura

## Install & run

```bash
# Clone
git clone https://github.com/Kvnbbg/Laura
cd laura-quest

# Build (requires Go 1.22+)
go build -o laura laura_quest_main.go

# Jouer
./laura

# Pont de chat
go run laura_quest_main.go chat
```

## Mondes disponibles

| World     | Type                        | Tools needed       |
|-----------|-----------------------------|--------------------|
| bash      | Run real bash scripts       | bash + shellcheck  |
| c         | Compile & run C code        | gcc                |
| go        | Run Go programs             | go                 |
| fullstack | Enterprise/freelance mix    | bash + web + APIs  |
| accounting| Revenue / expense / ledger  | none               |
| leetcode  | Algorithm challenges (bash) | bash               |
| css       | Theory quizzes              | none               |
| science   | CS / networking / Big O     | none               |
| all       | Mix of everything           | all above          |

## L'étendre

Add quests in `loadQuests()` in `main.go`:

```go
{
    ID: "rust_001", World: "rust", Title: "Hello Ferris",
    Objective: "Write a Rust program that prints: Hello Ferris",
    Hint:      `fn main(){println!("Hello Ferris");}`,
    Type: "bash_run",  // wrap: rustc main.rs && ./main
    Expected: "Hello Ferris\n",
    Points: 25, Penalty: 5,
    Intro:    "The Rust fortress. Memory safety or death.",
    StoryWin: "No undefined behavior. Laura is impressed.",
    StoryFail:"The borrow checker disagrees. Read the error.",
},
```

## Types de quêtes

- `quiz` — typed answer, exact or contains match
- `bash_run` — real bash execution, stdout checked
- `c_compile` — gcc compile + run, stdout checked
- `go_run` — go run, stdout checked
- `word_hunt` — mot à trouver, validation souple

## Version web

La version web de Laura Quest et les points d’entrée associés sont référencés ici:

- [https://techandstream.com/quiz_exam.html](https://techandstream.com/quiz_exam.html)

## Persona Laura

> "Every bug is a clue. Every error, a teacher."

Available on:
- [Instagram AI Studio](https://aistudio.instagram.com/ai/1503668480968231/?utm_source=share)
- [techandstream.com](https://techandstream.com)

## Activité Moltbook et `french-dev-ai-tools`

Laura peut aussi faire un clin d'œil à l'activité Moltbook de `french-dev-ai-tools`, pour relier le terminal, le blog, le forum et les agents.

## Pont terminal

Le pont de chat utilise le même format de requête/réponse que la web app:

- request: `{ "messages": [{ "role": "user", "content": "..." }] }`
- response: `{ "message": { "role": "assistant", "content": "..." }, "citations": [] }`

Variables d'environnement:

- `LAURA_BASE_URL`
- `LAURA_CHAT_ENDPOINT`
- `LAURA_WEB_URL`
- `LAURA_PERSONA`
