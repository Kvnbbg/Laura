import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const REPO = process.env.LAURA_RUSTFX_REPO || '';
const BIN = process.env.LAURA_RUSTFX_BIN || 'rustfx-web3';
const INSTALL = [
  'curl --proto \'=https\' --tlsv1.2 -sSf https://sh.rustup.rs | sh',
  'source "$HOME/.cargo/env"',
  'git clone https://github.com/Kvnbbg/rustFX.git',
  'cd rustFX && cargo build -p rustfx-web3 --release',
  'export PATH="$PWD/target/release:$PATH"',
].join('\n');

function which(name) {
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [name], {
    encoding: 'utf8',
  });
  return r.status === 0;
}

function resolveBin() {
  if (process.env.LAURA_RUSTFX_BIN) return process.env.LAURA_RUSTFX_BIN;
  if (REPO) {
    const release = path.join(REPO, 'target', 'release', 'rustfx-web3');
    if (existsSync(release)) return release;
    const debug = path.join(REPO, 'target', 'debug', 'rustfx-web3');
    if (existsSync(debug)) return debug;
  }
  return BIN;
}

export default {
  name: 'rustfx',
  description: 'Pilot the rustFX Rust Web3/coin engine from Laura (Ubuntu-ready, no auto-install).',
  async run({ args = [], print, callBridge }) {
    const command = (args[0] || 'status').toLowerCase();
    print('Laura (Go) pilots rustFX (Rust). COPY stays the paper desk.');

    if (command === 'help') {
      print('Usage: /run rustfx [check|status|coins|build|help]');
      print('Env: LAURA_RUSTFX_REPO, LAURA_RUSTFX_BIN');
      return;
    }

    if (command === 'check' || command === 'install') {
      print(`rustc: ${which('rustc') ? 'present' : 'missing'}`);
      print(`cargo: ${which('cargo') ? 'present' : 'missing'}`);
      print('Laura will not run rustup for you. Review then paste:');
      print(INSTALL);
      try {
        const reply = await callBridge(
          'En une phrase: comment installer rustup puis compiler rustfx-web3 sur Ubuntu sans que Laura exécute le script elle-même.',
          { mode: 'agent', context: { activity: 'rustfx install hint' } },
        );
        if (reply?.message?.content) print(reply.message.content);
      } catch {
        /* optional */
      }
      return;
    }

    if (command === 'build') {
      if (!REPO) {
        print('Set LAURA_RUSTFX_REPO to the rustFX checkout, then retry /run rustfx build.');
        return;
      }
      if (!which('cargo')) {
        print('cargo missing. /run rustfx check');
        return;
      }
      print(`cargo build -p rustfx-web3 --release (${REPO})`);
      const result = spawnSync('cargo', ['build', '-p', 'rustfx-web3', '--release'], {
        cwd: REPO,
        encoding: 'utf8',
      });
      print((result.stdout || '') + (result.stderr || ''));
      print(result.status === 0 ? 'rustfx-web3 built.' : `cargo exited ${result.status}`);
      return;
    }

    const bin = resolveBin();
    const verb = command === 'coins' ? 'coins' : 'status';
    const result = spawnSync(bin, [verb], { encoding: 'utf8' });
    if (result.error || result.status !== 0) {
      print('rustfx-web3 is not on PATH yet.');
      if (result.error) print(result.error.message);
      print('Next: /run rustfx check   or   /run rustfx build');
      return;
    }
    print((result.stdout || '').trim());
  },
};
