// Stages public-safe social activity across Moltbook and Techandstream for the
// french-dev-ai-tools route. It reads public surfaces and prepares reviewed
// drafts only; it never posts directly.

const MOLTBOOK_URL = process.env.MOLTBOOK_URL || 'https://moltbook.com';
const REGISTRY_URL =
  process.env.TECHANDSTREAM_REGISTRY_URL || 'https://techandstream.com/article-registry.json';
const MAX_TEXT_CHARS = 2400;

function stripToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchMoltbook() {
  const response = await fetch(MOLTBOOK_URL, {
    headers: { 'user-agent': 'laura-terminal/1.0 (+https://github.com/Kvnbbg/Laura)' },
  });
  if (!response.ok) return { ok: false, summary: `moltbook HTTP ${response.status}` };

  const html = await response.text();
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || 'Moltbook';
  const text = stripToText(html).slice(0, MAX_TEXT_CHARS);
  return { ok: true, summary: `${title}\n${text}`.trim() };
}

async function fetchTechandstreamRegistry() {
  const response = await fetch(REGISTRY_URL, { headers: { accept: 'application/json' } });
  if (!response.ok) return { ok: false, summary: `techandstream registry HTTP ${response.status}` };

  const registry = await response.json();
  if (!Array.isArray(registry)) return { ok: false, summary: 'techandstream registry is not an array' };

  const posts = registry
    .filter((entry) => entry?.title && entry?.url)
    .slice(-5)
    .reverse()
    .map((entry) => `- ${entry.title} (${entry.category || 'sans categorie'}) ${entry.url}`)
    .join('\n');

  return { ok: true, summary: posts || 'no usable Techandstream posts' };
}

export default {
  name: 'french-dev-social',
  description:
    'Stage reviewed Moltbook + Techandstream social activity for french-dev-ai-tools without publishing.',
  async run({ callBridge, print }) {
    print('Reading public Moltbook and Techandstream signals...');

    const [moltbook, techandstream] = await Promise.allSettled([fetchMoltbook(), fetchTechandstreamRegistry()]);
    const moltbookSignal =
      moltbook.status === 'fulfilled' ? moltbook.value.summary : `moltbook fetch failed: ${moltbook.reason.message}`;
    const techandstreamSignal =
      techandstream.status === 'fulfilled'
        ? techandstream.value.summary
        : `techandstream fetch failed: ${techandstream.reason.message}`;

    print(`Moltbook signal:\n${moltbookSignal.slice(0, 500)}`);
    print(`\nTechandstream signal:\n${techandstreamSignal.slice(0, 500)}`);

    let reply;
    try {
      reply = await callBridge(
        [
          'Prepare une activation sociale pour french-dev-ai-tools sur Moltbook et Techandstream.',
          'Ne publie rien. Produis seulement des drafts courts, publics, review-ready.',
          'Fais 1 reply Moltbook, 1 mini-thread Techandstream, et 1 ligne cross-site qui relie les deux.',
          'Ne mentionne aucun acces prive, aucun token, aucun log brut.',
          '',
          `Moltbook public signal:\n${moltbookSignal}`,
          '',
          `Techandstream public signal:\n${techandstreamSignal}`,
        ].join('\n\n'),
        {
          mode: 'social',
          context: {
            network: 'moltbook+techandstream',
            botName: 'MoltBot',
            activity: 'reviewed social activation for french-dev-ai-tools',
            targetRepository: 'french-dev-ai-tools',
            writeMode: 'manual-publish-only',
            tags: ['moltbook', 'techandstream', 'french-dev-ai-tools', 'social-activation'],
          },
        },
      );
    } catch (error) {
      print(`Laura could not stage social activity: ${error.message}`);
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

    print(reply?.message?.content || '(Laura did not return social drafts this time.)');
  },
};

