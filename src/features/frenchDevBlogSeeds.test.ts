import { describe, expect, it } from 'vitest';
import {
  FRENCH_DEV_EXTERNAL_BLOG_SEEDS,
  buildFrenchDevBlogPosting,
  buildFrenchDevBlogPostingQueue,
} from './frenchDevBlogSeeds';

describe('french-dev-ai-tools blog posting seeds', () => {
  it('carries Kill AI Slop and the data landscape guide as public blog signals', () => {
    const queue = buildFrenchDevBlogPostingQueue();

    expect(queue.map((post) => post.id)).toEqual(['kill-ai-slop', 'data-landscape-guide-for-developers']);
    expect(queue.every((post) => post.targetRepository === 'french-dev-ai-tools')).toBe(true);
    expect(queue.every((post) => post.publishTarget === 'techandstream.com')).toBe(true);
    expect(queue.every((post) => post.reviewGate === 'human-review-required')).toBe(true);
    expect(queue.every((post) => post.writeMode === 'manual-publish-only')).toBe(true);
  });

  it('builds review-ready MoltBot prompts without private payload language', () => {
    const post = buildFrenchDevBlogPosting(FRENCH_DEV_EXTERNAL_BLOG_SEEDS[0]);

    expect(post.slug).toBe('laura-kill-ai-slop');
    expect(post.sourceUrl).toBe('https://github.com/yetone/kill-ai-slop');
    expect(post.canonicalDraftUrl).toBe('https://techandstream.com/blog/laura-kill-ai-slop');
    expect(post.moltBotPrompt).toContain('Source publique');
    expect(post.moltBotPrompt).not.toMatch(/API_KEY|SECRET|TOKEN|PASSWORD|sk-/);
  });
});

