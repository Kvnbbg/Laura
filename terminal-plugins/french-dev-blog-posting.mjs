// Turns curated public references into review-ready french-dev-ai-tools blog
// prompts for Techandstream. This does not publish anything; it asks Laura to
// stage short MoltBot drafts from public source summaries only.

const BLOG_POSTINGS = [
  {
    id: 'kill-ai-slop',
    title: 'Laura signal: Kill AI Slop',
    sourceUrl: 'https://github.com/yetone/kill-ai-slop',
    tags: ['design-quality', 'agent-skills', 'ui-review', 'open-source'],
    excerpt:
      'A public field guide and agent skill for spotting machine-default product design patterns, then replacing them with cleaner editorial choices.',
    outline: [
      'Use the field guide as a taste filter for Laura and Techandstream UI work before it becomes public copy.',
      'Show how Laura can scan public UI, name the tell, and propose a calmer fix.',
      'Keep publishing manual-review-only through french-dev-ai-tools.',
    ],
    moltBotPrompt:
      'Turn Kill AI Slop into a Laura review ritual: scan public UI, name the tell, propose the calmer Techandstream fix.',
  },
  {
    id: 'data-landscape-guide-for-developers',
    title: 'Laura signal: Guide to data tools landscape for developers',
    sourceUrl: 'https://sinja.io/blog/data-landscape-guide-for-developers',
    tags: ['data-engineering', 'developer-education', 'learning-track', 'blog'],
    excerpt:
      'A developer-oriented map of the data tooling world, from roles and ETL or ELT pipelines to storage, observability, semantic layers, lineage, BI, and reverse ETL.',
    outline: [
      'Turn the guide into a Laura learning track for software developers who need data-team vocabulary.',
      'Map Supabase or Postgres to a later analytics path with DuckDB, embedded analytics, or a warehouse when needed.',
      'Use MoltBots to convert each data layer into missions for Techandstream builders.',
    ],
    moltBotPrompt:
      'Turn the data landscape guide into a Laura learning path: one post explains the map, then MoltBots convert each layer into missions.',
  },
];

function formatPosting(posting) {
  return [
    `- ${posting.title}`,
    `  source: ${posting.sourceUrl}`,
    `  tags: ${posting.tags.join(', ')}`,
    `  angle: ${posting.outline[0]}`,
  ].join('\n');
}

export default {
  name: 'french-dev-blog-posting',
  description:
    'Stage Kill AI Slop and the data landscape guide as reviewed french-dev-ai-tools blog prompts for Techandstream.',
  async run({ callBridge, print }) {
    print('Curated french-dev-ai-tools blog signals:');
    print(BLOG_POSTINGS.map(formatPosting).join('\n\n'));

    let reply;
    try {
      reply = await callBridge(
        [
          'Voici deux signaux publics a transformer en brouillons de posts french-dev-ai-tools pour Techandstream.',
          'Ne publie rien. Prepare seulement des drafts MoltBots courts, credibles, et review-ready.',
          'N invente aucun detail absent des resumes ci-dessous.',
          '',
          ...BLOG_POSTINGS.map((posting) =>
            [
              `Titre: ${posting.title}`,
              `Source: ${posting.sourceUrl}`,
              `Resume: ${posting.excerpt}`,
              `Plan: ${posting.outline.join(' / ')}`,
              `Brief MoltBot: ${posting.moltBotPrompt}`,
            ].join('\n'),
          ),
        ].join('\n\n'),
        {
          mode: 'social',
          context: {
            network: 'techandstream',
            botName: 'MoltBot',
            activity: 'reviewed french-dev-ai-tools blog posting from public external sources',
            targetRepository: 'french-dev-ai-tools',
            writeMode: 'manual-publish-only',
            tags: BLOG_POSTINGS.flatMap((posting) => posting.tags),
          },
        },
      );
    } catch (error) {
      print(`Laura could not stage the blog postings: ${error.message}`);
      return;
    }

    const thoughts = reply?.networkThoughts;
    if (Array.isArray(thoughts) && thoughts.length > 0) {
      thoughts.forEach((thought) => {
        if (!thought?.content) return;
        print(`[${thought?.speaker || 'MoltBot'}] ${thought.content}`);
      });
      return;
    }

    if (reply?.message?.content) {
      print(reply.message.content);
      return;
    }

    print('(Laura did not return blog draft chatter this time.)');
  },
};

