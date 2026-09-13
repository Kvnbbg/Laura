import { spawnSync } from 'node:child_process';
import {
  buildOrchestraPlan,
  listPatterns,
  listRuntimes,
} from '../server/orchestra-plan.mjs';

const BINS = ['hermes', 'openclaw', 'ao', 'aider', 'claude', 'codex', 'pi', 'opencode', 'mem'];

function which(cmd) {
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd], { encoding: 'utf8' });
  return r.status === 0;
}

export default {
  name: 'orchestra',
  description: 'Multi-agent orchestration: patterns, status, plan (no arbitrary spawn).',
  async run({ args = [], print }) {
    const cmd = (args[0] || 'help').toLowerCase();

    if (cmd === 'help' || cmd === '') {
      print('Orchestration multi-agents (Laura pilote, n’exécute pas de fleet libre)');
      print('  /run orchestra status');
      print('  /run orchestra patterns');
      print('  /run orchestra runtimes');
      print('  /run orchestra plan <goal…>');
      print('  /run orchestra plan --pattern fanout --prefer hermes <goal…>');
      print('Doc: docs/MULTI_AGENT_ORCHESTRATION.md');
      return;
    }

    if (cmd === 'status') {
      print('Bins détectés:');
      for (const b of BINS) print(`  ${b}: ${which(b) ? 'OK' : 'missing'}`);
      print('Patterns: /run orchestra patterns');
      print('Plan: /run orchestra plan "paralléliser tests et docs"');
      return;
    }

    if (cmd === 'patterns') {
      for (const p of listPatterns()) {
        print(`• ${p.id} — ${p.title}`);
        print(`  quand: ${p.when}`);
      }
      return;
    }

    if (cmd === 'runtimes') {
      for (const r of listRuntimes()) {
        print(`• ${r.id} — best for: ${r.bestFor.join(', ')}`);
        print(`  isolation: ${r.isolation}`);
      }
      return;
    }

    if (cmd === 'plan') {
      let pattern;
      let prefer;
      const rest = [];
      for (let i = 1; i < args.length; i++) {
        if (args[i] === '--pattern' && args[i + 1]) {
          pattern = args[++i];
          continue;
        }
        if (args[i] === '--prefer' && args[i + 1]) {
          prefer = args[++i];
          continue;
        }
        rest.push(args[i]);
      }
      const goal = rest.join(' ').trim();
      if (!goal) {
        print('Usage: /run orchestra plan [--pattern fanout] [--prefer hermes] <goal>');
        return;
      }
      const plan = buildOrchestraPlan(goal, { pattern, prefer });
      print(JSON.stringify(plan, null, 2));
      print('---');
      print('Commandes suggérées (à valider):');
      for (const c of plan.suggestedCommands) print(`  ${c}`);
      print('Suite Laura:');
      for (const c of plan.lauraNext) print(`  ${c}`);
      return;
    }

    print('Unknown. /run orchestra help');
  },
};
