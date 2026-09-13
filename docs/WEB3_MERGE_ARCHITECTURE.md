# Laura × COPY × Web3 merge architecture

Three planes, one operator surface. Laura remains preferred. COPY remains the paper engine. Web3 remains a read-and-queue boundary, never a silent signer.

```text
                    +------------------+
                    |   Operator       |
                    +--------+---------+
                             |
              +--------------+---------------+
              |                              |
       Laura CLI / chat / web          COPY CLI (sibling)
       preferred orchestrator          hunt / walls / paper
              |                              |
              +--------------+---------------+
                             |
                    Merge contract v1
                    /api/web3/merge
                             |
              +--------------+---------------+
              |              |               |
         Chain health    Paper desk     Native queue
         (RPC id only)   (COPY state)   (webhook empty =
                                        queue-only)
```

## Planes

| Plane | Owner | Duty |
| --- | --- | --- |
| Companion | Laura (`cmd/laura`, `npm run chat`, SPA) | Persona, plugins, MatrixCitizen, web routes |
| Market engine | COPY (`github.com/Kvnbbg/copy`) | Token universe, flow walls, SHADOW, PAPER |
| Settlement boundary | Web3 merge contract | Chain-id health, paper summaries, optional external executor webhook |

COPY already documents why the terminal is not the executor: opening a TUI must not gain custody; paper must not become a live broadcast path; any future executor is audited separately.

## Contract (`laura-copy-web3-merge-v1`)

Public JSON only:

- preferred CLI name (`laura`)
- allowlisted COPY verbs
- chain health: `chainId` string or `unknown`
- paper posture: slots, budget label, last FIRE/SKIP reason text
- queue: `idle` | `queued` | `unavailable`
- blocked: wallet connect, signing keys, `VITE_*` secrets, automatic install

No private keys, no seed phrases, no raw `.env`.

## Runtime wiring

1. Web and chat call `GET /api/web3/merge`.
2. The merge module reads environment, never the browser.
3. If `LAURA_COPY_REPO` or `COPY_RUNTIME_FILE` is set, paper counts may be summarized from COPY's local `data/runtime.json` when that file exists.
4. If `RH_RPC_URL` or `LAURA_CHAIN_RPC` is set, the module may request `eth_chainId` only.
5. `NATIVE_EXECUTOR_WEBHOOK` empty means queue-only. Laura will not invent a signer.

## Commands the merge may suggest

```text
/run copy doctor
/run copy rules
/run copy hunt --fire-only --for 30
node bin/laura-copy.mjs positions
```

Live `copy web` remains optional and stays in the COPY repo.

## Safety

- Paper is the default execution story inside Laura.
- FIRE is counsel for the operator, not an automatic on-chain send.
- Robinhood Chain context is health and market marks, not custody.
