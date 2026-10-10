/**
 * Shared CLI helpers for Laura terminal plugins.
 * Zero compile deps — Node built-ins only.
 * Security: never shell-interp user strings; allowlisted bins + argv arrays only.
 *
 * Alternative (if you need richer process control later):
 *   import { spawn } from 'node:child_process' with explicit stdio piping.
 * Prefer spawnSync here for plugin simplicity and predictable timeouts.
 */
import { spawnSync } from 'node:child_process';

/** @param {string} cmd */
export function which(cmd) {
  if (!cmd || /[\s;|&`$]/.test(cmd)) return false;
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd], {
    encoding: 'utf8',
  });
  return r.status === 0;
}

/**
 * Run an allowlisted binary with argv only (no shell).
 * @param {string} bin
 * @param {string[]} args
 * @param {{ timeoutMs?: number, maxBuffer?: number, cwd?: string, env?: NodeJS.ProcessEnv }} [opts]
 */
export function runBin(bin, args = [], opts = {}) {
  if (!bin || /[\s;|&`$]/.test(bin)) {
    return { status: 127, stdout: '', stderr: 'blocked: invalid binary name', error: 'invalid_bin' };
  }
  const r = spawnSync(bin, args.map(String), {
    encoding: 'utf8',
    maxBuffer: opts.maxBuffer ?? 2 * 1024 * 1024,
    timeout: opts.timeoutMs ?? 60_000,
    cwd: opts.cwd,
    env: opts.env ? { ...process.env, ...opts.env } : process.env,
  });
  return {
    status: r.status ?? 1,
    stdout: r.stdout || '',
    stderr: r.stderr || '',
    error: r.error ? String(r.error.message || r.error) : null,
  };
}

/** Print install hint only — never auto-pipe remote installers. */
export function installHint(lines, print) {
  print('Install (review before running):');
  for (const line of lines) print(`  ${line}`);
}

/** Detect presence of many bins at once. */
export function binMap(names) {
  const out = {};
  for (const n of names) out[n] = which(n);
  return out;
}
