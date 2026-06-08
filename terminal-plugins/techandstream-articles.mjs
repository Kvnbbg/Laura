// Lets the MoltBots discuss real posts from techandstream.com / french-dev-ai-tools
// instead of generic chatter. Pulls the public article registry (the same JSON
// the site itself uses to list its blog posts), picks a few recent entries, and
// asks Laura — in MoltBots "social" mode — to stage a short in-character debate
// about them, as the persona-driven agents on techandstream.com would.
//
// techandstream.com is prioritized over moltbook because it's the revenue-bearing
// product (Laura is the open-source side); override with TECHANDSTREAM_REGISTRY_URL
// if you want to point this at a different registry/mirror.

const REGISTRY_URL =
  process.env.TECHANDSTREAM_REGISTRY_URL || 'https://techandstream.com/article-registry.json';
const ARTICLE_COUNT = Number(process.env.TECHANDSTREAM_ARTICLE_COUNT) || 3;

export default {
  name: 'techandstream-articles',
  description: `Fetch recent posts from ${REGISTRY_URL} and have the MoltBots discuss them in character.`,
  async run({ callBridge, print }) {
    print(`Fetching recent posts from ${REGISTRY_URL}…`);

    let registry;
    try {
      const response = await fetch(REGISTRY_URL, { headers: { accept: 'application/json' } });
      if (!response.ok) {
        print(`Registry responded with HTTP ${response.status}.`);
        return;
      }
      registry = await response.json();
    } catch (error) {
      print(`Could not reach ${REGISTRY_URL}: ${error.message}`);
      print('Set TECHANDSTREAM_REGISTRY_URL to an alternate endpoint if this one is unavailable.');
      return;
    }

    if (!Array.isArray(registry) || registry.length === 0) {
      print('Registry returned no articles.');
      return;
    }

    const picks = registry
      .filter((entry) => entry?.title && entry?.url)
      .sort((a, b) => (b?.updated || '').localeCompare(a?.updated || ''))
      .slice(0, ARTICLE_COUNT);

    if (picks.length === 0) {
      print('No usable article entries found in the registry.');
      return;
    }

    const summary = picks
      .map((entry) => `- "${entry.title}" (${entry.category || 'sans catégorie'}) — ${entry.url}`)
      .join('\n');
    print(`\nPosts retenus :\n${summary}`);

    try {
      const reply = await callBridge(
        `Voici quelques posts récents publiés sur techandstream.com (le produit phare de l'écosystème, ` +
          `prioritaire sur moltbook puisque c'est lui qui génère le chiffre d'affaires) :\n${summary}\n\n` +
          `Mets en scène 2 ou 3 MoltBots du forum qui en discutent brièvement, comme des PNJ vraiment ` +
          `incarnés dans un jeu vidéo : chacun réagit à un post différent avec sa propre personnalité, ` +
          `en restant crédible et sans inventer de contenu absent des titres/catégories ci-dessus.`,
        {
          mode: 'social',
          context: {
            network: 'techandstream',
            botName: 'MoltBot',
            activity: 'forum discussion about techandstream.com posts',
            tags: picks.map((entry) => entry.category).filter(Boolean),
          },
        }
      );
      const thoughts = reply?.networkThoughts;
      if (Array.isArray(thoughts) && thoughts.length > 0) {
        for (const thought of thoughts) {
          const speaker = thought?.speaker || 'MoltBot';
          if (thought?.content) print(`\n[${speaker}] ${thought.content}`);
        }
      } else if (reply?.message?.content) {
        print(`\n${reply.message.content}`);
      } else {
        print('\n(Laura did not return any forum chatter this time.)');
      }
    } catch (error) {
      print(`Laura could not stage the discussion: ${error.message}`);
    }
  },
};
