# Agent Handoff for Larger Model

## Current repo state

- Branch `main`, working tree clean, remote `origin → github.com/Kvnbbg/Laura.git`.
- Recent activity: voice dictation chat features, error-boundary recovery fixes, QEA iteration planning, donation page.

## Detected stack

- Frontend: Vite 7 + React 18 + TypeScript (strict), SCSS, React Router, ESLint 8, Prettier, Vitest 3 + Testing Library + jsdom (6 test files).
- Backend: lightweight Express proxy (`server/index.js`, port 4000) for Mistral chat + RAG/attachments.
- Terminal bridge: Go 1.22 (`laura_quest_main.go`, `cmd/`, `internal/`) — `go run` / `go build` workflow.
- Deployment: Railway (`railway.toml`, `RAILWAY_DEPLOYMENT.md`, `.railwayignore`).
- No Supabase, no Stripe/payments — this is a chat/cosmic-UI companion product, not a payments product.

## Top 3 risks observed

1. **Repo hygiene**: large committed binaries in the working tree (`laura_quest_main` 9.3 MB compiled binary, `dist/`, `node_modules` listed at top level) — worth checking `.gitignore` coverage to avoid bloating the repo.
2. **Lint baseline**: `npm run lint` enforces `--max-warnings 0`; needs to pass cleanly before any patch batch lands (result pending in `AGENT_RUN_LOG.md`).
3. **Mixed-language repo**: Go terminal bridge + Node/TS frontend in one repo raises CI/test coordination concerns — confirm whether Go code has its own test/build pipeline separate from `npm` scripts.

## Batch 1 — completed

Baseline verification surfaced 2 failing tests in `src/App.test.tsx` (`renders primary navigation
entries`, `navigates through advanced routes and displays route-specific headings`), both failing
with `Test timed out in 5000ms` while actually completing in 6.7–8.3s — a slow-render/jsdom timing
issue, not a logic bug (3 sibling sync render tests in the same file pass fine). Fix: raised the
per-test timeout to 15000ms for those two tests, mirroring the existing explicit-timeout pattern
already in the file (`}, 10000);` on the async chat-flow test). Verified with
`npx vitest run src/App.test.tsx` — 5/5 pass. Single-purpose, 2-line diff, committed standalone.

## Suggested next batch (not yet started)

- Investigate repo hygiene: large committed binary `laura_quest_main` (9.3MB) and `dist/` —
  confirm whether these belong in `.gitignore`.
- Confirm whether the Go terminal bridge has its own CI/test pipeline separate from npm scripts.

## Commands run

```sh
git status --short
npx tsc --noEmit          # PASS
npx vitest run            # 1 file / 2 tests failed (timeout) before batch 1; 6/6 files, 18/18 after
npx eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   # PASS
```

## Files changed in batch 1

- `src/App.test.tsx` — 2 one-line edits (per-test timeout `15000` added to two `it(...)` blocks).
