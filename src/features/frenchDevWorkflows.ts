import { buildFrenchDevBlogPostingQueue } from './frenchDevBlogSeeds';
import { buildFrenchDevSocialPlan } from './frenchDevSocialActivity';

export type FrenchDevWorkflowStatus = 'queued' | 'running' | 'needs_review' | 'done';

export interface FrenchDevWorkflowStep {
  id: string;
  title: string;
  status: FrenchDevWorkflowStatus;
  durable: true;
  retryPolicy: string;
  monitorSignal: string;
}

export interface FrenchDevWorkflowRun {
  id: string;
  name: string;
  targetRepository: 'french-dev-ai-tools';
  platform: 'Workflows';
  contract: 'laura-workflows-social-blog-v1';
  faultTolerant: true;
  reviewGate: 'human-review-required';
  writeMode: 'manual-publish-only';
  steps: FrenchDevWorkflowStep[];
  artifacts: {
    blogPostingIds: string[];
    socialStepIds: string[];
  };
}

export const buildFrenchDevWorkflowRun = (): FrenchDevWorkflowRun => {
  const blogPostings = buildFrenchDevBlogPostingQueue();
  const socialPlan = buildFrenchDevSocialPlan();

  return {
    id: 'workflow-french-dev-social-blog',
    name: 'french-dev-ai-tools social blog loop',
    targetRepository: 'french-dev-ai-tools',
    platform: 'Workflows',
    contract: 'laura-workflows-social-blog-v1',
    faultTolerant: true,
    reviewGate: 'human-review-required',
    writeMode: 'manual-publish-only',
    steps: [
      {
        id: 'seed-public-sources',
        title: 'Seed public blog sources',
        status: 'done',
        durable: true,
        retryPolicy: 'replay from curated source URLs',
        monitorSignal: `${blogPostings.length} blog posting seeds available`,
      },
      {
        id: 'stage-social-activity',
        title: 'Stage Moltbook and Techandstream social drafts',
        status: 'running',
        durable: true,
        retryPolicy: 'retry public fetches, keep last known draft context',
        monitorSignal: `${socialPlan.steps.length} social activation steps available`,
      },
      {
        id: 'human-review',
        title: 'Hold for human review',
        status: 'needs_review',
        durable: true,
        retryPolicy: 'resume after review decision',
        monitorSignal: 'manual-publish-only gate is active',
      },
      {
        id: 'publish-or-skip',
        title: 'Publish approved public lines or skip safely',
        status: 'queued',
        durable: true,
        retryPolicy: 'idempotent publish key per approved artifact',
        monitorSignal: 'no external write before approval',
      },
    ],
    artifacts: {
      blogPostingIds: blogPostings.map((post) => post.id),
      socialStepIds: socialPlan.steps.map((step) => step.id),
    },
  };
};

