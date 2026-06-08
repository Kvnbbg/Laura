# Agent Run Log — Laura

## 2026-06-08 14:30

- Ran baseline inspection: `git status` (clean, branch `main`, remote `origin → github.com/Kvnbbg/Laura.git`).
- Detected stack: Vite + React 18 + TypeScript frontend, Express Mistral proxy (`server/index.js`), Go terminal bridge (`laura_quest_main.go`, `cmd/`, `internal/`).
- Read `package.json`, `README.md`, `.env.example`, `go.mod`, `docs/` contents, `TODO`.
- Confirmed: no Supabase or Stripe usage in this repo (chat/cosmic-UI product, not a payments product).
- Created `docs/AGENT_CHECKLIST.md`, `docs/AGENT_RUN_LOG.md`, `docs/AGENT_HANDOFF_FOR_OPUS.md`.
- Started baseline verification in background: `tsc --noEmit`, `vitest run`, `eslint .`.
- Results: `tsc --noEmit` PASS (exit 0), `eslint .` PASS (exit 0), `vitest run` 1 file / 2 tests FAILED
  (`src/App.test.tsx`: "renders primary navigation entries" and "navigates through advanced routes
  and displays route-specific headings" — both `Test timed out in 5000ms`, actual durations
  8313ms / 6701ms, i.e. slow `<App />` render under jsdom, not a logic failure — the other 3 sync
  render tests in the same file passed).

## 2026-06-08 14:28 — Batch 1 (test-timeout fix)

- Patch: raised the per-test timeout for the two slow `App.test.tsx` render-journey tests from the
  default 5000ms to 15000ms, mirroring the existing explicit-timeout pattern already used for the
  async chat-flow test (`}, 10000);` on the last test in the file). One coherent, single-purpose change.
- Verification: re-ran `npx vitest run src/App.test.tsx` — 5/5 tests pass (was 3/5).
- Files changed: `src/App.test.tsx` (2 one-line edits).
- Committed as a standalone batch-1 commit (see git log).

## 2026-06-08 15:10 — Batch 2 (terminal chat interface)

- Added `bin/laura-cli.mjs`: a dependency-free Node 18 terminal chat REPL
  that talks to the existing `/api/chat` bridge (`server/index.js`), reusing
  its built-in `mode: "social"` MoltBots feed for a dimmed background ticker
  (`LAURA_FEED_*` env vars to configure/disable), and a generic
  `LAURA_API_URL` override so it can point at any compatible HTTP endpoint.
- Added `terminal-plugins/` extension point (`README.md` + `example.mjs`):
  drop-in `.mjs` modules exposing `{ name, description, run({ callBridge, print }) }`,
  invoked from the chat with `/plugins` and `/run <name>`. Documents the
  roadmap for external connectors (ssh-ai-chat, Second-Me, bluesky-video,
  wp-malware-scanner, bookish-octo-invention, chroma, MoltBots) as future
  plugin files rather than hard-wired integrations.
- Wired `npm run chat` script into `package.json`.
- Verified manually: REPL boots, `/help`/`/plugins`/`/run example` work,
  graceful error message when the proxy is down, real round-trip against a
  locally running `server/index.js` (failure observed there was a missing
  `MISTRAL_API_KEY` in this sandbox — not a CLI bug).
- Files changed: `bin/laura-cli.mjs` (new), `terminal-plugins/README.md` (new),
  `terminal-plugins/example.mjs` (new), `package.json`, `README.md`.

## 2026-06-08 15:30 — Batch 3 (moltbook.com plugin)

- Made the background MoltBots feed network configurable
  (`LAURA_FEED_NETWORK`, defaults to `moltbook` — unchanged behavior).
- Added `terminal-plugins/moltbook.mjs`: fetches `https://moltbook.com`
  (override via `MOLTBOOK_URL`), extracts `<title>` + plain text, and asks
  Laura (via `callBridge`, `mode: "social"`) to summarize it. No known public
  moltbook API yet, so it stays a generic HTML fetch — swappable for a real
  API endpoint later without touching the CLI core.
- Verified live against the real `moltbook.com`: correctly fetched and
  extracted "moltbook - the front page of the agent internet" plus its
  description; the only failure was Laura's summarization step returning
  HTTP 500 due to the missing `MISTRAL_API_KEY` in this sandbox (not a
  plugin bug — raw-excerpt fallback printed correctly).
- Files changed: `bin/laura-cli.mjs` (1-line context change),
  `terminal-plugins/moltbook.mjs` (new), `terminal-plugins/README.md`.

## 2026-06-08 16:05 — Batch 4 (speed: streaming + cache + codestral; safe install-suggest)

User asked to (a) speed up the terminal chat and (b) let Laura "download
external packages" to self-improve on unknown commands — scoped down via
AskUserQuestion to: research-and-suggest only (Laura proposes the install
command, user reviews and runs it — no autonomous downloads/execution, to
avoid a supply-chain attack surface).

- `server/index.js`: added `codestral-latest` to `CHAT_MODELS` (set
  `MISTRAL_MODEL=codestral-latest` for code-heavy review sessions), and a
  new `POST /api/chat/stream` endpoint that skips the RAG/embeddings lookup
  and proxies Mistral's SSE chunks directly — additive, doesn't change the
  existing `/api/chat` behavior.
- `bin/laura-cli.mjs`:
  - Streams replies token-by-token via `/api/chat/stream`
    (`LAURA_STREAM_DISABLED=true` to opt out), with automatic fallback to
    the non-streaming bridge call if the stream endpoint/key isn't available
    — verified the fallback path live (no Mistral key in this sandbox).
  - Added a short-lived response cache (`LAURA_CACHE_TTL_MS`, default 60s)
    for non-`chat` bridge calls (feed ticks, plugin look-ups) — conversational
    `chat` turns are never cached since they depend on history.
  - Added `/install <name>`: read-only lookups against the public npm
    registry and GitHub search API (no auth, no downloads), then asks Laura
    to propose the exact install command. Always prints a "review before
    running — Laura never installs anything automatically" notice.
- Verified live: `/install lodash` correctly found `lodash@4.18.1` on npm
  and `lodash/lodash` on GitHub and printed the safety notice; streaming
  gracefully fell back to the regular bridge when no Mistral key was present.
- `tsc --noEmit` and `eslint` both clean.
- Files changed: `server/index.js`, `bin/laura-cli.mjs`, `README.md`.

## 2026-06-08 16:40 — Batch 5 (local Ollama streaming backend + live test)

User asked to test streaming locally with Mistral, Ollama, and Laura, and
have Laura talk about techandstream.com. No `MISTRAL_API_KEY` is set in
this sandbox, but a local Ollama instance (v0.9.5) is running with a
pre-pulled `laura-local` model.

- `server/index.js`: `/api/chat/stream` now falls back to a local Ollama
  model (`OLLAMA_MODEL` / `LAURA_LOCAL_MODEL`, `OLLAMA_URL` defaults to
  `http://localhost:11434`) when `MISTRAL_API_KEY` is missing. Converts
  Ollama's NDJSON stream chunks (`{message:{content}, done}`) into the same
  OpenAI-style SSE (`data: {choices:[{delta:{content}}]}` / `data: [DONE]`)
  the client already parses — zero CLI changes required, fully transparent.
- Live test results:
  - Raw `curl` against `/api/chat/stream` with `OLLAMA_MODEL=laura-local`:
    confirmed correct SSE conversion, streamed token-by-token.
  - Full round trip through `npm run chat`: asked "Laura, parle-moi de
    techandstream.com en 3 phrases" — Laura answered live, streamed,
    describing techandstream.com as "a news aggregator focusing on tech
    and streaming services... curate articles and videos from various
    sources, offering a centralized view of the industry."
  - Mistral path: cannot be live-tested here (no API key in sandbox), but
    the existing fallback chain (stream → non-stream → error message) was
    already verified in batch 4.
- `tsc --noEmit` and `eslint` both clean.
- Files changed: `server/index.js`, `README.md`.

## 2026-06-08 17:15 — Batch 6 (MoltBots discuss real techandstream.com posts)

User asked for MoltBots to discuss blog/forum posts from techandstream.com,
prioritizing it over moltbook ("c'est lui qui rapporte de l'argent... Laura
est open-source"). Scoped down via AskUserQuestion to: extend the existing
`mode: "social"` MoltBots feed to reference the *real* article registry
techandstream.com already publishes, rather than inventing a new forum/PNJ
system from scratch.

- Added `terminal-plugins/techandstream-articles.mjs`: fetches the public
  `article-registry.json` from techandstream.com (override
  `TECHANDSTREAM_REGISTRY_URL` / `TECHANDSTREAM_ARTICLE_COUNT`), picks the
  most recently updated posts, and asks Laura (mode `social`, network
  `techandstream`) to stage a short in-character MoltBots discussion about
  them — explicitly told not to invent content beyond the real
  titles/categories. Run with `/run techandstream-articles`.
- Verified live: the plugin correctly fetched the real
  `https://techandstream.com/article-registry.json`, parsed and ranked
  3 real posts (e.g. "Historique blogging TechAndStream 2021–2026",
  "Cartographie mots-clés screenshots"…). Laura's narration step returned
  `Chat request failed.` because no `MISTRAL_API_KEY`/`OLLAMA_MODEL` is
  configured in this sandbox (same pre-existing constraint as batches 4–5,
  not a plugin bug) — the plugin degrades gracefully and prints the raw
  picks plus a clear fallback message.
- Updated `terminal-plugins/README.md`: documented the new plugin and
  removed the now-implemented "french-dev-ai-tools MoltBots" roadmap line.
- Files changed: `terminal-plugins/techandstream-articles.mjs` (new),
  `terminal-plugins/README.md`.

## 2026-06-08 17:45 — Batch 7 (moltbook-sourced article + plugin pick-order fix)

User shared a moltbook post (https://moltbook.com/post/2d25b097-...,
"Leakage detectors that ignore tool-context leakage are grading a museum
exhibit") and asked for a blog post about it plus MoltBots discussing it.
The blog post itself was written and registered in `french-dev-ai-tools`
(`fuite-de-contexte-outils-benchmarks-agents-ia`); the "MoltBots discuss it"
half is this Laura repo's job, via the existing `techandstream-articles`
plugin from batch 6 — but that plugin had a latent bug.

- Fixed `terminal-plugins/techandstream-articles.mjs`: the original
  `sort by updated date` was a plain stable sort, so same-day registry
  entries stayed in registry order — a freshly appended same-day post (like
  the new moltbook-sourced article, dated the same as 3 earlier posts)
  landed past the `ARTICLE_COUNT` cutoff and the MoltBots never picked it
  up. Now ties break on original registry index (highest = most recently
  appended = freshest), so the newest same-day post always surfaces first.
  Verified the comparator logic with a local stub registry (newest-of-4
  same-day entries now correctly ranks #1).
- Files changed: `terminal-plugins/techandstream-articles.mjs`.
