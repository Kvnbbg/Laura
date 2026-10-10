#!/usr/bin/env node
/**
 * Zero-dep health: import catalog modules and report load errors.
 * Does not start the HTTP server or call remote APIs.
 */
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pluginDir = path.join(root, 'terminal-plugins');
const serverMods = ['memory-rag.mjs', 'orchestra-plan.mjs', 'ollama-models.mjs'];

let failed = 0;

async function tryImport(label, fileUrl) {
  try {
    const mod = await import(fileUrl);
    const ok = mod && (mod.default || mod.buildOrchestraPlan || mod.buildRagContext || mod.getOllamaConfig);
    process.stdout.write(`${ok ? 'OK' : 'WARN'}  ${label}\n`);
    if (!ok) failed += 1;
  } catch (e) {
    process.stdout.write(`FAIL ${label}: ${e.message}\n`);
    failed += 1;
  }
}

const plugins = readdirSync(pluginDir).filter((f) => f.endsWith('.mjs'));
for (const f of plugins) {
  await tryImport(`plugin:${f}`, pathToFileURL(path.join(pluginDir, f)).href);
}

for (const f of serverMods) {
  await tryImport(`server:${f}`, pathToFileURL(path.join(root, 'server', f)).href);
}

await tryImport('lib:safe-cli', pathToFileURL(path.join(pluginDir, 'lib', 'safe-cli.mjs')).href);

process.stdout.write(failed ? `\n${failed} issue(s)\n` : '\nall clear\n');
process.exit(failed ? 1 : 0);
