/**
 * In-memory audit journal — mode ticket, no thruster.
 * © 2026 Kevin Marville · Tech & Stream · kvnbbg.fr
 * Swap for persistent store in production (same event shape).
 */

const events = [];
const MAX = 500;

export function recordAudit({
  actor = 'anonymous',
  action,
  ticketId = null,
  resource = '',
  success = true,
  detail = '',
}) {
  const event = {
    at: new Date().toISOString(),
    actor,
    action,
    ticketId,
    resource,
    success: Boolean(success),
    detail: String(detail).slice(0, 500),
  };
  events.push(event);
  if (events.length > MAX) {
    events.splice(0, events.length - MAX);
  }
  return event;
}

export function recentAudit(limit = 50) {
  const n = Math.min(Math.max(Number(limit) || 50, 1), 200);
  return events.slice(-n);
}
