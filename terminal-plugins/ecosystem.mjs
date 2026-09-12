/**
 * Pilot kit for sibling agent tooling (install hints + status only).
 * Repos: tigerless cost-xray / paper-radar / seo-ops, Anakin CLI, AO.
 */
import { spawnSync } from 'node:child_process';

const TOOLS = {
  'agent-memory': {
    repo: 'https://github.com/tigerless-labs/agent-memory',
    bin: 'mem',
    install:
      'git clone https://github.com/tigerless-labs/agent-memory.git && cd agent-memory && uv sync --all-packages && export PATH="$PWD/.venv/bin:$PATH" && mem init',
  },
  'cost-xray': {
    repo: 'https://github.com/tigerless-labs/cost-xray',
    bin: 'cx',
    install:
      '# review install.sh first\n# curl -fsSL https://raw.githubusercontent.com/tigerless-labs/cost-xray/master/install.sh | bash',
    statusArgs: ['status'],
  },
  'paper-radar': {
    repo: 'https://github.com/tigerless-labs/paper-radar',
    bin: 'paper-radar',
    install: 'git clone https://github.com/tigerless-labs/paper-radar.git && cd paper-radar && cat README.md',
  },
  'seo-ops': {
    repo: 'https://github.com/tigerless-labs/seo-ops',
    bin: 'seo-ops',
    install: 'git clone https://github.com/tigerless-labs/seo-ops.git && cd seo-ops && cat README.md',
  },
  anakin: {
    repo: 'https://github.com/Anakin-Inc/anakin-cli',
    bin: 'anakin',
    install: 'pip install anakin-cli && anakin status',
    statusArgs: ['status'],
  },
  ao: {
    repo: 'https://github.com/Untrivial-ai/agent-orchestrator',
    bin: 'ao',
    install:
      'Download desktop app from https://github.com/Untrivial-ai/agent-orchestrator/releases — Laura does not auto-install GUI apps.',
  },
};

function which(cmd) {
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd], { encoding: 'utf8' });
  return r.status === 0;
}

export default {
  name: 'ecosystem',
  description: 'Status + install hints for agent-memory, cost-xray, paper-radar, seo-ops, anakin-cli, AO.',
  async run({ args = [], print }) {
    const name = (args[0] || 'list').toLowerCase();
    if (name === 'list' || name === 'help') {
      print('Ecosystem pilots (Laura suggests; you run installs):');
      for (const [k, v] of Object.entries(TOOLS)) {
        print(`• ${k} — ${which(v.bin) ? 'bin OK' : 'missing'} — ${v.repo}`);
      }
      print('Usage: /run ecosystem <name> [status|install-hint]');
      return;
    }
    const tool = TOOLS[name];
    if (!tool) {
      print(`Unknown tool ${name}. /run ecosystem list`);
      return;
    }
    const action = (args[1] || 'status').toLowerCase();
    print(`${name}: ${tool.repo}`);
    print(`binary: ${tool.bin} → ${which(tool.bin) ? 'present' : 'not on PATH'}`);
    if (action === 'install' || action === 'install-hint') {
      print('Install (review before running):');
      print(tool.install);
      return;
    }
    if (which(tool.bin) && tool.statusArgs) {
      const r = spawnSync(tool.bin, tool.statusArgs, { encoding: 'utf8' });
      print((r.stdout || r.stderr || '').trim() || '(no status output)');
    } else if (!which(tool.bin)) {
      print(`Try: /run ecosystem ${name} install-hint`);
    } else {
      print('No status subcommand; binary is on PATH.');
    }
  },
};
