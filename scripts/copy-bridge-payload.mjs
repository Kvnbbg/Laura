#!/usr/bin/env node
// Emit a public-safe Laura↔COPY payload for review or OpenClaw handoff.

const command = (process.argv[2] || 'doctor').toLowerCase();
const args = process.argv.slice(3);

const payload = {
  schemaVersion: 'laura-copy-bridge-v1',
  name: 'laura-copy-cross-app-bridge',
  preferredCli: 'laura',
  tool: 'copy',
  toolRepositoryUrl: 'https://github.com/Kvnbbg/copy',
  sourceRepositoryUrl: 'https://github.com/Kvnbbg/Laura',
  command,
  args,
  pluginCommand: args.length ? `/run copy ${command} ${args.join(' ')}` : `/run copy ${command}`,
  dispatcher: 'node bin/laura-copy.mjs',
  security: {
    executionMode: 'allowlisted subprocess',
    blocked: ['live wallet connect', 'signing keys', 'automatic install'],
  },
  verse: 'Laura first; COPY but a fellow player.',
  generatedAt: new Date().toISOString(),
};

process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
