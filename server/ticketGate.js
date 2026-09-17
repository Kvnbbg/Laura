/**
 * Optional API key + ticket gate (aligned with Division-by-Zero TDAAH).
 * enabled only when LAURA_API_KEY is set and LAURA_SECURITY_ENABLED=true.
 * Mutating methods require X-Ticket-Id — no thruster without ticket.
 */

import { recordAudit } from './audit.js';

const HDR_KEY = 'x-api-key';
const HDR_TICKET = 'x-ticket-id';

const OPEN_PATHS = new Set([
  '/api/health',
  '/health',
  '/api/chat',
  '/api/chat/stream',
]);

function isOpen(path) {
  if (OPEN_PATHS.has(path)) return true;
  // chat stays usable for daily companion; mutations elsewhere need tickets when enabled
  if (path.startsWith('/api/chat')) return true;
  return false;
}

function isMutating(method) {
  const m = (method || '').toUpperCase();
  return m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE';
}

export function createTicketGate() {
  const key = process.env.LAURA_API_KEY || '';
  const enabled =
    process.env.LAURA_SECURITY_ENABLED === 'true' && key.length > 0;

  return function ticketGate(req, res, next) {
    if (!enabled || isOpen(req.path)) {
      return next();
    }

    const provided = req.headers[HDR_KEY];
    if (!provided || provided !== key) {
      recordAudit({
        actor: 'unknown',
        action: 'AUTH_DENIED',
        resource: req.path,
        success: false,
        detail: 'missing or invalid X-API-Key',
      });
      return res.status(401).json({
        error: 'unauthorized',
        hint: 'X-API-Key required when LAURA_SECURITY_ENABLED=true',
      });
    }

    if (isMutating(req.method) && !isOpen(req.path)) {
      const ticket = req.headers[HDR_TICKET];
      if (!ticket || !String(ticket).trim()) {
        recordAudit({
          actor: 'api-key',
          action: 'TICKET_REQUIRED',
          resource: req.path,
          success: false,
          detail: 'no thruster without X-Ticket-Id',
        });
        return res.status(422).json({
          error: 'ticket_required',
          message:
            'Mutating calls need X-Ticket-Id (mode ticket, no thruster)',
        });
      }
      req.lauraTicketId = String(ticket).trim();
    }

    return next();
  };
}
