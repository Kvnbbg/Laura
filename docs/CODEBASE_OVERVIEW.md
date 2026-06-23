# Laura Codebase Overview

Laura is an open-source companion app for building and piloting small agent flows from a web UI or terminal. The codebase is intentionally compact: a Vite React frontend, a lightweight Express bridge, terminal plugins, and a Go terminal quest engine.

## Runtime Map

| Surface | Files | Role |
|---|---|---|
| Web app | `src/App.tsx`, `src/pages/*`, `src/components/*` | React routes, cosmic UI, chat page, dashboard, growth lab, eco hub |
| API bridge | `server/index.js` | Mistral or Ollama chat proxy, RAG upload flow, MoltBots metadata |
| Terminal chat | `bin/laura-cli.mjs` | Text interface that talks to the same `/api/chat` bridge |
| Terminal plugins | `terminal-plugins/*.mjs` | Read-only extensions such as Moltbook and Techandstream article discussions |
| Go CLI | `cmd/laura`, `internal/*`, `data/quests.json` | RPG-style learning game, quests, terminal-first progression |
| Static assets | `public/*` | Training JSON and simple static documents |

## Core Flow

1. The user opens Laura in the browser or terminal.
2. Laura sends chat messages to `server/index.js`.
3. The server adds a short system frame: terminal-first, public-safe, no private log exposure.
4. The server calls Mistral when `MISTRAL_API_KEY` exists, or streams through local Ollama when `OLLAMA_MODEL` is configured.
5. The response returns as a web chat answer, terminal answer, or MoltBots-style public summary.

## MoltBots And Techandstream

Laura does not secretly control Techandstream. It prepares safe, public-facing MoltBot conversations from open inputs:

- `terminal-plugins/moltbook.mjs` fetches readable public text from `moltbook.com`.
- `terminal-plugins/techandstream-articles.mjs` reads the public `article-registry.json` from Techandstream.
- The bridge asks Laura to turn those public signals into short MoltBot discussions.

That makes Laura closer to a terminal/web bot forge: like crafting Telegram bots in Python, but with one shared interface that can talk from the terminal, the Laura web UI, and public Techandstream surfaces.

## KISS UI Vocabulary

When the project discusses UI blocks, keep the vocabulary small:

- `Card`
- `Accordion`
- `Modal`
- `Drawer`
- `Toast`
- `Skeleton`
- `Badge`
- `Table`
- `Pagination`
- `Breadcrumb`

This is a product constraint, not a dependency mandate. Do not introduce a full design-system package unless the current pages genuinely need it.

## What To Change First

For small patches:

1. Prefer docs or prompt wording over new infrastructure.
2. Keep plugins read-only unless a user explicitly approves a write action.
3. Keep `server/index.js` as the bridge boundary for chat and MoltBots.
4. Run `npm run build` before calling the change done.

For Go quest changes:

1. Edit content in `data/quests.json`.
2. Keep runtime fallback data synchronized if the Go package embeds it.
3. Run `gofmt`, `go vet ./...`, `go test ./...`, and `go build -o bin/laura ./cmd/laura` when the Go package is touched.
