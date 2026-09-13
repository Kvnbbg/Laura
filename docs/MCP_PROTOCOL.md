# Protocole MCP (Model Context Protocol) — analyse

MCP standardise **agent → outils / données / prompts** (couche **verticale**).
A2A standardise **agent ↔ agent** (couche **horizontale**). Les deux se cumulent.

## Architecture

```text
┌─────────────────────────────────────┐
│ Host (Claude Code, IDE, Laura…)     │
│  └─ Client MCP (1:1 vers un server) │
└──────────────┬──────────────────────┘
               │ JSON-RPC (stdio | HTTP+SSE)
               ▼
┌─────────────────────────────────────┐
│ MCP Server                          │
│  tools / resources / prompts        │
└─────────────────────────────────────┘
```

| Rôle | Responsabilité |
| --- | --- |
| **Host** | App LLM : permissions, consentement, cycle de vie clients |
| **Client** | Connecteur 1:1 dans le host |
| **Server** | Expose capacités focalisées |

Couches : **data** (JSON-RPC, primitives) + **transport** (stdio local, Streamable HTTP distant).

## Trois primitives serveur

| Primitive | Qui décide | Nature | Exemples |
| --- | --- | --- | --- |
| **Tools** | Le **modèle** invoque | Actions (effets de bord possibles) | `git_commit`, `search`, `db_query` |
| **Resources** | App / user pour contexte | Données plutôt passives | fichiers, schémas, docs |
| **Prompts** | User / UX | Templates d’interaction | checklists, few-shot |

Méthodes typiques :

- `tools/list` → `tools/call`
- `resources/list` → `resources/read` (+ templates / subscriptions)
- `prompts/list` → `prompts/get`

## Client features

Le serveur peut demander au client :

- **Elicitation** — info user supplémentaire  
- (Sampling historiquement côté client ; évolue selon version de spec)

## Transport

| Transport | Cas |
| --- | --- |
| **stdio** | Process local (le plus courant en IDE/CLI) |
| **Streamable HTTP** | Serveur remote, SSE optionnel |

Auth : cadre d’autorisation surtout pour HTTP ; stdio = confiance process local.

## MCP vs A2A (rappel opérationnel)

| Question | Réponse |
| --- | --- |
| Lire une DB / un repo | **MCP** |
| Appeler un agent d’une autre équipe | **A2A** |
| Un agent qui utilise 5 outils | **MCP** only |
| Orchestrateur + spécialistes distants | **A2A** + MCP dans chaque agent |

## Sécurité (ce que Laura doit rappeler)

1. Un tool MCP peut **écrire** (fichiers, réseau) — consentement host  
2. Ne pas brancher un server inconnu en prod  
3. Preférer allowlists (Laura déjà dans cet esprit)  
4. Remote HTTP → auth + surface d’attaque plus large que stdio

## Commandes d’exploration

```bash
# Spec
# https://modelcontextprotocol.io/specification/latest

# Server filesystem de démo (relire avant usage)
npx -y @modelcontextprotocol/server-filesystem --help

# SDK TS (hôte/client)
npm install @modelcontextprotocol/sdk

# Python
pip install mcp
python -c "import mcp; print('mcp ok')"
```

## Position Laura

Laura n’est pas un host MCP complet aujourd’hui. Elle :

- explique MCP vs A2A (`/run protocols`)
- propose des install-hints
- garde des **bridges allowlistés** (`/run memory`, `/run agents`…)

Un vrai host MCP = Claude Code, Cursor, ou un runtime qui spawn des servers stdio.

## Suite

```text
/run protocols mcp
/run protocols compare
/run guide next
```
