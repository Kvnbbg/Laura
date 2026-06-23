// Lets the MoltBots discuss real posts from techandstream.com / french-dev-ai-tools
// instead of generic chatter. Pulls the public article registry (the same JSON
// the site itself uses to list its blog posts), picks the most recent entry, and
// asks Laura — in MoltBots "social" mode — to stage a short in-character debate
// about it (and, when the registry tags same-day companion posts via an optional
// "thread" field, a threaded sub-discussion that replies across them), as the
// persona-driven agents on techandstream.com would.
//
// techandstream.com is prioritized over moltbook because it's the revenue-bearing
// product (Laura is the open-source side); override with TECHANDSTREAM_REGISTRY_URL
// if you want to point this at a different registry/mirror.

const REGISTRY_URL =
  process.env.TECHANDSTREAM_REGISTRY_URL || 'https://techandstream.com/article-registry.json';
const ARTICLE_COUNT = Number(process.env.TECHANDSTREAM_ARTICLE_COUNT) || 3;
const THREAD_COMPANION_LIMIT = Number(process.env.TECHANDSTREAM_THREAD_LIMIT) || 2;
const UI_BUILDING_BLOCKS =
  'Card, Accordion, Modal, Drawer, Toast, Skeleton, Badge, Table, Pagination, Breadcrumb';

function describe(entry) {
  return `"${entry.title}" (${entry.category || 'sans catégorie'}) — ${entry.url}`;
}

export default {
  name: 'techandstream-articles',
  description: `Fetch recent posts from ${REGISTRY_URL} and have the MoltBots discuss them — in threads when the registry links same-day companions.`,
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

    const usable = registry
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => entry?.title && entry?.url);

    // Newest first; among same-day entries, the one appended last in the
    // registry (highest original index) is treated as the freshest — a plain
    // stable sort would otherwise keep same-date posts in registry order and
    // bury the most recently published one behind older same-day siblings.
    const ranked = [...usable].sort((a, b) => {
      const byDate = (b.entry.updated || '').localeCompare(a.entry.updated || '');
      return byDate !== 0 ? byDate : b.index - a.index;
    });

    if (ranked.length === 0) {
      print('No usable article entries found in the registry.');
      return;
    }

    const lead = ranked[0].entry;

    // Same-day companions: prefer the explicit "thread" tag the registry can
    // carry; fall back to a same-"updated"-date grouping when posts haven't
    // been tagged yet, so threads still form for untagged same-day content.
    const companions = ranked
      .slice(1)
      .map(({ entry }) => entry)
      .filter((entry) => {
        if (lead.thread && entry.thread) return entry.thread === lead.thread;
        if (!lead.thread && !entry.thread) return entry.updated === lead.updated;
        return false;
      })
      .slice(0, THREAD_COMPANION_LIMIT);

    let reply;
    if (companions.length > 0) {
      const threadList = companions.map((entry) => `- ${describe(entry)}`).join('\n');
      print(`\nFil du jour autour de :\n- ${describe(lead)}\nRépondants liés :\n${threadList}`);

      try {
        reply = await callBridge(
          `Voici un post récent de techandstream.com (le produit phare, prioritaire sur moltbook puisque ` +
            `c'est lui qui génère le chiffre d'affaires) qui ouvre la discussion du jour :\n- ${describe(lead)}\n\n` +
            `Et voici des posts compagnons publiés le même jour, qui forment un sous-fil de réponses :\n${threadList}\n\n` +
            `Mets en scène un MINI SOUS-FIL de forum MoltBots : un premier bot ouvre la discussion sur le post ` +
            `principal, puis 1 ou 2 autres bots RÉPONDENT directement à ce premier message en reliant leur post ` +
            `compagnon au sujet ouvert (ils doivent référencer ce que le bot précédent vient de dire, comme une ` +
            `vraie réponse de fil et pas un message isolé). Reste crédible, garde chaque bot dans sa personnalité, ` +
            `et n'invente aucun contenu absent des titres/catégories ci-dessus. Si le fil parle d'interface, ` +
            `garde le cadrage KISS sur ces blocs: ${UI_BUILDING_BLOCKS}.`,
          {
            mode: 'social',
            context: {
              network: 'techandstream',
              botName: 'MoltBot',
              activity: 'threaded forum discussion about same-day techandstream.com posts',
              tags: [lead, ...companions].map((entry) => entry.category).filter(Boolean),
            },
          }
        );
      } catch (error) {
        print(`Laura could not stage the threaded discussion: ${error.message}`);
        return;
      }
    } else {
      const picks = ranked.slice(0, ARTICLE_COUNT).map(({ entry }) => entry);
      const summary = picks.map((entry) => `- ${describe(entry)}`).join('\n');
      print(`\nPosts retenus :\n${summary}`);

      try {
        reply = await callBridge(
          `Voici quelques posts récents publiés sur techandstream.com (le produit phare de l'écosystème, ` +
            `prioritaire sur moltbook puisque c'est lui qui génère le chiffre d'affaires) :\n${summary}\n\n` +
            `Mets en scène 2 ou 3 MoltBots du forum qui en discutent brièvement, comme des PNJ vraiment ` +
            `incarnés dans un jeu vidéo : chacun réagit à un post différent avec sa propre personnalité, ` +
            `en restant crédible et sans inventer de contenu absent des titres/catégories ci-dessus. Si le sujet ` +
            `touche l'interface, garde le cadrage KISS sur ces blocs: ${UI_BUILDING_BLOCKS}.`,
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
      } catch (error) {
        print(`Laura could not stage the discussion: ${error.message}`);
        return;
      }
    }

    const thoughts = reply?.networkThoughts;
    if (Array.isArray(thoughts) && thoughts.length > 0) {
      thoughts.forEach((thought, position) => {
        const speaker = thought?.speaker || 'MoltBot';
        if (!thought?.content) return;
        // First message opens the thread; the rest render as visible replies
        // (indented with a reply marker) when we staged a sub-thread.
        const isReply = companions.length > 0 && position > 0;
        const prefix = isReply ? '   └─ ' : '\n';
        print(`${prefix}[${speaker}] ${thought.content}`);
      });
    } else if (reply?.message?.content) {
      print(`\n${reply.message.content}`);
    } else {
      print('\n(Laura did not return any forum chatter this time.)');
    }
  },
};
