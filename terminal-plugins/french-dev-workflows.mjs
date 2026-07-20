// Emits a compact, public-safe workflow view for the french-dev-ai-tools social
// blog loop. It is a local plan printer, not an external workflow executor.

const WORKFLOW_RUN = {
  id: 'workflow-french-dev-social-blog',
  platform: 'Workflows',
  contract: 'laura-workflows-social-blog-v1',
  targetRepository: 'french-dev-ai-tools',
  reviewGate: 'human-review-required',
  writeMode: 'manual-publish-only',
  steps: [
    ['seed-public-sources', 'done', '2 blog seeds available'],
    ['stage-social-activity', 'running', '3 social activation steps available'],
    ['human-review', 'needs_review', 'manual-publish-only gate is active'],
    ['publish-or-skip', 'queued', 'no external write before approval'],
  ],
};

export default {
  name: 'french-dev-workflows',
  description: 'Print the durable Workflows run for the french-dev-ai-tools social blog loop.',
  async run({ print }) {
    print(`${WORKFLOW_RUN.platform}: ${WORKFLOW_RUN.id}`);
    print(`contract: ${WORKFLOW_RUN.contract}`);
    print(`target: ${WORKFLOW_RUN.targetRepository}`);
    print(`gate: ${WORKFLOW_RUN.reviewGate}, ${WORKFLOW_RUN.writeMode}`);
    WORKFLOW_RUN.steps.forEach(([id, status, signal]) => {
      print(`- ${id}: ${status} | ${signal}`);
    });
  },
};

