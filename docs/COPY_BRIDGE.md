# Laura ↔ COPY cross-app utility

Laura remains the preferred CLI. COPY stays a sibling engine for Robinhood Chain discovery, flow walls, paper positions, and the native queue.

Source: https://github.com/Kvnbbg/copy

## Why Laura first

Both products are CLI-first. Laura already owns chat, plugins, MatrixCitizen bridge, and web/terminal pairing. COPY owns market flow and paper execution. Merging COPY into Laura as a hard-wired monolith would mix Node copytrade runtime with the Go companion CLI. The durable pattern is a plugin plus optional subprocess.

```
operator
  → laura / npm run chat / cmd/laura
    → /run copy <subcommand>
      → copy binary or copy repo bin/copy.mjs
        → doctor | rules | hunt | paper | positions | scan | trader
```

## Commands from Laura chat

```text
/run copy
/run copy doctor
/run copy rules
/run copy positions
/run copy hunt --fire-only --for 30
/run copy scan CASHCAT
/run copy trader ether_monk
```

Allowed subcommands are allowlisted in `terminal-plugins/copy.mjs`. Live wallet connect is not invoked from Laura.

## Environment

| Variable | Purpose |
| --- | --- |
| `LAURA_COPY_BIN` | Explicit COPY executable |
| `LAURA_COPY_REPO` | Checkout of Kvnbbg/copy so Laura can run `bin/copy.mjs` via Node |

COPY still reads its own `.env` (`REPLYNODES_API_KEY`, `FOMO_BEARER_TOKEN`, and related provider settings). Do not place those secrets in `VITE_*` variables.

## Install COPY beside Laura

```bash
git clone https://github.com/Kvnbbg/copy.git
cd copy
npm install
cp .env.example .env
npm run doctor
```

Optional global command:

```bash
npm install -g .
copy doctor --probe
```

Then from Laura:

```bash
export LAURA_COPY_REPO="$HOME/src/copy"
npm run chat
# /run copy doctor
```

## Safety

- Laura does not clone, install, or mutate COPY automatically.
- Paper mode stays local to COPY runtime files.
- The plugin streams stdout/stderr only; it does not persist COPY positions inside Laura.
- Treat COPY FIRE/SKIP output as decision context for Laura chat, not as an automatic live trade.
