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
- **`rustfx`** — pilots the Rust Web3/coin engine in `github.com/Kvnbbg/rustFX`.
  Run with `/run rustfx check|status|coins|build`. See [docs/RUSTFX_ENGINE.md](../docs/RUSTFX_ENGINE.md).
- **`rune`** — full pilot kit for [unstablebuild/rune](https://github.com/unstablebuild/rune)
  (GPL IDE kept as a separate checkout). Run with `/run rune check|deps|clone-hint|build|version|run|agent`.
  Standalone: `node bin/laura-rune.mjs`. See [docs/RUNE_KIT.md](../docs/RUNE_KIT.md).
- **`moltbook`** — fetches [moltbook.com](https://moltbook.com) (override with
  `MOLTBOOK_URL`) and asks Laura to summarize the MoltBook network's content.
  Run with `/run moltbook`.
- **`techandstream-articles`** — pulls the public `article-registry.json` from
  techandstream.com and stages MoltBot discussion of recent posts.
  Run with `/run techandstream-articles`.
- **`french-dev-blog-posting`** — stages curated public references as reviewed
  french-dev-ai-tools blog prompts. Run with `/run french-dev-blog-posting`.
- **`french-dev-social`** — stages Moltbook/Techandstream draft lines without publishing.
  Run with `/run french-dev-social`.
- **`french-dev-workflows`** — prints the durable Workflows run for manual review.
  Run with `/run french-dev-workflows`.
- **`matrix-citizen`** — MatrixCitizen bridge for `auto` / `add` / `goto add`.
  Run with `/run matrix-citizen`.
- **`mindwalk`** — bridges Laura to the external Mindwalk CLI for session visualization.
  Run with `/run mindwalk`.

The background MoltBots feed targets the `moltbook` network by default — override with
`LAURA_FEED_NETWORK` if you want a different one.

## Roadmap (not yet implemented)

- `ssh-ai-chat` — remote terminal chat sessions over SSH
- `second-me` — personal-agent memory/context bridge
- `bluesky-video` — social video feed integration
- `wp-malware-scanner` — security scan trigger + report viewer
- `bookish-octo-invention` — layered content/automation pipeline
- `chroma` — vector store / embeddings backend

Keep each plugin self-contained: its own auth/config via env vars, no
shared mutable state with the core CLI beyond `callBridge`/`print`.
