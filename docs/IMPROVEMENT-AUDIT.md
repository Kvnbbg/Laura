# Laura — Audit applicatif et axes d’amélioration

## Méthode

Audit statique du dépôt public `Kvnbbg/Laura` : README, package.json, serveur Express, services TypeScript, pages, features, CLI Go et documentation de sécurité.

Il s’agit d’un audit de conception et de code lisible depuis GitHub, pas d’un test d’exécution CI.

## Synthèse

Laura dispose déjà d’un socle inhabituellement large pour une application compacte : web, terminal, Mistral, Ollama, RAG, plugins, progression RPG et bridge public-safe.

Le principal risque n’est pas l’absence de fonctionnalités. C’est la **densité fonctionnelle** : trop de responsabilités peuvent converger vers le serveur et l’interface.

## P0 — À traiter avant expansion fonctionnelle

### 1. Unifier les contrats de réponse

Le serveur produit plusieurs enrichissements : citations, feedback, hints, actions, réseau et bridge.

Créer des types/versionnements explicites.

### 2. Documenter la différence chat classique / streaming

Le streaming ne fait actuellement pas le même travail RAG que `/api/chat`.

Décision à prendre :

- streaming rapide sans RAG, contrat explicitement différent ;
- ou streaming avec retrieval.

La première option est plus simple et peut rester le choix produit.

### 3. RAG = isolation logique, pas authentification

Le session ID protège contre le mélange accidentel de sessions dans l’architecture actuelle, mais ne constitue pas une identité forte.

Documenter cette distinction et préparer une liaison à l’authentification si nécessaire.

### 4. Rate limiting

Le rate limiter mémoire convient à une instance.

Pour plusieurs instances, il doit être externalisé.

## P1 — Qualité et maintenabilité

### 5. Découpage du serveur

`server/index.js` est désormais suffisamment riche pour justifier un découpage en routes/services/contracts.

### 6. Validation runtime

Ajouter une validation stricte aux frontières réseau.

### 7. Tests

Renforcer :

- upload malveillant ;
- secret detection ;
- expiration RAG ;
- CORS ;
- rate limit ;
- streaming ;
- Ollama failure ;
- Mistral failure ;
- bridge security envelope ;
- malformed Matrix progress.

### 8. Observabilité

Introduire request IDs et métriques de latence.

## P1 — UX

### 9. Mode fournisseur visible

L’utilisateur devrait savoir si Laura utilise :

- Mistral ;
- Ollama ;
- fallback déterministe.

### 10. État réseau

Afficher un état non ambigu :

```
ONLINE / MISTRAL
LOCAL / OLLAMA
LOCAL / FALLBACK
OFFLINE / UI ONLY
```

### 11. RAG visible

Lorsque des documents ont été utilisés, afficher clairement :

- nombre de sources ;
- noms ;
- chunks ;
- bouton de suppression.

### 12. Erreurs actionnables

Une erreur doit dire :

- ce qui a échoué ;
- ce que l’utilisateur peut faire ;
- si les données ont été conservées ;
- si une nouvelle tentative est sûre.

## P2 — Productivité

### 13. Command palette

Centraliser les commandes de Laura.

### 14. `laura doctor`

Commande de diagnostic :

```
Node
npm
Go
Ollama
Mistral configuration
API reachability
allowed origins
RAG status
plugins
Git state
```

Aucune valeur secrète ne doit être imprimée.

### 15. Plugin manifest

Permissions déclaratives + dry-run.

### 16. Offline workspace

Rendre le mode local réellement cohérent, pas seulement un fallback.

## Risques à éviter

- ajouter une base de données sans cas d’usage ;
- transformer les plugins en shell runner ;
- automatiser des publications sans human review ;
- multiplier les frameworks UI ;
- mélanger données privées et feed public ;
- ajouter des agents autonomes avant d’avoir des contrats déterministes ;
- rendre le serveur monolithique en ajoutant encore des routes directement dans `index.js`.

## Plan d’exécution recommandé

```
P0 contracts
   ↓
P0 security tests
   ↓
P0 streaming decision
   ↓
P1 server modularization
   ↓
P1 observability
   ↓
P1 UX state model
   ↓
P2 command palette
   ↓
P2 plugin permissions
   ↓
P2 offline workspace
```

## Vérifications à chaque changement

```bash
npm run lint
npm run test -- --run
npm run build
npm run security:scan
npm run provenance:check
npm run check:go
```

Pour une modification du CLI Go :

```bash
gofmt -w .
go vet ./...
go test ./...
go build -trimpath -ldflags="-s -w" -o bin/laura ./cmd/laura
```

