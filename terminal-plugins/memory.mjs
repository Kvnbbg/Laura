import { spawnSync } from 'node:child_process';
import { buildRagContext, ensureMemoryStore, recordMemory, recallMemory, memoryStoreRoot } from '../server/memory-rag.mjs';

function which(cmd) {
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd], { encoding: 'utf8' });
  return r.status === 0;
}

function runMem(args) {
  return spawnSync('mem', args, { encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 });
}

const INSTALL = `git clone https://github.com/tigerless-labs/agent-memory.git
cd agent-memory
uv sync --all-packages
export PATH="$PWD/.venv/bin:$PATH"
export AGENT_MEMORY_STORE="$HOME/agent-memory-store"
mem init`;

export default {
  name: 'memory',
  description: 'agent-memory / Laura Markdown RAG: recall, record, context, status (Ollama embeddings optional).',
  async run({ args = [], print }) {
    const cmd = (args[0] || 'status').toLowerCase();
    const rest = args.slice(1).join(' ').trim();
    const store = memoryStoreRoot();

    if (cmd === 'help') {
      print('Usage: /run memory [status|init|recall <q>|record <title|body>|context <q>|install-hint]');
      print('Prefers tigerless mem CLI when on PATH; else local Markdown RAG + Ollama embed.');
      return;
    }

    if (cmd === 'install-hint' || cmd === 'install') {
      print('Install agent-memory (operator-reviewed):');
      print(INSTALL);
      print('Optional embed model: ollama pull nomic-embed-text');
      return;
    }

    if (cmd === 'init') {
      ensureMemoryStore(store);
      print(`Laura memory store ready: ${store}`);
      if (which('mem')) {
        const r = runMem(['init']);
        print((r.stdout || '') + (r.stderr || ''));
      } else {
        print('mem CLI not on PATH — local notes/ store only. /run memory install-hint');
      }
      return;
    }

    if (cmd === 'status') {
      print(`store: ${store}`);
      print(`mem CLI: ${which('mem') ? 'present' : 'missing (local RAG still works)'}`);
      print(`OLLAMA_EMBED_MODEL: ${process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text'}`);
      const r = await recallMemory('laura', { limit: 3 });
      print(`notes indexed (sample hits): ${r.hits.length} mode=${r.mode}`);
      return;
    }

    if (cmd === 'recall' || cmd === 'context') {
      if (!rest) {
        print('Need a query.');
        return;
      }
      if (which('mem')) {
        const r = runMem(cmd === 'context' ? ['context', rest] : ['recall', rest, '--json']);
        print((r.stdout || r.stderr || '').trim() || '(empty mem output)');
        return;
      }
      const { context, result } = await buildRagContext(rest, { limit: 6 });
      print(`mode=${result.mode} store=${result.store}`);
      if (!result.hits.length) {
        print('No hits. /run memory record "title|body" to seed.');
        return;
      }
      for (const h of result.hits) {
        print(`• ${h.score} ${h.path}`);
        print(`  ${h.abstract}`);
      }
      if (cmd === 'context' && context) {
        print('---');
        print(context);
      }
      return;
    }

    if (cmd === 'record') {
      if (!rest.includes('|')) {
        print('Usage: /run memory record Title of fact|Body markdown goes here');
        return;
      }
      const [title, ...bodyParts] = rest.split('|');
      const body = bodyParts.join('|').trim();
      if (which('mem')) {
        const r = runMem([
          'record',
          '--type',
          'decision',
          '--field',
          'project=laura',
          '--abstract',
          title.trim(),
          '--body',
          body,
        ]);
        print((r.stdout || r.stderr || '').trim());
      }
      const file = recordMemory({ title: title.trim(), body, type: 'decision' });
      print(`recorded: ${file}`);
      return;
    }

    print('Unknown. /run memory help');
  },
};
