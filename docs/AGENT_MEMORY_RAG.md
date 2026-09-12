# Laura × agent-memory × Ollama RAG

Long-term memory for Laura follows the [tigerless-labs/agent-memory](https://github.com/tigerless-labs/agent-memory) model:

- **Markdown files are the source of truth**
- Ranked recall returns paths + snippets
- No API key required for the local path
- Optional **Ollama embeddings** (`nomic-embed-text`) fused with keyword score

## Layers

| Layer | Role |
| --- | --- |
| `mem` CLI (optional) | Full tigerless runtime: boundary writes, sleep, shared store with Claude/Codex |
| `server/memory-rag.mjs` | Always-on Laura fallback: `~/.laura-memory/notes/*.md` |
| Chat injection | `/api/chat` can prepend `buildRagContext(lastUserMessage)` when `LAURA_RAG=1` |
| Ollama chat model | Answers using injected memory + multi-model switch (`/model`) |

## Setup

```bash
# 1) Optional full agent-memory
git clone https://github.com/tigerless-labs/agent-memory.git
cd agent-memory && uv sync --all-packages
export PATH="$PWD/.venv/bin:$PATH"
export AGENT_MEMORY_STORE="$HOME/agent-memory-store"
mem init

# 2) Embeddings for Laura local RAG
ollama pull nomic-embed-text
export OLLAMA_EMBED_MODEL=nomic-embed-text
export LAURA_MEMORY_STORE="$HOME/.laura-memory"
export LAURA_RAG=1

# 3) Chat model
export OLLAMA_MODEL=qwen2.5:3b
npm run dev:server
npm run chat
```

## Terminal

```text
/run memory status
/run memory init
/run memory record Preferred local model|Use qwen2.5:3b for daily Laura chat.
/run memory recall preferred model
/run memory context how does Laura do RAG
/run ecosystem list
/run ecosystem agent-memory install-hint
/run ecosystem cost-xray install-hint
/run ecosystem anakin status
```

## Ecosystem map (pilots only)

| Tool | Repo | Laura command |
| --- | --- | --- |
| agent-memory | tigerless-labs/agent-memory | `/run memory`, `/run ecosystem agent-memory` |
| cost-xray | tigerless-labs/cost-xray | `/run ecosystem cost-xray` |
| paper-radar | tigerless-labs/paper-radar | `/run ecosystem paper-radar` |
| seo-ops | tigerless-labs/seo-ops | `/run ecosystem seo-ops` |
| anakin-cli | Anakin-Inc/anakin-cli | `/run ecosystem anakin` |
| anakin | Anakin-Inc/anakin | same family; CLI is the entry |
| agent-orchestrator | Untrivial-ai/agent-orchestrator | `/run ecosystem ao` (desktop release) |

Laura **never** pipes remote installers without printing them first.

## Script

```bash
node scripts/laura-memory-recall.mjs "ollama multi model"
```
