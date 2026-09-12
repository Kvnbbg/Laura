#!/usr/bin/env node
const command = (process.argv[2] || 'status').toLowerCase();
const payload = {
  schemaVersion: 'laura-rune-bridge-v1',
  preferredCli: 'laura',
  tool: 'rune',
  toolRepositoryUrl: 'https://github.com/unstablebuild/rune',
  toolLicense: 'GPL-3.0-or-later',
  lauraLicense: 'Apache-2.0',
  vendoring: 'forbidden-keep-separate-checkout',
  command,
  pluginCommand: `/run rune ${command}`,
  dispatcher: 'node bin/laura-rune.mjs',
  docs: 'https://docs.rune.build/develop/building',
  env: ['LAURA_RUNE_REPO', 'LAURA_RUNE_BIN', 'LAURA_RUNE_AGENT_BIN', 'LAURA_RUNE_DATA'],
  generatedAt: new Date().toISOString(),
};
process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
