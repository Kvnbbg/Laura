# Laura terminal plugins

Drop a `.mjs` file here to extend the terminal chat (`npm run chat`). Each
plugin is an ES module with a default export:

```js
export default {
  name: 'example',
  description: 'One-line summary shown in /plugins',
  async run({ callBridge, print, args }) {
    print('Hello from the example plugin!');
  },
};
```

Run with `/run <name>` (filename without `.mjs`).

Shared helpers (DRY, no compile deps): [`lib/safe-cli.mjs`](./lib/safe-cli.mjs)
— `which`, `runBin` (argv only), `installHint`, `binMap`.

## Core orchestration (symbiosis)

| Plugin | Role |
| --- | --- |
| **symbiosis** | Registry + health + next steps |
| **guide** | Never-lost command paths |
| **protocols** | MCP, A2A, SQL checkpoints |
| **memory** | Local Markdown RAG + optional `mem` CLI |
| **orchestra** | Multi-agent plan JSON (no arbitrary spawn) |
| **agents** | Hermes, OpenClaw, Pico, Pi, AO, Aider… |
| **ecosystem** | Tigerless / Anakin / cost-xray pilots |
| **grimoire** | Spellbook + install hints |

## Bridges (external CLIs)

| Plugin | Role |
| --- | --- |
| **copy** | COPY paper/hunt bridge — [docs/COPY_BRIDGE.md](../docs/COPY_BRIDGE.md) |
| **rustfx** | rustFX Web3 engine — [docs/RUSTFX_ENGINE.md](../docs/RUSTFX_ENGINE.md) |
| **rune** | Rune IDE pilot — [docs/RUNE_KIT.md](../docs/RUNE_KIT.md) |
| **mindwalk** | Mindwalk session bridge |

## Content / social staging

`moltbook`, `techandstream-articles`, `french-dev-*`, `matrix-citizen` — stage
drafts; do not publish without human review.

## Health

```bash
node scripts/plugin-health.mjs
/run symbiosis status
/run symbiosis next
```

## Rules

1. Self-contained env config  
2. No shared mutable state beyond `print` / `callBridge`  
3. Never auto-run remote installers — print hints only  
4. End user-facing output with copy-paste next commands  

Map: [docs/SYMBIOSIS.md](../docs/SYMBIOSIS.md)
