# Laura × Rune integration kit

Complete pilot kit for [unstablebuild/rune](https://github.com/unstablebuild/rune)
from Laura. Rune is a GPU-rendered, keyboard-driven IDE (Go + cgo). Laura remains
the preferred CLI orchestrator.

**License boundary:** Rune is GPL-3.0. Laura is Apache-2.0. This kit does **not**
vendor Rune source into Laura. It only checks, suggests, builds (from a separate
checkout), and launches the Rune binary. Keep the Rune tree outside Laura.

## Architecture

```text
Ubuntu / macOS / other terminal
        |
        v
   laura (Go + npm chat plugins)     preferred pilot
        |
        +-- /run rune check|deps|clone-hint|build|run|agent|version
        +-- node bin/laura-rune.mjs …
        v
   rune / rune-agent                 separate GPL checkout
        |
        +-- editor, terminals, agents, workspaces
```

## Files in this kit

| Path | Role |
| --- | --- |
| `terminal-plugins/rune.mjs` | Chat plugin (`/run rune …`) |
| `bin/laura-rune.mjs` | Standalone dispatcher without chat |
| `internal/bridge/rune.go` | Public-safe Go payload for OpenClaw / review |
| `scripts/rune-bridge-payload.mjs` | JSON handoff |
| `docs/RUNE_KIT.md` | This document |

## Environment

| Variable | Purpose |
| --- | --- |
| `LAURA_RUNE_REPO` | Absolute path to a `git clone` of unstablebuild/rune |
| `LAURA_RUNE_BIN` | Explicit path to `rune` binary |
| `LAURA_RUNE_AGENT_BIN` | Explicit path to `rune-agent` |
| `LAURA_RUNE_DATA` | Optional data dir (`-d`), default `~/.laura-rune-dev` |

## Ubuntu / Debian deps (print only; operator runs)

```bash
sudo apt-get update
sudo apt-get install -y --no-install-recommends \
  git golang-go gcc g++ pkg-config \
  libgl1-mesa-dev libx11-dev libxrandr-dev libxcursor-dev \
  libxinerama-dev libxi-dev libxxf86vm-dev \
  libasound2-dev libwayland-dev libxkbcommon-dev
```

Source and build (operator-reviewed):

```bash
git clone https://github.com/unstablebuild/rune.git
cd rune
make rune          # -> bin/rune
# or: go run ./cmd/rune
# optional agent: make rune-agent
```

## Laura commands

```text
/run rune help
/run rune check
/run rune deps
/run rune clone-hint
/run rune build
/run rune version
/run rune run
/run rune agent
```

```bash
export LAURA_RUNE_REPO="$HOME/src/rune"
node bin/laura-rune.mjs check
node bin/laura-rune.mjs build
node bin/laura-rune.mjs run
```

## Safety

- Laura does not `curl | sh` install Rune.
- Laura does not embed GPL sources under `src/` or `cmd/`.
- `build` only runs `make rune` when `LAURA_RUNE_REPO` points at a real checkout.
- `run` launches with `-d` isolated data dir when possible so experiments do not
  touch the operator's daily Rune config.
- Docs: https://docs.rune.build/develop/building
