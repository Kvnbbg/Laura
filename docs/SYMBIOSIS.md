# Laura symbiosis — modules autonomes (DRY)

Objectif : **raccordement propre sans doublons**. Chaque plugin est autonome,
prêt à l’emploi, **sans dépendance de compilation**, sécurisé (argv only),
aligné sur les docs.

## Carte

```text
terminal-plugins/
  lib/safe-cli.mjs     ← which / runBin / installHint (partagé DRY)
  symbiosis.mjs        ← registre + health
  guide.mjs            ← never-lost commands
  protocols.mjs        ← MCP / A2A / SQL checkpoints
  memory.mjs           ← RAG + mem CLI
  orchestra.mjs        ← plans multi-agents
  agents.mjs / ecosystem.mjs / grimoire.mjs
  copy.mjs / rune.mjs / rustfx.mjs / …

server/
  laura-server.mjs     ← API chat + RAG inject
  ollama-models.mjs    ← multi-model allowlist
  memory-rag.mjs       ← embeddings cache + RRF
  orchestra-plan.mjs   ← plan JSON pur
  index.js             ← import './laura-server.mjs'

scripts/
  laura-memory-recall.mjs
  plugin-health.mjs    ← sanity zero-dep
```

## Contrats plugin

```js
export default {
  name: '…',
  description: '…',
  async run({ args, print, callBridge }) { /* … */ },
};
```

- Pas de `shell: true`
- Installers distants = **texte** seulement (`installHint`)
- Finir par des commandes `/run …` copy-paste

## Commandes

```text
/run symbiosis status
/run symbiosis plugins
/run symbiosis bins
/run symbiosis map
/run symbiosis next
node scripts/plugin-health.mjs
```

## Prochain gain

1. Santé mémoire + Ollama  
2. Plan orchestra pour le goal utilisateur  
3. Un seul harness externe (Hermes *ou* OpenClaw *ou* AO) — pas les trois d’un coup  
