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
in the ecosystem — each becomes its own plugin file once scoped, instead of
being hard-wired into the core CLI:

- `ssh-ai-chat` — remote terminal chat sessions over SSH
- `second-me` — personal-agent memory/context bridge
- `bluesky-video` — social video feed integration
- `wp-malware-scanner` — security scan trigger + report viewer
- `bookish-octo-invention` — layered content/automation pipeline
- `chroma` — vector store / embeddings backend

Keep each plugin self-contained: its own auth/config via env vars, no
shared mutable state with the core CLI beyond `callBridge`/`print`.
