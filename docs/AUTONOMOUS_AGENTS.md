# Agents autonomes autour de Laura

Laura reste le **CLI orchestrateur** (Go + terminal plugins). Les agents ci-dessous
sont des runtimes autonomes : Laura les détecte, propose l’install, et partage
la mémoire Markdown quand c’est pertinent.

## Carte

| Agent | Rôle | Commande Laura |
| --- | --- | --- |
| **Hermes** (Nous Research) | Agent multi-outils, skills, memory | `/run agents hermes` |
| **OpenClaw** | Gateway multi-canal, workspaces, MEMORY.md | `/run agents openclaw` |
| **Pico** | Agents minimaux / harness compact | `/run agents pico` |
| **Pi** | Coding agent TUI + harness | `/run agents pi` |
| **AO** | Orchestration multi-workers + Kanban | `/run agents ao` |
| **Aider** | Coding agent git-native | `/run agents aider` |
| **OpenCode** | Coding agent open-source | `/run agents opencode` |
| **Claude Code / Codex** | Hosts branchés agent-memory | `/run agents claude` / `codex` |
| **agent-memory** | Mémoire long terme Markdown | `/run memory` |

## Embeddings optimisés (Laura RAG)

`server/memory-rag.mjs` :

1. **Cache disque** `~/.laura-memory/.embed-cache/<hash>.json` — pas de re-embed si le chunk n’a pas changé
2. **Batch** `POST /api/embed` Ollama (fallback séquentiel `/api/embeddings`)
3. **Chunking** configurable (`LAURA_RAG_CHUNK_CHARS`, `LAURA_RAG_CHUNK_OVERLAP`)
4. **Fusion RRF** keyword + cosine vector
5. **Dédup** par fichier (meilleur chunk)

```bash
ollama pull nomic-embed-text
export OLLAMA_EMBED_MODEL=nomic-embed-text
export LAURA_RAG=1
export LAURA_RAG_CHUNK_CHARS=1200
export LAURA_RAG_EMBED_BATCH=16
```

## Intégration réussie (cible)

```text
Terminal Laura
  ├─ /model fast|smart     → Ollama multi-model
  ├─ /run memory recall    → RAG local (+ mem CLI si présent)
  ├─ /run agents hermes    → status / install-hint
  ├─ /run agents openclaw
  └─ /run ecosystem …      → cost-xray, anakin, seo-ops, …
         │
         ▼
  Shared Markdown memory (agent-memory store OR ~/.laura-memory)
         │
         ▼
  Autonomous agents (Hermes / OpenClaw / Aider / …) read-write same facts
```

Laura **n’exécute pas** les installers distants sans les afficher. Les agents
autonomes gardent leurs propres politiques d’approbation d’outils.
