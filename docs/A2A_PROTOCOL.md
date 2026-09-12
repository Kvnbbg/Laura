# Protocole A2A (Agent2Agent) — analyse

Laura explique et propose des commandes. Elle n’implémente pas un serveur A2A
complet : elle te guide pour explorer et brancher.

## En une phrase

**A2A** standardise comment des agents **opaques** (frameworks/vendeurs
différents, process séparés) se **découvrent** et **collaborent**.  
**MCP** standardise comment **un** agent parle à des **outils / données**.

Ils sont **complémentaires**, pas concurrents.

```text
        ┌──────────── A2A (horizontal) ────────────┐
   Agent A  ←── tasks/messages/artifacts ──→  Agent B
      │                                      │
      └─ MCP tools ─┘              └─ MCP tools ─┘
              (vertical)
```

## Primitives A2A

| Primitive | Rôle |
| --- | --- |
| **Agent Card** | JSON de découverte (skills, URL, modes I/O) — souvent `/.well-known/agent-card.json` |
| **Message** | Demande user/agent qui démarre du travail |
| **Task** | Unité de travail avec cycle de vie (`submitted` → `working` → `completed`/`failed`) |
| **Artifacts** | Résultats concrets renvoyés |

Transport typique : **JSON-RPC 2.0** sur HTTP(S), + streaming SSE, + notifs push pour tâches longues. SDKs : Python, JS, Go, Java, .NET. Gouvernance : Linux Foundation (AAIF) ; ACP a fusionné vers A2A.

## MCP vs A2A

| | **MCP** | **A2A** |
| --- | --- | --- |
| Direction | Verticale (agent → tool) | Horizontale (agent ↔ agent) |
| Cible | DB, API, filesystem, outils | Autre agent autonome |
| État distant | Outil souvent stateless | Agent peut raisonner multi-tour |
| Découverte | Liste d’outils du serveur | Agent Card |
| Confiance | Même boundary en général | Cross-team / cross-vendor |

**Règle simple**  
- Besoin d’une base / API / fichier → **MCP**  
- Besoin de déléguer à un autre agent (surtout hors process) → **A2A**  
- Flotte réelle → **les deux**

## Quand A2A vs sous-agent local

| Situation | Choix |
| --- | --- |
| Même process, même app | Sous-agent local (Hermes `delegate_task`, LangGraph node) |
| Service séparé, autre équipe/framework | **A2A** |
| Outil déterministe | **MCP** (ne pas “fake” un agent) |

## Lien avec Laura / stack

| Couche | Techno |
| --- | --- |
| Surface CLI | Laura (`/run protocols`, `/run guide`) |
| Harness local | Hermes, OpenClaw, AO |
| Workflow stateful | LangGraph + checkpoints |
| Agent → tools | MCP |
| Agent → agent distant | A2A |
| Mémoire faits | agent-memory / Laura RAG |

## Commandes d’exploration

```bash
# Spec & repo
# https://github.com/a2aproject/A2A
# https://a2a-protocol.org  (si dispo)

# SDK Python
pip install a2a-sdk
python -c "import a2a; print('a2a-sdk import ok')"

# ADK (exposé A2A côté Google)
pip install google-adk
# Exposer un agent ADK en serveur A2A (doc ADK):
# adk api_server --a2a

# JS
npm install @a2a-js/sdk
```

## Ce que Laura doit dire à l’utilisateur

1. **Toujours** coller les prochaines commandes copy-paste  
2. Distinguer MCP (outils) et A2A (pairs)  
3. Ne pas promettre qu’Laura “est” un peer A2A tant qu’aucun serveur n’est branché  
4. Proposer OpenClaw/Hermes pour multi-agent **local**, A2A pour **cross-service**

## Suite

```text
/run protocols list
/run protocols a2a
/run protocols mcp
/run guide lost
/run orchestra plan déléguer à un agent distant via A2A
```
