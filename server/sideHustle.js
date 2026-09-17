/**
 * Side-hustle finite state machine — Instructions Datacenter / oldSoTrueLove notes.
 * States: OFFER → VALIDATED → SOLD → REPEATABLE → SYSTEM
 * Fail closed: invalid transition throws named error (no silent skip).
 * © 2026 Kevin Marville · Tech & Stream · kvnbbg.fr
 */

export const STATES = Object.freeze([
  'OFFER',
  'VALIDATED',
  'SOLD',
  'REPEATABLE',
  'SYSTEM',
]);

const ORDER = Object.freeze(
  Object.fromEntries(STATES.map((s, i) => [s, i]))
);

const ALLOWED = Object.freeze({
  OFFER: ['VALIDATED'],
  VALIDATED: ['SOLD'],
  SOLD: ['REPEATABLE'],
  REPEATABLE: ['SYSTEM'],
  SYSTEM: [],
});

export class SideHustleTransitionError extends Error {
  constructor(from, to, reason) {
    super(`Named refusal: cannot move ${from} → ${to}. ${reason}`);
    this.name = 'SideHustleTransitionError';
    this.from = from;
    this.to = to;
  }
}

export function createSideHustle(initial = 'OFFER') {
  if (!STATES.includes(initial)) {
    throw new SideHustleTransitionError('∅', initial, 'unknown state');
  }
  let state = initial;
  const log = [{ at: new Date().toISOString(), state, event: 'init' }];

  return {
    get state() {
      return state;
    },
    get history() {
      return log.slice();
    },
    canTransition(to) {
      return (ALLOWED[state] || []).includes(to);
    },
    transition(to, evidence = {}) {
      if (!STATES.includes(to)) {
        throw new SideHustleTransitionError(state, to, 'unknown target');
      }
      if (!this.canTransition(to)) {
        throw new SideHustleTransitionError(
          state,
          to,
          `allowed next: ${(ALLOWED[state] || []).join(', ') || 'none'}`
        );
      }
      // Evidence gates (named, not silent)
      if (to === 'VALIDATED' && !evidence.demand) {
        throw new SideHustleTransitionError(
          state,
          to,
          'need evidence.demand (real request)'
        );
      }
      if (to === 'SOLD' && !evidence.payment) {
        throw new SideHustleTransitionError(
          state,
          to,
          'need evidence.payment (real transaction)'
        );
      }
      if (to === 'REPEATABLE' && !(evidence.repeats >= 2)) {
        throw new SideHustleTransitionError(
          state,
          to,
          'need evidence.repeats >= 2'
        );
      }
      if (to === 'SYSTEM' && !evidence.autonomy) {
        throw new SideHustleTransitionError(
          state,
          to,
          'need evidence.autonomy (process without creator energy)'
        );
      }
      const from = state;
      state = to;
      log.push({
        at: new Date().toISOString(),
        from,
        state,
        event: 'transition',
        evidence,
      });
      return state;
    },
    checklist() {
      return {
        productsVsServicesVsAudience: true,
        costs: true,
        distribution: true,
        payment: true,
        logistics: true,
        instructions: true,
        note: 'Documents insist on distinguishing products, services, audience and accounting for costs, distribution, payment, logistics, instructions.',
      };
    },
  };
}
