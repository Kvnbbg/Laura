import { existsSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const REPO = process.env.LAURA_RUNE_REPO || '';
const DATA = process.env.LAURA_RUNE_DATA || path.join(os.homedir(), '.laura-rune-dev');

const UBUNTU_DEPS = `sudo apt-get update
sudo apt-get install -y --no-install-recommends \\
  git golang-go gcc g++ pkg-config \\
  libgl1-mesa-dev libx11-dev libxrandr-dev libxcursor-dev \\
  libxinerama-dev libxi-dev libxxf86vm-dev \\
  libasound2-dev libwayland-dev libxkbcommon-dev`;

const CLONE_HINT = `git clone https://github.com/unstablebuild/rune.git
cd rune
make rune
# optional: make rune-agent
export LAURA_RUNE_REPO="$PWD"
export PATH="$PWD/bin:$PATH"`;

const ALLOWED = new Set([
  'help',
  'check',
  'deps',
  'clone-hint',
  'build',
  'version',
  'run',
  'agent',
  'status',
]);

function which(cmd) {
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd], {
    encoding: 'utf8',
  });
  return r.status === 0;
}

function resolveRuneBin() {
  if (process.env.LAURA_RUNE_BIN) return process.env.LAURA_RUNE_BIN;
  if (REPO) {
    const candidates = [
      path.join(REPO, 'bin', 'rune'),
      path.join(REPO, 'cmd', 'rune', 'rune'),
    ];
    for (const c of candidates) {
      if (existsSync(c)) return c;
    }
  }
  return 'rune';
}

function resolveAgentBin() {
  if (process.env.LAURA_RUNE_AGENT_BIN) return process.env.LAURA_RUNE_AGENT_BIN;
  if (REPO) {
    const c = path.join(REPO, 'bin', 'rune-agent');
    if (existsSync(c)) return c;
  }
  return 'rune-agent';
}

function printUsage(print) {
  print('Laura → Rune pilot kit (GPL IDE stays outside Laura)');
  print('Usage: /run rune [help|check|deps|clone-hint|build|version|run|agent]');
  print('Env: LAURA_RUNE_REPO, LAURA_RUNE_BIN, LAURA_RUNE_AGENT_BIN, LAURA_RUNE_DATA');
}

export default {
  name: 'rune',
  description:
    'Pilot unstablebuild/rune IDE from Laura: check deps, build from checkout, launch with isolated data dir.',
  async run({ args = [], print, callBridge }) {
    const command = (args[0] || 'status').toLowerCase();

    if (!ALLOWED.has(command)) {
      print(`Refused: ${command}`);
      printUsage(print);
      return;
    }

    if (command === 'help') {
      printUsage(print);
      return;
    }

    if (command === 'deps') {
      print('Ubuntu/Debian packages for Rune cgo renderer (operator runs):');
      print(UBUNTU_DEPS);
      print('Docs: https://docs.rune.build/develop/building');
      return;
    }

    if (command === 'clone-hint') {
      print('Clone and build Rune outside Laura (GPL-3.0 stays separate):');
      print(CLONE_HINT);
      return;
    }

    if (command === 'check' || command === 'status') {
      print(`go: ${which('go') ? 'present' : 'missing'}`);
      print(`gcc: ${which('gcc') ? 'present' : 'missing'}`);
      print(`make: ${which('make') ? 'present' : 'missing'}`);
      print(`LAURA_RUNE_REPO: ${REPO || '(unset)'}`);
      if (REPO) print(`repo exists: ${existsSync(REPO)}`);
      const bin = resolveRuneBin();
      const probe = spawnSync(bin, ['--version'], { encoding: 'utf8' });
      if (probe.status === 0) {
        print(`rune: ${(probe.stdout || probe.stderr || '').trim() || bin}`);
      } else {
        print('rune binary: not on PATH / not built yet');
        print('Next: /run rune deps  then  /run rune clone-hint  then  /run rune build');
      }
      try {
        const reply = await callBridge(
          'In one sentence: why Laura must keep Rune as a separate GPL checkout instead of vendoring its source.',
          { mode: 'agent', context: { activity: 'rune license boundary' } },
        );
        if (reply?.message?.content) print(reply.message.content);
      } catch {
        /* optional */
      }
      return;
    }

    if (command === 'build') {
      if (!REPO || !existsSync(REPO)) {
        print('Set LAURA_RUNE_REPO to an existing unstablebuild/rune checkout.');
        print(CLONE_HINT);
        return;
      }
      if (!which('make') && !which('go')) {
        print('Need make or go. /run rune deps');
        return;
      }
      print(`Building rune in ${REPO}`);
      const result = which('make')
        ? spawnSync('make', ['rune'], { cwd: REPO, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 })
        : spawnSync('go', ['build', '-o', 'bin/rune', './cmd/rune'], {
            cwd: REPO,
            encoding: 'utf8',
            maxBuffer: 4 * 1024 * 1024,
          });
      print((result.stdout || '') + (result.stderr || ''));
      print(result.status === 0 ? 'rune build finished.' : `build exited ${result.status}`);
      return;
    }

    if (command === 'version') {
      const bin = resolveRuneBin();
      const result = spawnSync(bin, ['--version'], { encoding: 'utf8' });
      if (result.error || result.status !== 0) {
        print('rune not available. /run rune check');
        return;
      }
      print((result.stdout || result.stderr || '').trim());
      return;
    }

    if (command === 'run') {
      const bin = resolveRuneBin();
      const cwd = REPO && existsSync(REPO) ? REPO : process.cwd();
      const childArgs = ['-d', DATA];
      print(`Launching ${bin} -d ${DATA} (cwd=${cwd})`);
      const child = spawn(bin, childArgs, {
        cwd,
        detached: true,
        stdio: 'ignore',
        env: { ...process.env, CGO_ENABLED: process.env.CGO_ENABLED || '1' },
      });
      child.unref();
      print(`rune pid ${child.pid}. Isolated data dir: ${DATA}`);
      return;
    }

    if (command === 'agent') {
      const bin = resolveAgentBin();
      const result = spawnSync(bin, ['--help'], { encoding: 'utf8' });
      if (result.error || result.status !== 0) {
        print('rune-agent not found. Build with make rune-agent in LAURA_RUNE_REPO.');
        return;
      }
      print((result.stdout || '').trim().split('\n').slice(0, 20).join('\n'));
      return;
    }
  },
};
