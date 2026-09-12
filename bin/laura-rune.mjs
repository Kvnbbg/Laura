#!/usr/bin/env node
/** Standalone Laura → Rune dispatcher (no chat required). */
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pluginUrl = pathToFileURL(path.join(root, 'terminal-plugins', 'rune.mjs')).href;
const mod = await import(pluginUrl);
const plugin = mod.default;

const args = process.argv.slice(2);
await plugin.run({
  args,
  print: (line) => process.stdout.write(`${line}\n`),
  callBridge: async () => null,
});
