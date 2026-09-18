# Laura — Documentation technique, fonctionnelle et opérationnelle

## 1. Positionnement

Laura est une application open source terminal-first + web. Elle combine :

- une SPA React/TypeScript ;
- une API Express légère ;
- un chat Mistral ;
- un fallback Ollama local ;
- un RAG temporaire par session ;
- un CLI Go ;
- des plugins terminal ;
- un bridge MoltBot → MatrixCitizen ;
- des surfaces de progression, dashboard, growth, EcoHub et Open Source.

Le principe central est de conserver une frontière claire entre **préparation**, **exécution locale** et **publication publique**.

Laura ne doit pas prétendre disposer d’un accès privé à Techandstream, aux comptes, aux factures ou aux logs cachés. Les signaux destinés à une surface publique doivent rester publics et soumis à une validation humaine.

## 2. Architecture générale

```
                 ┌──────────────────────┐
                 │      Laura Web       │
                 │ React + TypeScript   │
                 │ React Router + SCSS  │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │   Express bridge     │
                 │    server/index.js   │
                 └──────┬───────┬───────┘
                        │       │
             ┌──────────┘       └───────────┐
             ▼                              ▼
       Mistral API                         Ollama
       online provider                     local
             │                              │
             └──────────────┬───────────────┘
                            ▼
                     Chat / RAG response

Terminal
   │
   ├── bin/laura-cli.mjs
   └── cmd/laura (Go)
          │
          ├── game engine
          ├── Code/Data Master
          ├── Matrix bridge
          └── Mindwalk bridge

Plugins
   ├── Moltbook
   ├── Techandstream articles
   ├── French Dev social
   ├── French Dev workflows
   └── Matrix Citizen
```

## 3. Frontend

La SPA est organisée autour de :

- `src/pages/` pour les surfaces ;
- `src/components/` pour les composants ;
- `src/services/` pour les appels réseau et services ;
- `src/features/` pour les domaines fonctionnels ;
- `src/styles/` pour le système SCSS ;
- `src/utils/` pour erreurs et logging.

Les pages visibles dans le dépôt incluent notamment Home, About, Chat, Contact, Dashboard, Growth, EcoHub, MatrixCitizen, OpenSource, InstallCli et NotFound.

### Principe

Le frontend doit rester composable. Une page ne doit pas devenir un second backend.

## 4. Backend Express

`server/index.js` est la frontière entre le navigateur/CLI et les fournisseurs.

Responsabilités actuelles :

- chat Mistral ;
- streaming SSE ;
- fallback local ;
- Ollama ;
- RAG ;
- upload de documents ;
- session documentaire ;
- rate limiting ;
- CORS ;
- redaction de secrets ;
- bridge MatrixCitizen ;
- réponses structurées pour les plugins et surfaces sociales.

### Sécurité existante

Le serveur :

- désactive `x-powered-by` ;
- définit des headers de sécurité ;
- limite les origines ;
- applique un rate limit en mémoire ;
- limite les uploads ;
- limite les types MIME ;
- bloque plusieurs extensions exécutables ;
- détecte plusieurs motifs de secrets ;
- garde les documents par session ;
- applique une expiration ;
- ne transmet pas les secrets utilisateur au fournisseur lorsque la redaction est active.

## 5. Chat Mistral

Le chemin normal est :

```
ChatMessage[]
   ↓
validation
   ↓
document session
   ↓
embedding du dernier message
   ↓
top chunks
   ↓
system prompt + sources
   ↓
Mistral
   ↓
ChatResponse
```

Le client TypeScript utilise `sendChatMessage`.

Le serveur limite les modèles autorisés et conserve la clé Mistral exclusivement dans l’environnement serveur.

## 6. Streaming

`/api/chat/stream` est optimisé pour le terminal :

- moins de latence perçue ;
- diffusion token/chunk ;
- pas de RAG pour cette voie afin de rester rapide ;
- Ollama local prioritaire lorsque Mistral n’est pas configuré ;
- fallback déterministe si aucun fournisseur n’est disponible.

### Axe d’amélioration important

La réponse streaming et la réponse classique n’ont pas exactement la même richesse fonctionnelle. Il faut documenter cela comme un contrat explicite ou faire évoluer le streaming vers une enveloppe commune contenant :

```
message
citations
thinkingFeedback
agentHints
nextActions
bridge
```

## 7. RAG

Les documents sont :

- TXT/Markdown ;
- découpés en chunks ;
- limités en taille ;
- conservés temporairement en mémoire ;
- associés à une session ;
- recherchés par similarité ;
- cités sous la forme `[DocName • chunk N]`.

Le serveur applique une limite de documents, chunks et caractères.

### Risque architectural

Le stockage en mémoire est adapté à une instance légère, mais devient fragile en multi-instance ou après redémarrage.

**Évolution possible :**

- rester in-memory pour une installation personnelle ;
- passer à un stockage persistant seulement si le besoin est démontré ;
- si persistance : chiffrement, isolation tenant/session, TTL, suppression vérifiable et limites de quota.

## 8. CLI Go

Le CLI `cmd/laura` est la surface terminal-first principale.

Il fournit notamment :

```
laura
laura --help
laura --version
laura --world <world>
laura --stats
laura --reset
laura --no-color
laura --no-animation
laura --mode code-data
laura --track sql
laura --daily
laura --weak-topics
laura --review
laura --path
laura --bridge
laura --mindwalk-bridge
```

Le moteur conserve la progression localement et prend en charge les commandes globales.

### Code/Data Master

Le mode Code/Data Master adapte la pratique autour de plusieurs axes :

- SQL ;
- DSA ;
- statistiques ;
- machine learning ;
- data engineering ;
- system design ;
- Go.

Il possède notamment :

- difficulté adaptative ;
- déduplication ;
- daily set déterministe ;
- entraînement des sujets faibles ;
- review des missions déjà terminées ;
- statistiques ;
- sauvegarde de progression.

## 9. Bridge MoltBot → MatrixCitizen

Le bridge TypeScript transforme un input MoltBot en plan MatrixCitizen déterministe.

Étapes :

1. normaliser commande ;
2. normaliser canaux web/terminal ;
3. générer un identifiant déterministe ;
4. créer un aperçu MatrixCitizen ;
5. calculer progression ;
6. construire action deck ;
7. produire drafts ;
8. construire feed ;
9. produire plan social/blog/workflow ;
10. produire les contrôles de sécurité ;
11. générer une route Techandstream.

### Commandes

```
auto
add
goto add
```

### Contrat de sécurité

Le bridge déclare explicitement :

- origine publique ;
- dépôt cible ;
- publication manuelle ;
- payload autorisé ;
- payload bloqué.

Les éléments bloqués comprennent :

- fichiers `.env` ;
- API keys/tokens ;
- uploads privés ;
- sortie terminal non nettoyée ;
- prompts privés.

## 10. Plugins

Les plugins de `terminal-plugins/` sont conçus comme extensions lisibles et contrôlées.

La règle actuelle est :

> lecture et préparation par défaut ; aucune écriture ou exécution arbitraire sans confirmation explicite.

Le plugin system doit rester petit. Ajouter un plugin uniquement lorsqu’il apporte une capacité identifiable.

## 11. Configuration

Variables principales :

- `VITE_APP_NAME`
- `VITE_CONTACT_ENDPOINT`
- `VITE_CONTACT_TIMEOUT_MS`
- `VITE_ENABLE_CHAT`
- `VITE_MISTRAL_MODEL`
- `VITE_CHAT_ENDPOINT`
- `VITE_CHAT_TIMEOUT_MS`
- `MISTRAL_API_KEY`
- `MISTRAL_MODEL`
- `OLLAMA_URL`
- `OLLAMA_MODEL`
- `LAURA_ALLOWED_ORIGINS`
- `LAURA_RATE_LIMIT_PER_MINUTE`

Règle absolue : aucune clé fournisseur ne doit être placée dans `VITE_*`.

## 12. Tests et qualité

Scripts disponibles :

```bash
npm run lint
npm run test
npm run build
npm run security:scan
npm run provenance:check
npm run check:security
npm run check:go
```

Le projet doit viser une vérification reproductible :

```
lint
  +
unit tests
  +
build
  +
security scan
  +
provenance
  +
Go vet/test/build
```

## 13. Audit d’amélioration de l’application

### Priorité P0 — Contrats de données

Les réponses backend deviennent riches : chat, citations, thinking feedback, hints, actions et bridge.

**Amélioration :** définir des schémas TypeScript/JSON explicites côté serveur et client, idéalement validés à runtime.

### P0 — Streaming parity

Le streaming bypass le RAG et renvoie une enveloppe différente.

**Amélioration :** versionner le contrat SSE et documenter précisément les différences.

### P0 — Rate limiter distribué

Le rate limiter en mémoire ne se partage pas entre instances.

**Amélioration :** conserver l’in-memory pour local/single-instance ; Redis ou équivalent seulement pour déploiement multi-instance.

### P0 — Session RAG

Le header `X-Laura-Session` est une bonne séparation logique, mais une session auto-déclarée n’est pas une authentification.

**Amélioration :**

- expliciter le modèle « privacy boundary, not identity » ;
- lier les sessions à une identité authentifiée si l’auth arrive ;
- quotas par utilisateur ;
- suppression vérifiable.

### P1 — Backend modulaire

`server/index.js` porte beaucoup de responsabilités.

**Amélioration :**

```
server/
  app.js
  config.js
  middleware/
  routes/
    chat.js
    documents.js
    bridge.js
  services/
    mistral.js
    ollama.js
    rag.js
    redaction.js
  contracts/
```

Ne pas effectuer ce découpage uniquement pour « faire propre » : le déclencher lorsque la duplication ou la testabilité devient problématique.

### P1 — Validation runtime

Le TypeScript compile les contrats frontend, mais les données réseau restent dynamiques.

**Amélioration :** introduire une validation runtime légère pour les payloads critiques.

### P1 — Observabilité

Le logger structuré existe.

**Amélioration :**

- request ID ;
- durée ;
- provider ;
- modèle ;
- statut ;
- taille de réponse ;
- RAG hit count ;
- erreurs classifiées.

Jamais de contenu privé brut dans les logs.

### P1 — UX chat

La base est solide mais le chat peut devenir plus opérable :

- état offline/online ;
- fournisseur actif affiché ;
- indicateur RAG ;
- citations repliables ;
- retry ;
- annulation ;
- copie structurée ;
- export de conversation explicitement déclenché par l’utilisateur.

### P1 — Command palette

Une palette unique pourrait exposer :

```
Chat
Documents
Plugins
MatrixCitizen
Code/Data Master
Stats
Security
Install CLI
```

Elle réduirait la fragmentation entre pages.

### P2 — Persistence optionnelle

Ne pas ajouter une base par défaut.

Si persistence devient nécessaire :

- conversations ;
- préférences ;
- progression ;
- documents ;
- audit.

Chaque catégorie doit avoir sa propre politique de rétention.

### P2 — Offline-first réel

Le fallback actuel est déterministe et Ollama permet le chat local.

L’étape suivante est un mode local cohérent :

```
UI
 ↓
local API
 ↓
Ollama
 ↓
local RAG
 ↓
local history
```

Objectif : pouvoir travailler sans réseau, puis synchroniser seulement les données explicitement choisies.

### P2 — Plugin manifest

Chaque plugin pourrait déclarer :

```json
{
  "name": "...",
  "version": "...",
  "permissions": ["read-public"],
  "network": ["https://..."],
  "writes": false
}
```

Cela rendrait les permissions auditables sans construire un framework lourd.

## 14. UX / UI : axes concrets

Le projet utilise un vocabulaire KISS : Card, Accordion, Modal, Drawer, Toast, Skeleton, Badge, Table, Pagination, Breadcrumb.

À conserver.

À améliorer :

1. cohérence des espacements ;
2. états loading/error/empty ;
3. navigation clavier ;
4. responsive mobile ;
5. focus visible ;
6. `aria-live` pour les réponses ;
7. réduction des animations ;
8. affichage clair du mode local/offline ;
9. séparation nette entre contenu public et contexte privé ;
10. réduction des blocs décoratifs lorsqu’ils concurrencent le chat.

## 15. Architecture cible

```
                Laura UI
                   │
          ┌────────┴────────┐
          │                 │
       Chat UI          Workspaces
          │                 │
          └────────┬────────┘
                   ▼
              API Contract
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
      Chat        RAG       Bridge
        │          │          │
   Mistral/      session    public-safe
    Ollama       scoped      metadata
        │          │          │
        └──────────┼──────────┘
                   ▼
              Observability
                   │
          tests / security / CI
```

## 16. Definition of Done

Une feature Laura est terminée lorsque :

- son contrat est explicite ;
- son état d’erreur est traité ;
- elle fonctionne en local ;
- elle possède des tests adaptés ;
- elle ne met pas de secret dans le bundle ;
- elle ne mélange pas données privées et payload public ;
- elle ne donne pas à un plugin des permissions inutiles ;
- elle est documentée ;
- `npm run build` passe ;
- les checks sécurité pertinents passent.

## 17. Roadmap

### Étape 1 — Hardening

- contrats runtime ;
- streaming parity ;
- tests RAG ;
- tests de redaction ;
- tests CORS ;
- tests rate limiting.

### Étape 2 — Developer experience

- command palette ;
- documentation CLI ;
- diagnostics `laura doctor` ;
- logs structurés améliorés ;
- version API.

### Étape 3 — Offline

- Ollama first-class ;
- RAG local ;
- cache local ;
- mode sans réseau clairement identifiable.

### Étape 4 — Agent tooling

- manifest de permissions ;
- outils typés ;
- dry-run ;
- confirmation explicite pour toute écriture ;
- audit de chaque action.

### Étape 5 — Production

- observabilité ;
- rate limit distribué ;
- persistence optionnelle ;
- readiness/health ;
- déploiement reproductible ;
- SBOM ;
- tests E2E.

Dernière vérification documentaire : 18 septembre 2026.
