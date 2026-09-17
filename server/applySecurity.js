/**
 * One-shot security integration for Laura's Express app.
 * Usage in server/index.js after `const app = express()` and cors/json:
 *
 *   import { applySecurity } from './applySecurity.js';
 *   applySecurity(app);
 *
 * Chat routes stay open. Mutations require X-API-Key + X-Ticket-Id when enabled.
 * © 2026 Kevin Marville · Tech & Stream
 */

import { createTicketGate } from './ticketGate.js';
import { recentAudit, recordAudit } from './audit.js';

export function applySecurity(app) {
  if (!app || typeof app.use !== 'function') {
    throw new Error('applySecurity(app): Express app required');
  }

  app.use(createTicketGate());

  app.get('/api/audit/events', (req, res) => {
    const limit = Number(req.query.limit) || 50;
    res.json({
      mode: 'ticket',
      thruster: false,
      events: recentAudit(limit),
    });
  });

  app.get('/api/security/status', (req, res) => {
    const enabled =
      process.env.LAURA_SECURITY_ENABLED === 'true' &&
      Boolean(process.env.LAURA_API_KEY);
    res.json({
      securityEnabled: enabled,
      ticketMode: true,
      thruster: false,
      openChat: true,
      docs: 'docs/security/TICKET-MODE-TDAAH.md',
    });
  });

  recordAudit({
    actor: 'system',
    action: 'SECURITY_BOOT',
    success: true,
    detail: 'applySecurity registered ticket gate + audit',
  });

  return app;
}

/** CORS allowedHeaders addition (merge into existing cors config). */
export const SECURITY_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Laura-Session',
  'X-API-Key',
  'X-Ticket-Id',
];
