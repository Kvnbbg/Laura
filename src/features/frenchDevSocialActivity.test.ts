import { describe, expect, it } from 'vitest';
import { buildFrenchDevSocialPlan } from './frenchDevSocialActivity';

describe('french-dev-ai-tools social activity plan', () => {
  it('covers Moltbook and Techandstream with manual review gates', () => {
    const plan = buildFrenchDevSocialPlan();

    expect(plan.targetRepository).toBe('french-dev-ai-tools');
    expect(plan.networks).toEqual(['moltbook', 'techandstream']);
    expect(plan.steps.map((step) => step.network)).toContain('moltbook');
    expect(plan.steps.map((step) => step.network)).toContain('techandstream');
    expect(plan.steps.every((step) => step.reviewGate === 'human-review-required')).toBe(true);
    expect(plan.steps.every((step) => step.writeMode === 'manual-publish-only')).toBe(true);
  });

  it('does not describe auto-posting or private data access', () => {
    const text = JSON.stringify(buildFrenchDevSocialPlan());

    expect(text).toContain('public');
    expect(text).toContain('without auto-publishing');
    expect(text).not.toMatch(/password|secret|token|private access/i);
  });
});

