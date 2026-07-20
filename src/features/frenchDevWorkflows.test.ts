import { describe, expect, it } from 'vitest';
import { buildFrenchDevWorkflowRun } from './frenchDevWorkflows';

describe('french-dev-ai-tools workflow run', () => {
  it('turns blog and social activity into a durable reviewed workflow', () => {
    const run = buildFrenchDevWorkflowRun();

    expect(run.platform).toBe('Workflows');
    expect(run.contract).toBe('laura-workflows-social-blog-v1');
    expect(run.targetRepository).toBe('french-dev-ai-tools');
    expect(run.reviewGate).toBe('human-review-required');
    expect(run.writeMode).toBe('manual-publish-only');
    expect(run.steps.every((step) => step.durable)).toBe(true);
    expect(run.artifacts.blogPostingIds).toEqual(['kill-ai-slop', 'data-landscape-guide-for-developers']);
    expect(run.artifacts.socialStepIds).toContain('cross-site-reshare');
  });
});

