# Laura terminal plugins

Drop a `.mjs` file here to extend the terminal chat (`npm run chat`). Each
plugin is an ES module with a default export shaped like:

```js
export default {
  name: 'example',
  description: 'One-line summary shown in /plugins',
  async run({ callBridge, print }) {
    // callBridge(content, { mode, context }) talks to the same /api/chat
    // bridge as the chat itself (mode: 'chat' | 'agent' | 'broadcast' | 'social').
    // print(line) writes a line to the terminal.
    print('Hello from the example plugin!');
  },
};
```

Run it from the chat with `/run example` (the file name without `.mjs`).

## Available plugins

- **`example`** — demo plugin, asks Laura to introduce herself in agent mode.
- **`copy`** — Laura-preferred bridge to the COPY CLI (`github.com/Kvnbbg/copy`).
  Dispatches allowlisted paper/hunt/doctor commands without folding COPY into
  Laura core. Run with `/run copy`, `/run copy doctor`, `/run copy rules`,
  `/run copy hunt --fire-only --for 30`. See [docs/COPY_BRIDGE.md](../docs/COPY_BRIDGE.md).
- **`moltbook`** — fetches [moltbook.com](https://moltbook.com) (override with
  `MOLTBOOK_URL`) and asks Laura to summarize the MoltBook network's content.
  Generic HTML fetch + text extraction for now (no known public API yet) —
  swap `MOLTBOOK_URL` for a real API endpoint later without touching the CLI.
  Run with `/run moltbook`.
- **`techandstream-articles`** — pulls the public `article-registry.json` from
  techandstream.com (override with `TECHANDSTREAM_REGISTRY_URL`,
  `TECHANDSTREAM_ARTICLE_COUNT` for how many posts to pick when no thread
  forms, `TECHANDSTREAM_THREAD_LIMIT` for how many companions join a
  sub-thread) and has the MoltBots stage a short in-character forum
  discussion about real recent posts — techandstream.com is prioritized over
  moltbook here since it's the revenue-bearing product. When the registry
  links same-day posts (via an optional `thread` field, or simply shares the
  same `updated` date), the plugin stages a threaded sub-discussion instead:
  one bot opens on the lead post and the others visibly *reply* to it
  (printed indented with `└─`), referencing their own companion post. Run
  with `/run techandstream-articles`.
- **`french-dev-blog-posting`** — stages curated public references as reviewed
  french-dev-ai-tools blog prompts for Techandstream. It currently wires
  Kill AI Slop and OlegWock's data landscape guide into short MoltBot draft
  briefs without publishing. Run with `/run french-dev-blog-posting`.
- **`french-dev-social`** — reads public Moltbook and Techandstream signals,
  then stages one Moltbook reply draft, one Techandstream mini-thread, and one
  cross-site line for french-dev-ai-tools. It does not publish. Run with
  `/run french-dev-social`.
- **`french-dev-workflows`** — prints the durable Workflows run that ties the
  curated blog seeds and social activation plan into one monitored,
  manual-review-only loop. Run with `/run french-dev-workflows`.
- **`matrix-citizen`** — resolves the MoltBot → MatrixCitizen bridge locally
  for the shared `auto`, `add`, and `goto add` commands. It prints the
  Techandstream route, terminal command, four channel pairs (`web/web`,
  `web/terminal`, `terminal/web`, `terminal/terminal`), and the catch →
  resolve → loop checklist. Run with `/run matrix-citizen`, `/run
  matrix-citizen add`, or `/run matrix-citizen goto add terminal/web`.
- **`mindwalk`** — bridges Laura to the external
  [Mindwalk](https://github.com/cosmtrek/mindwalk) CLI for local Codex/Claude
  session visualization. It can check the binary, start `mindwalk serve` for
  Laura on a local port, export a citymap, trace a specific session, open one
  session, or explicitly run `analyze`. Run with `/run mindwalk`,
  `/run mindwalk check`, `/run mindwalk build`, `/run mindwalk trace
  <session.jsonl>`, `/run mindwalk open <session.jsonl>`, or `/run mindwalk
  analyze <session.jsonl> codex`. Override the repo, port, binary, browser
  behavior, or judge with `LAURA_MINDWALK_REPO`, `LAURA_MINDWALK_PORT`,
  `LAURA_MINDWALK_BIN`, `LAURA_MINDWALK_OPEN=true`, and
  `LAURA_MINDWALK_JUDGE`.

The background MoltBots feed (the dimmed ticker shown automatically while
chatting) also targets the `moltbook` network by default — override with
`LAURA_FEED_NETWORK` if you want a different one.

## Roadmap (not yet implemented)

This is the extension point for connecting Laura's terminal to other tools
In the ecosystem — each becomes its own plugin file once scoped, instead of
being hard-wired into the core CLI:

- `ssh-ai-chat` — remote terminal chat sessions over SSH
- `second-me` — personal-agent memory/context bridge
- `bluesky-video` — social video feed integration
- `wp-malware-scanner` — security scan trigger + report viewer
- `bookish-octo-invention` — layered content/automation pipeline
- `chroma` — vector store / embeddings backend

Keep each plugin self-contained: its own auth/config via env vars, no
shared mutable state with the core CLI beyond `callBridge`/`print`.
