# Orchestration multi-agents — exploration pour Laura

Laura reste le **CLI de surface** : elle ne remplace pas Hermes, OpenClaw ou AO.
Elle **cartographie**, **propose des plans**, et **pilote** (status / install-hint /
commandes allowlistées) les runtimes qui exécutent vraiment les workers.

## Quatre couches (stack 2026)

| Couche | Question | Exemples |
| --- | --- | --- |
| **Coding agent** | Qui écrit / exécute ? | Claude Code, Codex, Aider, Pi, OpenCode, Hermes leaf |
| **Workflow** | Qu’est-ce qu’un tour terminé ? | ReAct loop, tool policy, max-turns |
| **Orchestration** | Qui coordonne l’état durable + parallèle ? | AO daemon, OpenClaw coordinator, Hermes `delegate_task` |
| **Platform** | Qui a le droit, sur quel repo / canal ? | OpenClaw gateway + bindings, AO project, Laura allowlists |

Sauter une couche → collisions de branches, contexte pollué, ou “qui a merge quoi ?”.

## Patterns structuraux

### 1. Pipeline séquentiel
A → B → C. Dépendances strictes (research → draft → review).

- **Pour** : qualité, gates claires  
- **Contre** : pas de parallélisme  
- **Où** : Hermes leaf chain, AO workers séquencés par l’orchestrator

### 2. Fan-out / orchestrator–worker
Un planificateur découpe, N workers isolés, synthèse au centre.

- **Pour** : recherche parallèle, modules indépendants  
- **Contre** : reconciliation des résultats, doublons  
- **Où** : Hermes `delegate_task(tasks=[…])`, AO spawn workers, OpenClaw team

### 3. Pipeline à stages (gates)
Stages réutilisables + validation entre étapes (tests, review agent).

- **Pour** : features critiques  
- **Contre** : latence  
- **Où** : AO Kanban (Working → Needs you → In review → Ready to merge)

### 4. Superviseur / hiérarchie
Manager → sub-managers → workers. Objectifs larges, risque de *goal drift*.

- **Pour** : programmes multi-domaines  
- **Contre** : coût de coordination  
- **Où** : OpenClaw `coordinator` + specialists ; Hermes `role=orchestrator` + `max_spawn_depth≥2`

### 5. Blackboard / mémoire partagée
Agents lisent-écrivent un état commun (Markdown, board SQLite).

- **Pour** : flexibilité, handoff  
- **Contre** : collisions si pas de leases / claim atomique  
- **Où** : agent-memory store, OpenClaw `MEMORY.md`, Hermes Kanban claims

## Comment les produits se placent

| Runtime | Isolation | Orchestration native | Mémoire |
| --- | --- | --- | --- |
| **Agent Orchestrator (AO)** | git worktree / branch par worker | Orchestrator planifie ; workers implémentent ; Kanban dérivé de faits PR/CI | Session + projet |
| **OpenClaw** | workspace + agent id + routing canaux | `agents team create` (coordinator, researcher, writer, reviewer) ; bindings | `MEMORY.md` / AGENTS.md par workspace |
| **Hermes** | conversation + terminal (+ worktree optionnel) | `delegate_task` / async ; Bot Mode ; Kanban claims | agent-memory compatible + skills |
| **Laura** | n/a (pilote) | plan JSON + `/run orchestra` + allowlist status | RAG Markdown + `mem` |

## Mécanismes anti-collision (indispensables)

1. **Isolation d’espace** — worktree / workspace / sandbox, pas un seul cwd partagé  
2. **Claim atomique** — une seule claim de tâche (Hermes Kanban, AO session ownership)  
3. **Feedback loop** — CI / review / erreurs renvoyés au **même** worker  
4. **Faits durables hors transcript** — board, SQLite, Markdown mémoire (pas seulement le chat)  
5. **Profondeur de délégation bornée** — Hermes `max_spawn_depth` défaut 1  
6. **Humain aux gates** — merge, delete mémoire, installers distants

## Décision rapide

| Situation | Pattern | Runtime suggéré |
| --- | --- | --- |
| Une tâche claire, un module | Solo agent | Aider / Claude / Codex via Laura chat |
| N recherches indépendantes | Fan-out | Hermes `delegate_task` |
| Feature git + PR + CI | Orchestrator–worker + worktrees | **AO** |
| Assistant multi-canal (Telegram, Discord…) | Hub + agents isolés | **OpenClaw** |
| Équipe durable named bots | Supervisor + blackboard | Hermes Bot Mode / OpenClaw team |
| Rappel long terme cross-hosts | Blackboard Markdown | **agent-memory** + Laura RAG |

## Rôle de Laura

```text
Humain
  └─ Laura (terminal)
        ├─ /run orchestra plan "…"     → plan structuré (pattern + agents)
        ├─ /run orchestra status       → bins présents (hermes, openclaw, ao…)
        ├─ /run agents hermes|openclaw → install-hint / doctor
        ├─ /run memory                 → contexte partagé
        └─ propose commandes (jamais auto-install remote)
              │
              ▼
        Runtime choisi (AO | OpenClaw | Hermes | solo)
```

Laura **ne spawn pas** de workers arbitraires en shell libre : trop dangereux.
Elle produit un **plan d’orchestration** et des **commandes proposées** que tu
valides.

## Exemples de commandes (après install locale)

```bash
# OpenClaw team
openclaw agents team create --non-interactive
openclaw agents list --bindings

# Hermes parallel research (dans une session hermes)
# delegate_task(tasks=[{goal:…},{goal:…}])

# AO — ouvrir le projet, laisser l’orchestrator découper
# (desktop / daemon — voir releases Untrivial-ai/agent-orchestrator)
```

## Références

- OpenClaw agents CLI — roles `coordinator|researcher|writer|reviewer`, team create  
- Hermes delegation — isolated children, async, optional worktrees  
- AO architecture — observe → persist facts → derive Kanban status  
- Patterns — chain, fan-out, pipeline, supervisor, blackboard (littérature 2026)
