/**
 * Autonomous agent pilots — status + install hints only.
 * Laura remains the orchestrator; agents stay on their own binaries.
 */
import { spawnSync } from 'node:child_process';

const AGENTS = {
  hermes: {
    title: 'Hermes Agent (Nous Research)',
    repo: 'https://github.com/NousResearch/hermes-agent',
    bins: ['hermes'],
    why: 'Agent autonome multi-outils (terminal, browser, memory, skills); partage souvent le store agent-memory.',
    install:
      '# Review first — remote installer\n# curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash\n# then: hermes doctor && hermes status',
    status: ['status'],
  },
  openclaw: {
    title: 'OpenClaw',
    repo: 'https://github.com/openclaw/openclaw',
    bins: ['openclaw'],
    why: 'Gateway multi-canal + agents isolés (workspaces, MEMORY.md, routing). Self-hosted.',
    install:
      'npx openclaw@latest\n# or: git clone https://github.com/openclaw/openclaw.git && cd openclaw && pnpm install && pnpm build\n# openclaw doctor',
    status: ['doctor'],
  },
  pico: {
    title: 'Pico (tiny / harness variants)',
    repo: 'https://github.com/barghouthi/pico-swe-agent',
    bins: ['pico'],
    why: 'Agents minimaux ou harness compact (pico-swe-agent, PicoCode, pico harness). Idéal pour expérimenter en sandbox.',
    install:
      '# pico-swe-agent (6 LoC demo — sandbox only)\n# git clone https://github.com/barghouthi/pico-swe-agent.git\n# uv run python pico.py "your task"\n# PicoCode: https://github.com/shijizhi/picocode',
  },
  pi: {
    title: 'Pi coding agent',
    repo: 'https://github.com/earendil-works/pi',
    bins: ['pi'],
    why: 'Harness coding agent (TUI, multi-provider LLM API, tool loop).',
    install: 'See https://pi.dev and https://github.com/earendil-works/pi — install the published coding-agent package for your platform.',
  },
  ao: {
    title: 'Agent Orchestrator',
    repo: 'https://github.com/Untrivial-ai/agent-orchestrator',
    bins: ['ao'],
    why: 'Kanban multi-workers, worktrees, supervision PR/CI — desktop orchestrator.',
    install: 'Download release from https://github.com/Untrivial-ai/agent-orchestrator/releases',
  },
  aider: {
    title: 'Aider',
    repo: 'https://github.com/Aider-AI/aider',
    bins: ['aider'],
    why: 'Coding agent git-native, mature, local or cloud models.',
    install: 'pip install aider-chat',
    status: ['--version'],
  },
  opencode: {
    title: 'OpenCode',
    repo: 'https://github.com/sst/opencode',
    bins: ['opencode'],
    why: 'Open-source coding agent TUI.',
    install: 'See upstream releases for opencode binary / npm package.',
  },
  claude: {
    title: 'Claude Code',
    repo: 'https://github.com/anthropics/claude-code',
    bins: ['claude'],
    why: 'Host agent; pairs with agent-memory hooks and cost-xray capture.',
    install: 'Install from Anthropic Claude Code docs for your OS.',
    status: ['--version'],
  },
  codex: {
    title: 'Codex CLI',
    repo: 'https://github.com/openai/codex',
    bins: ['codex'],
    why: 'Host agent; shares agent-memory store with Claude/Hermes when configured.',
    install: 'Install from OpenAI Codex CLI docs.',
    status: ['--version'],
  },
};

function which(cmd) {
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd], { encoding: 'utf8' });
  return r.status === 0;
}

export default {
  name: 'agents',
  description: 'Catalogue d’agents autonomes: hermes, openclaw, pico, pi, ao, aider, opencode, claude, codex.',
  async run({ args = [], print }) {
    const name = (args[0] || 'list').toLowerCase();
    if (name === 'list' || name === 'help' || name === 'map') {
      print('=== Agents autonomes (Laura pilote, n’installe pas toute seule) ===');
      for (const [id, a] of Object.entries(AGENTS)) {
        const present = a.bins.some(which);
        print(`• ${id} ${present ? '[bin OK]' : '[missing]'} — ${a.title}`);
        print(`  ${a.why}`);
      }
      print('Usage: /run agents <id> [status|install-hint|why]');
      print('Mémoire partagée: /run memory — embeddings optimisés (cache + batch + RRF)');
      return;
    }
    const agent = AGENTS[name];
    if (!agent) {
      print(`Inconnu: ${name}. /run agents list`);
      return;
    }
    const action = (args[1] || 'status').toLowerCase();
    print(`${agent.title}`);
    print(`repo: ${agent.repo}`);
    print(`bins: ${agent.bins.map((b) => `${b}=${which(b) ? 'yes' : 'no'}`).join(', ')}`);
    if (action === 'why') {
      print(agent.why);
      return;
    }
    if (action === 'install' || action === 'install-hint') {
      print('Install (à relire avant exécution):');
      print(agent.install);
      return;
    }
    const bin = agent.bins.find(which);
    if (bin && agent.status) {
      const r = spawnSync(bin, agent.status, { encoding: 'utf8', maxBuffer: 1024 * 1024 });
      print((r.stdout || r.stderr || '').trim().slice(0, 4000) || '(no output)');
    } else if (!bin) {
      print(`Binary missing. /run agents ${name} install-hint`);
    } else {
      print('Present on PATH; no default status args.');
    }
  },
};
