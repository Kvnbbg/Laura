import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ALLOWED = new Set([
  'doctor',
  'rules',
  'positions',
  'trader',
  'scan',
  'hunt',
  'paper',
  'terminal',
  'help',
]);

function resolveCopyBin() {
  const envBin = process.env.LAURA_COPY_BIN;
  if (envBin) return envBin;

  const which = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['copy'], {
    encoding: 'utf8',
  });
  if (which.status === 0) {
    const first = which.stdout.split(/\r?\n/).map((s) => s.trim()).find(Boolean);
    if (first) return first;
  }

  const local = process.env.LAURA_COPY_REPO
    ? path.join(process.env.LAURA_COPY_REPO, 'bin', 'copy.mjs')
    : '';
  if (local && existsSync(local)) return process.execPath;

  return null;
}

function buildArgs(rawArgs) {
  const args = [...rawArgs];
  if (args.length === 0) return ['doctor', '--probe'];
  const cmd = args[0];
  if (!ALLOWED.has(cmd)) {
    throw new Error(
      `Refused COPY subcommand "${cmd}". Allowed: ${[...ALLOWED].join(', ')}`,
    );
  }
  return args;
}

function runCopy(bin, args, print) {
  return new Promise((resolve) => {
    const repoScript = process.env.LAURA_COPY_REPO
      ? path.join(process.env.LAURA_COPY_REPO, 'bin', 'copy.mjs')
      : null;
    const useNodeScript = repoScript && existsSync(repoScript) && bin === process.execPath;
    const childArgs = useNodeScript ? [repoScript, ...args] : args;
    const child = spawn(bin, childArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    });
    child.stdout.on('data', (chunk) => {
      String(chunk)
        .split(/\r?\n/)
        .filter((line) => line.length)
        .forEach((line) => print(line));
    });
    child.stderr.on('data', (chunk) => {
      String(chunk)
        .split(/\r?\n/)
        .filter((line) => line.length)
        .forEach((line) => print(`[copy] ${line}`));
    });
    child.on('error', (error) => {
      print(`COPY process failed: ${error.message}`);
      resolve(1);
    });
    child.on('close', (code) => resolve(code ?? 1));
  });
}

export default {
  name: 'copy',
  description:
    'Laura-preferred bridge to the COPY CLI (Robinhood Chain paper/copytrade terminal).',
  async run({ callBridge, print, args = [] }) {
    print('Laura → COPY cross-app utility');
    print('Preferred surface: Laura. Engine: github.com/Kvnbbg/copy');

    const bin = resolveCopyBin();
    if (!bin) {
      print('COPY binary not found on PATH.');
      print('Install from https://github.com/Kvnbbg/copy then retry.');
      print('Overrides: LAURA_COPY_BIN=/path/to/copy  LAURA_COPY_REPO=/path/to/copy');
      print('Laura will not download or execute unreviewed installers.');
      try {
        const reply = await callBridge(
          'Explain in two sentences how a user should keep Laura as the primary CLI while using COPY only as a paper/hunt engine.',
          { mode: 'agent', context: { activity: 'copy bridge missing binary' } },
        );
        print(reply?.message?.content || '');
      } catch (error) {
        print(`Bridge note skipped: ${error.message}`);
      }
      return;
    }

    let copyArgs;
    try {
      copyArgs = buildArgs(args);
    } catch (error) {
      print(error.message);
      print('Example: /run copy doctor');
      print('Example: /run copy hunt --fire-only --for 30');
      print('Example: /run copy rules');
      return;
    }

    print(`Dispatch: ${path.basename(bin)} ${copyArgs.join(' ')}`);
    const code = await runCopy(bin, copyArgs, print);
    print(code === 0 ? 'COPY finished cleanly.' : `COPY exited with code ${code}.`);
  },
};
