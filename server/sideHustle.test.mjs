import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createSideHustle,
  SideHustleTransitionError,
  STATES,
} from './sideHustle.js';

test('states order', () => {
  assert.deepEqual(STATES, [
    'OFFER',
    'VALIDATED',
    'SOLD',
    'REPEATABLE',
    'SYSTEM',
  ]);
});

test('happy path to SYSTEM', () => {
  const m = createSideHustle();
  m.transition('VALIDATED', { demand: 'email from client' });
  m.transition('SOLD', { payment: 'invoice paid' });
  m.transition('REPEATABLE', { repeats: 2 });
  m.transition('SYSTEM', { autonomy: 'checklist + cron' });
  assert.equal(m.state, 'SYSTEM');
});

test('refuses silent skip to SOLD', () => {
  const m = createSideHustle();
  assert.throws(
    () => m.transition('SOLD', { payment: true }),
    SideHustleTransitionError
  );
});

test('refuses VALIDATED without demand', () => {
  const m = createSideHustle();
  assert.throws(() => m.transition('VALIDATED', {}), SideHustleTransitionError);
});
