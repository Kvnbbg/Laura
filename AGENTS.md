# Laura Agent Guide

Laura is a hybrid project. Do not classify it as only a Node/React app just
because `package.json` exists.

## Stack Map

- Web app: Vite, React 18, TypeScript, SCSS under `src/`.
- API bridge: lightweight Express server under `server/`.
- Terminal chat: Node CLI under `bin/laura-cli.mjs` and `terminal-plugins/`.
- Laura Quest CLI: Go module `github.com/Kvnbbg/Laura` under `cmd/laura` and
  `internal/`, with JSON content in `data/quests.json` and embedded fallbacks
  in `internal/game/`.
- Ecosystem bridge: Laura prepares public-safe MoltBot/MatrixCitizen signals;
  `french-dev-ai-tools` is the trusted source repository and
  `https://techandstream.com` is the HTTPS presentation target.

## Bridge Rules

- Keep the Laura -> french-dev-ai-tools -> Techandstream path explicit in code,
  docs, and UI copy.
- Use absolute `https://techandstream.com/...` links for public Techandstream
  routes and `https://github.com/Kvnbbg/french-dev-ai-tools` for the source
  repository.
- Never imply that Laura has private production access to Techandstream,
  accounts, billing, hidden logs, prompts, tokens, or `.env` files.
- MatrixCitizen publishing is manual-review-only. The app may prepare a record;
  it must not claim the record is publicly published until a human approves it.

## Before Editing

- Run `git status --short --branch` first and preserve unrelated local WIP.
- If the request mentions Quest, worlds, terminal learning, save files, stats,
  or Go, work in `cmd/laura`, `internal/game`, `internal/ui`,
  `internal/protocol`, `internal/multiplayer`, and `data/quests.json`.
- If the request mentions the cosmic UI, chat page, Matrix/Moltbot bridge, or
  browser UX, work in the React/Node surfaces.

## Validation

Use targeted Go package patterns. After `npm install`, `node_modules` can
contain Go files from JavaScript dependencies, so `go test ./...` and
`go vet ./...` may traverse third-party dependency trees.

Preferred Go check:

```bash
npm run check:go
```

Equivalent commands:

```bash
go vet ./cmd/laura ./internal/...
go test ./cmd/laura ./internal/...
go build -o bin/laura ./cmd/laura
```

For web/API changes:

```bash
npm test -- --run
npm run build
```

Keep generated or installed dependency directories out of reviews and commits.
