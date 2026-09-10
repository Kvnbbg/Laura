#!/usr/bin/env node
// Laura-first COPY dispatcher. Speak: node bin/laura-copy.mjs hunt --fire-only

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

function resolveBin() {
  if (process.env.LAURA_COPY_BIN) return { cmd: process.env.LAURA_COPY_BIN, prefix: [] };
  const which = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['copy'], {
    encoding: 'utf8',
  });
  if (which.status === 0) {
    const found = which.stdout.split(/\r?\n/).map((s) => s.trim()).find(Boolean);
    if (found) return { cmd: found, prefix: [] };
  }
  const repo = process.env.LAURA_COPY_REPO;
  if (repo) {
    const script = path.join(repo, 'bin', 'copy.mjs');
    if (existsSync(script)) return { cmd: process.execPath, prefix: [script] };
  }
  return null;
}

function usage() {
  process.stdout.write(
    [
      'Laura doth command; COPY doth serve.',
      'Usage: node bin/laura-copy.mjs <command> [args...]',
      `Allowed: ${[...ALLOWED].join(', ')}`,
      'Env: LAURA_COPY_BIN, LAURA_COPY_REPO',
      '',
    ].join('\n'),
  );
}

const [command, ...rest] = process.argv.slice(2);
const verb = (command || 'doctor').toLowerCase();

if (!ALLOWED.has(verb)) {
  usage();
  process.stderr.write(`Refused: ${verb}\n`);
  process.exit(2);
}

const resolved = resolveBin();
if (!resolved) {
  process.stderr.write('COPY is not upon the PATH. Clone https://github.com/Kvnbbg/copy and set LAURA_COPY_REPO.\n');
  process.exit(1);
}

const child = spawn(resolved.cmd, [...resolved.prefix, verb, ...rest], {
  stdio: 'inherit',
  env: process.env,
});
child.on('exit', (code) => process.exit(code ?? 1));
