export interface ExternalBlogSeed {
  id: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceKind: 'field-guide' | 'technical-guide';
  authorLabel: string;
  bridgeAngle: string;
  summary: string;
  sourceFacts: string[];
  tags: string[];
  moltBotBrief: string;
}

export interface FrenchDevBlogPosting {
  id: string;
  slug: string;
  title: string;
  sourceUrl: string;
  canonicalDraftUrl: string;
  targetRepository: 'french-dev-ai-tools';
  publishTarget: 'techandstream.com';
  reviewGate: 'human-review-required';
  writeMode: 'manual-publish-only';
  tags: string[];
  excerpt: string;
  outline: string[];
  moltBotPrompt: string;
}

export const FRENCH_DEV_EXTERNAL_BLOG_SEEDS: readonly ExternalBlogSeed[] = [
  {
    id: 'kill-ai-slop',
    sourceTitle: 'Kill AI Slop',
    sourceUrl: 'https://github.com/yetone/kill-ai-slop',
    sourceKind: 'field-guide',
    authorLabel: 'yetone',
    bridgeAngle:
      'Use the field guide as a taste filter for Laura and Techandstream UI work before it becomes public copy.',
    summary:
      'A public field guide and agent skill for spotting machine-default product design patterns, then replacing them with cleaner editorial choices.',
    sourceFacts: [
      'The project describes 33 recurring AI-product design and copy tells.',
      'It ships a website and an agent skill that can scan web projects without editing them directly.',
      'Its design stance favors paper, ink, hierarchy, restraint, and a single editorial red over gradients and noisy badges.',
    ],
    tags: ['design-quality', 'agent-skills', 'ui-review', 'open-source'],
    moltBotBrief:
      'Turn Kill AI Slop into a Laura review ritual: scan public UI, name the tell, propose the calmer Techandstream fix.',
  },
  {
    id: 'data-landscape-guide-for-developers',
    sourceTitle: 'Guide to data tools landscape for developers',
    sourceUrl: 'https://sinja.io/blog/data-landscape-guide-for-developers',
    sourceKind: 'technical-guide',
    authorLabel: 'OlegWock',
    bridgeAngle:
      'Use the guide as a map for Laura learning tracks that explain data tooling to software developers without buzzword fog.',
    summary:
      'A developer-oriented map of the data tooling world, from roles and ETL or ELT pipelines to storage, observability, semantic layers, lineage, BI, and reverse ETL.',
    sourceFacts: [
      'The guide is aimed at software developers who need to understand data-team vocabulary and workflow.',
      'It frames the data lifecycle around extraction, transformation, loading, storage, processing, and consumption.',
      'It connects practical tool categories such as warehouses, lakes, orchestrators, dbt, observability, catalogs, semantic layers, dashboards, and operational analytics.',
      'For Techandstream-sized products, Supabase or Postgres can remain the transactional source while DuckDB, embedded analytics, or a later warehouse handles heavier reporting.',
    ],
    tags: ['data-engineering', 'developer-education', 'learning-track', 'blog'],
    moltBotBrief:
      'Turn the data landscape guide into a Laura learning path: one post explains the map, then MoltBots convert each layer into missions.',
  },
];

const slugify = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();

export const buildFrenchDevBlogPosting = (seed: ExternalBlogSeed): FrenchDevBlogPosting => {
  const slug = slugify(`laura-${seed.id}`);

  return {
    id: seed.id,
    slug,
    title: `Laura signal: ${seed.sourceTitle}`,
    sourceUrl: seed.sourceUrl,
    canonicalDraftUrl: `https://techandstream.com/blog/${slug}`,
    targetRepository: 'french-dev-ai-tools',
    publishTarget: 'techandstream.com',
    reviewGate: 'human-review-required',
    writeMode: 'manual-publish-only',
    tags: ['Laura', 'MoltBots', 'Techandstream', ...seed.tags].slice(0, 12),
    excerpt: seed.summary,
    outline: [
      `Source: ${seed.sourceTitle} by ${seed.authorLabel}.`,
      seed.bridgeAngle,
      'What Laura can do with it in the open-source repo.',
      'How french-dev-ai-tools can turn the signal into a reviewed Techandstream post.',
      'MoltBot prompt and next public-safe action.',
    ],
    moltBotPrompt: [
      `Source publique: ${seed.sourceTitle} (${seed.sourceUrl}).`,
      seed.summary,
      `Angle Laura: ${seed.bridgeAngle}`,
      `Brief MoltBot: ${seed.moltBotBrief}`,
      'Prepare un court brouillon de post french-dev-ai-tools pour Techandstream, sans inventer de details absents de la source.',
    ].join('\n'),
  };
};

export const buildFrenchDevBlogPostingQueue = (
  seeds: readonly ExternalBlogSeed[] = FRENCH_DEV_EXTERNAL_BLOG_SEEDS,
): FrenchDevBlogPosting[] => seeds.map(buildFrenchDevBlogPosting);
