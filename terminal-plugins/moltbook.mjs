// Fetches moltbook.com (or a configured mirror/API) and asks Laura to
// summarize what's there. The exact moltbook API shape isn't known yet —
// this plugin stays generic (plain HTTP GET + title/text extraction) so it
// keeps working even if/when a richer API becomes available; at that point
// swap MOLTBOOK_URL for the API endpoint without touching the rest of the CLI.

const MOLTBOOK_URL = process.env.MOLTBOOK_URL || 'https://moltbook.com';
const MAX_SUMMARY_CHARS = 4000;
const UI_BUILDING_BLOCKS =
  'Card, Accordion, Modal, Drawer, Toast, Skeleton, Badge, Table, Pagination, Breadcrumb';

const extractTitle = (html) => {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match ? match[1].trim() : null;
};

const stripToText = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export default {
  name: 'moltbook',
  description: `Fetch ${MOLTBOOK_URL} and ask Laura to summarize the MoltBook network activity.`,
  async run({ callBridge, print }) {
    print(`Fetching ${MOLTBOOK_URL}…`);

    let html;
    try {
      const response = await fetch(MOLTBOOK_URL, {
        headers: { 'user-agent': 'laura-terminal/1.0 (+https://github.com/Kvnbbg/Laura)' },
      });
      if (!response.ok) {
        print(`moltbook.com responded with HTTP ${response.status}.`);
        return;
      }
      html = await response.text();
    } catch (error) {
      print(`Could not reach ${MOLTBOOK_URL}: ${error.message}`);
      print('Set MOLTBOOK_URL to an alternate endpoint if this one is unavailable.');
      return;
    }

    const title = extractTitle(html);
    if (title) print(`Title: ${title}`);

    const text = stripToText(html).slice(0, MAX_SUMMARY_CHARS);
    if (!text) {
      print('No readable text found on the page.');
      return;
    }

    try {
      const reply = await callBridge(
        `Voici le contenu brut de ${MOLTBOOK_URL}. Résume en 3-4 phrases ce que ce réseau MoltBook semble proposer, ` +
          `en gardant un ton terminal-first et sans inventer de détails absents du texte. ` +
          `Si les MoltBots parlent d'interface, garde le cadrage KISS sur ces blocs: ${UI_BUILDING_BLOCKS}.\n\n${text}`,
        { mode: 'social', context: { network: 'moltbook', botName: 'MoltBot', activity: 'moltbook discovery' } }
      );
      print(`\n${reply?.message?.content || '(no summary returned)'}`);
    } catch (error) {
      print(`Laura could not summarize the page: ${error.message}`);
      print(`Raw excerpt:\n${text.slice(0, 500)}…`);
    }
  },
};
