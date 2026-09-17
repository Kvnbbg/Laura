# Laura — mode ticket & pont TDAAH

© 2026 Kevin Marville · [techandstream.com](https://techandstream.com) · [kvnbbg.fr](https://kvnbbg.fr)

## Pourquoi

Laura reste un compagnon quotidien (chat, terminal, Quest). Les opérations **sensibles** (hors chat ouvert) passent en **mode ticket** : pas de thruster silencieux, aligné sur [Division-by-Zero](https://github.com/Kvnbbg/Division-by-Zero) et le socle ANSSI public.

## Modules

| Fichier | Rôle |
|---|---|
| `server/audit.js` | Journal `who / action / ticket / success` |
| `server/ticketGate.js` | `X-API-Key` + `X-Ticket-Id` sur mutations |

## Activation

```bash
export LAURA_SECURITY_ENABLED=true
export LAURA_API_KEY='rotate-me'   # never commit
```

Dans `server/index.js` (une fois) :

```js
import { createTicketGate } from './ticketGate.js';
import { recentAudit, recordAudit } from './audit.js';

app.use(createTicketGate());

app.get('/api/audit/events', (req, res) => {
  res.json({ mode: 'ticket', thruster: false, events: recentAudit(50) });
});
```

CORS : autoriser les headers `X-API-Key`, `X-Ticket-Id` dans `allowedHeaders`.

## Chat quotidien

`/api/chat` et `/api/chat/stream` restent **ouverts** pour le flux compagnon (Mistral / Ollama / fallback local). Le ticket s’applique aux autres mutations quand la sécurité est activée.

## Pont TDAAH

| Laura | Division-by-Zero |
|---|---|
| `LAURA_API_KEY` | `TDAAH_API_KEY` |
| `X-Ticket-Id` | `X-Ticket-Id` |
| `server/audit.js` | `AuditService` Java |
| docs ANSSI (liens) | `docs/security/ANSSI-SUBSTRATE.md` |

## Règle

```
Demande → Ticket → Exécution → AuditEvent → Clôture
```

Sans ticket sur une mutation protégée → **422** `ticket_required`.
