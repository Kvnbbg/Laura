/**
 * Symbiosis registry — single map of Laura terminal capabilities (DRY catalog).
 * Autonomous module: no compile deps; safe read-only status.
 *
 * Data: PLUGIN_CATALOG documents name → purpose → related docs.
 * Comments: each entry is the source of truth for /run symbiosis.
 * Alternative: dynamic import of every .mjs in this folder (heavier; not default).
 */
import { binMap } from './lib/safe-cli.mjs';

const PLUGIN_CATALOG = [
  { name: 'guide', purpose: 'Never-lost next commands', docs: 'docs/AGENT_FRAMEWORKS.md' },
  { name: 'protocols', purpose: 'MCP / A2A / SQL checkpoints', docs: 'docs/MCP_PROTOCOL.md, docs/SQL_CHECKPOINTS.md, docs/A2A_PROTOCOL.md' },
  { name: 'memory', purpose: 'Markdown RAG + agent-memory pilot', docs: 'docs/AGENT_MEMORY_RAG.md' },
  { name: 'orchestra', purpose: 'Multi-agent plan (no free spawn)', docs: 'docs/MULTI_AGENT_ORCHESTRATION.md' },
  { name: 'agents', purpose: 'Hermes OpenClaw Pico Pi AO …', docs: 'docs/AUTONOMOUS_AGENTS.md' },
  { name: 'ecosystem', purpose: 'Tigerless Anakin cost-xray …', docs: 'docs/AUTONOMOUS_AGENTS.md' },
  { name: 'grimoire', purpose: 'Spellbook tools + install hints', docs: 'docs/GRIMOIRE.md' },
  { name: 'copy', purpose: 'COPY paper/hunt bridge', docs: 'docs/COPY_BRIDGE.md' },
  { name: 'rune', purpose: 'Rune IDE pilot kit', docs: 'docs/RUNE_KIT.md' },
  { name: 'rustfx', purpose: 'Rust Web3 engine pilot', docs: 'docs/RUSTFX_ENGINE.md' },
  { name: 'mindwalk', purpose: 'Mindwalk session bridge', docs: null },
  { name: 'symbiosis', purpose: 'This registry + health', docs: 'docs/SYMBIOSIS.md' },
];

const EXTERNAL_BINS = [
  'ollama',
  'mem',
  'hermes',
  'openclaw',
  'ao',
  'aider',
  'claude',
  'codex',
  'pi',
  'opencode',
  'cx',
  'anakin',
];

export default {
  name: 'symbiosis',
  description: 'Catalog + health of Laura modules (DRY, no duplicates).',
  async run({ args = [], print }) {
    const cmd = (args[0] || 'status').toLowerCase();

    if (cmd === 'help') {
      print('/run symbiosis [status|plugins|bins|map|next]');
      print('Docs: docs/SYMBIOSIS.md');
      return;
    }

    if (cmd === 'plugins' || cmd === 'list') {
      for (const p of PLUGIN_CATALOG) {
        print(`• ${p.name} — ${p.purpose}`);
        if (p.docs) print(`  ${p.docs}`);
      }
      print('Ensuite: /run guide next');
      return;
    }

    if (cmd === 'bins') {
      const map = binMap(EXTERNAL_BINS);
      for (const [k, v] of Object.entries(map)) print(`  ${k}: ${v ? 'OK' : 'missing'}`);
      print('Ensuite: /run agents list');
      return;
    }

    if (cmd === 'map') {
      print('Laura surface');
      print('  ├─ guide / protocols / memory / orchestra');
      print('  ├─ agents / ecosystem / grimoire');
      print('  ├─ copy / rune / rustfx / mindwalk');
      print('  └─ server: ollama-models + memory-rag + orchestra-plan');
      print('Mémoire: ~/.laura-memory  |  AGENT_MEMORY_STORE');
      print('Ensuite: /run symbiosis status');
      return;
    }

    if (cmd === 'next') {
      print('Prochain gain (ordre suggéré):');
      print('  1. /run memory status');
      print('  2. /run protocols compare');
      print('  3. /run orchestra plan <ton goal>');
      print('  4. export OLLAMA_MODEL=qwen2.5:3b LAURA_RAG=1');
      print('  5. npm run chat');
      return;
    }

    // status (default)
    print('=== Laura symbiosis ===');
    print(`plugins catalogued: ${PLUGIN_CATALOG.length}`);
    const map = binMap(['ollama', 'mem', 'hermes', 'openclaw']);
    print(`ollama=${map.ollama ? 'OK' : 'no'} mem=${map.mem ? 'OK' : 'no'} hermes=${map.hermes ? 'OK' : 'no'} openclaw=${map.openclaw ? 'OK' : 'no'}`);
    print(`LAURA_RAG=${process.env.LAURA_RAG ?? '(default on)'}`);
    print(`OLLAMA_MODEL=${process.env.OLLAMA_MODEL || process.env.LAURA_LOCAL_MODEL || '(unset)'}`);
    print('Ensuite: /run symbiosis plugins | /run symbiosis next | /run guide lost');
  },
};
