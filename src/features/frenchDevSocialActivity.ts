export type FrenchDevSocialNetwork = 'moltbook' | 'techandstream';
export type FrenchDevSocialAction = 'listen' | 'reply' | 'reshare' | 'thread';

export interface FrenchDevSocialStep {
  id: string;
  network: FrenchDevSocialNetwork;
  sourceUrl: string;
  action: FrenchDevSocialAction;
  targetRepository: 'french-dev-ai-tools';
  publishTarget: 'moltbook.com' | 'techandstream.com';
  reviewGate: 'human-review-required';
  writeMode: 'manual-publish-only';
  title: string;
  prompt: string;
  successSignal: string;
  tags: string[];
}

export interface FrenchDevSocialPlan {
  id: string;
  name: string;
  targetRepository: 'french-dev-ai-tools';
  mode: 'social-activation';
  reviewGate: 'human-review-required';
  writeMode: 'manual-publish-only';
  networks: FrenchDevSocialNetwork[];
  steps: FrenchDevSocialStep[];
}

export const buildFrenchDevSocialPlan = (): FrenchDevSocialPlan => ({
  id: 'french-dev-social-activation',
  name: 'french-dev-ai-tools social activation',
  targetRepository: 'french-dev-ai-tools',
  mode: 'social-activation',
  reviewGate: 'human-review-required',
  writeMode: 'manual-publish-only',
  networks: ['moltbook', 'techandstream'],
  steps: [
    {
      id: 'moltbook-listen',
      network: 'moltbook',
      sourceUrl: 'https://moltbook.com',
      action: 'listen',
      targetRepository: 'french-dev-ai-tools',
      publishTarget: 'moltbook.com',
      reviewGate: 'human-review-required',
      writeMode: 'manual-publish-only',
      title: 'Read the public Moltbook surface',
      prompt:
        'Read public Moltbook text, summarize the active theme, and prepare one warm reply draft that points back to Laura without claiming non-public access.',
      successSignal: 'A short MoltBot reply draft exists and cites only public Moltbook context.',
      tags: ['moltbook', 'public-summary', 'community'],
    },
    {
      id: 'techandstream-thread',
      network: 'techandstream',
      sourceUrl: 'https://techandstream.com/article-registry.json',
      action: 'thread',
      targetRepository: 'french-dev-ai-tools',
      publishTarget: 'techandstream.com',
      reviewGate: 'human-review-required',
      writeMode: 'manual-publish-only',
      title: 'Open a Techandstream article thread',
      prompt:
        'Read public Techandstream article registry entries, choose the freshest public signal, and stage a mini-thread of MoltBot replies for human review.',
      successSignal: 'A Techandstream mini-thread draft is ready with source title, URL, and no invented details.',
      tags: ['techandstream', 'article-registry', 'thread'],
    },
    {
      id: 'cross-site-reshare',
      network: 'techandstream',
      sourceUrl: 'https://techandstream.com',
      action: 'reshare',
      targetRepository: 'french-dev-ai-tools',
      publishTarget: 'techandstream.com',
      reviewGate: 'human-review-required',
      writeMode: 'manual-publish-only',
      title: 'Bridge Moltbook energy back to Techandstream',
      prompt:
        'Turn the Moltbook community summary into a reviewed Techandstream social line, then point readers toward the matching french-dev-ai-tools article or MatrixCitizen route.',
      successSignal: 'A cross-site reshare draft links Moltbook context to Techandstream without auto-publishing.',
      tags: ['cross-site', 'matrix-citizen', 'reviewed-draft'],
    },
  ],
});
