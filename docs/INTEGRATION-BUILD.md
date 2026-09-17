# Intégration qui build

© 2026 Kevin Marville · Tech & Stream

## 1. Side-hustle FSM (déjà dans le dépôt)

```bash
node --test server/sideHustle.test.mjs
```

Doit passer : happy path OFFER→SYSTEM, refus des sauts silencieux.

## 2. Sécurité ticket (3 lignes dans `server/index.js`)

Après `const app = express();` et les imports existants :

```js
import { applySecurity, SECURITY_HEADERS } from './applySecurity.js';
```

Dans le bloc `cors({...})`, remplacer `allowedHeaders` par :

```js
allowedHeaders: SECURITY_HEADERS,
```

Après `app.use(express.json(...))` :

```js
applySecurity(app);
```

## 3. Vérifier

```bash
npm run dev:server
curl -s localhost:4000/api/security/status
curl -s localhost:4000/api/audit/events
```

Avec ticket mode :

```bash
export LAURA_SECURITY_ENABLED=true
export LAURA_API_KEY=rotate-me
# restart server
curl -s -X POST localhost:4000/api/some-mutating-route \
  -H "X-API-Key: $LAURA_API_KEY" \
  -H "X-Ticket-Id: TCK-001"
```

Sans ticket → 422 `ticket_required`.

## 4. Pont Java (Division-by-Zero)

```java
SideHustleState s = SideHustleState.OFFER.goTo(SideHustleState.VALIDATED);
```

Package : `fr.kvnbbg.tdaah.domain.SideHustleState`.

## Images / récit source

Wattpad *Instructions d'utilisation Datacenter* — oldSoTrueLove  
États OFFER / VALIDATED / SOLD / REPEATABLE / SYSTEM + recalibrage doc (dash_VeRsUs50$).
