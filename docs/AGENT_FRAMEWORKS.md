# Étude des frameworks d’agents (2026)

Document d’orientation pour Laura : **où** placer un framework, un harness,
ou un orchestrateur — et **quand** ne pas en prendre.

## Distinction critique : framework vs harness

| | **Framework** | **Harness** |
| --- | --- | --- |
| Direction | Tu *assembles* une boucle | La boucle *tourne déjà* |
| Interface | `import` + code | CLI / TUI / produit |
| Exemples | LangGraph, CrewAI, OpenAI Agents SDK | Claude Code, Codex, Hermes, OpenClaw, Aider |
| Job | Builder d’agents métier | Agent qui agit sur fichiers / shell / canaux |

Formule courante : **Agent = Model + Harness**.  
Un framework est une bibliothèque pour *construire* un harness (ou un workflow).
Les coding agents de production **n’importent en général pas** LangGraph/CrewAI
à l’intérieur de leur boucle — ils *sont* le harness.

Laura est un **orchestrateur de surface** (CLI) : elle pilote des harnesses et
partage de la mémoire ; elle n’est pas un framework d’agents Python.

## Taxonomie des frameworks (bibliothèques)

### Contrôle d’état / production

| Framework | Langages | Modèle mental | Force |
| --- | --- | --- | --- |
| **LangGraph** | Python, JS/TS | Graphe + checkpoints durables | Workflows longs, HITL, reprise après crash |
| **Microsoft Agent Framework** | Python, .NET | Fusion AutoGen + Semantic Kernel | Entreprise Azure, gouvernance |
| **Google ADK** | Py, TS, Go, Java… | Workflow + délégation | Polyglotte, protocole A2A |

### Multi-agents “équipe”

| Framework | Modèle | Force |
| --- | --- | --- |
| **CrewAI** | Rôles / crews / flows | Prototype multi-agents rapide |
| **OpenAI Agents SDK** | Agents + handoffs + guardrails | Surface minimale, tracing |
| **AutoGen / AG2** | Conversations de groupe | Recherche / débat (legacy → MAF) |

### Typage, RAG, optimisation de prompts

| Framework | Rôle |
| --- | --- |
| **Pydantic AI** | Agents typés, sorties validées |
| **LlamaIndex Workflows** | RAG / documents agents |
| **DSPy** | Compiler/optimiser pipelines (pas un orchestrateur complet seul) |
| **smolagents** (HF) | Agents code-first minimaux |

### TypeScript / produit web

| Framework | Rôle |
| --- | --- |
| **Vercel AI SDK** | Streaming UI + tool loops |
| **Mastra** | Agents + workflows TS batteries-included |

### Cloud-native

| Framework | Rôle |
| --- | --- |
| **AWS Strands** | Boucle model-driven, AgentCore |
| **Agno** | Agents/Teams + runtime AgentOS |

## Harnesses (runtimes déjà assemblés)

Alignés avec l’écosystème Laura :

| Harness | Isolation | Multi-agent |
| --- | --- | --- |
| **Claude Code / Codex** | Session + tools | Hosts ; hooks agent-memory |
| **Hermes** | Enfant + terminal (+ worktree) | `delegate_task`, Bot Mode, Kanban |
| **OpenClaw** | Workspace + routing canaux | Team coordinator/specialists |
| **AO** | git worktree + PR | Orchestrator + workers Kanban |
| **Aider / Pi / OpenCode** | Repo / TUI | Solo ou léger |

Composants typiques d’un harness (ETCLOVG / H=(E,T,C,S,L,V)) :
Execution, Tools (MCP…), Context, State, Lifecycle, Verification/Governance.

## Protocoles (couche transverse)

| Protocole | Sens |
| --- | --- |
| **MCP** | Agent → outils / serveurs de capacités |
| **A2A** (et convergences ACP) | Agent → agent |

Les frameworks et harnesses se branchent de plus en plus sur MCP ; A2A reste
useful pour flottes inter-vendeurs (ADK en particulier).

## Matrice de décision

| Besoin | Choisir |
| --- | --- |
| Workflow métier stateful, audit, HITL | **LangGraph** |
| Équipe à rôles en un après-midi | **CrewAI** |
| Agent minimal multi-modèle | **OpenAI Agents SDK** |
| Shop .NET / Azure | **Microsoft Agent Framework** |
| Polyglotte + A2A | **Google ADK** |
| Sorties strictement typées | **Pydantic AI** |
| Optimiser prompts/métriques | **DSPy** (+ un orchestrateur) |
| Coder dans un repo maintenant | **Harness** (Claude/Codex/Hermes/Aider…) |
| Features parallèles + PR/CI | **AO** |
| Assistant multi-canal self-host | **OpenClaw** |
| Terminal orchestrateur + mémoire locale | **Laura** + Ollama + agent-memory |

## Ce que Laura ne doit pas devenir

- Un second LangGraph (trop de surface, mauvais fit CLI Go/Node)  
- Un harness coding complet (déjà Hermes / Claude / AO)  

## Ce que Laura doit rester

1. **Surface unifiée** — `/run agents`, `/run orchestra`, `/model`, `/run memory`  
2. **Mémoire locale** — Markdown + RAG Ollama (+ `mem` optionnel)  
3. **Plans d’orchestration** — pattern + runtime suggéré, commandes à valider  
4. **Pont** — status/install-hint vers frameworks *ou* harnesses, sans auto-pipe d’installers

## Lecture croisée

- `docs/MULTI_AGENT_ORCHESTRATION.md` — patterns chain / fan-out / supervisor  
- `docs/AUTONOMOUS_AGENTS.md` — carte Hermes, OpenClaw, Pico, Pi  
- `docs/AGENT_MEMORY_RAG.md` — mémoire long terme

## Références (paysage 2026)

Comparatifs publics convergents : LangGraph = contrôle/production ;
CrewAI = crews rapides ; SDKs lab (OpenAI, Google, Microsoft, Claude) =
natifs provider ; distinction harness/framework stabilisée dans la litérature
“harness engineering” (2026).
