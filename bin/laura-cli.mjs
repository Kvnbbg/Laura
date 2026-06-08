#!/usr/bin/env node
// Terminal chat interface for Laura. Talks to the local/remote /api/chat
// bridge (server/index.js or any compatible endpoint), shows a dimmed
// "MoltBots" background feed, and loads optional plugins from
// ../terminal-plugins/. No build step: run with `npm run chat`.

import readline from 'node:readline';
import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PLUGINS_DIR = path.join(ROOT, 'terminal-plugins');

const API_URL = process.env.LAURA_API_URL || 'http://localhost:4000/api/chat';
const FEED_INTERVAL_MS = Number(process.env.LAURA_FEED_INTERVAL_MS) || 45000;
const FEED_ENABLED = process.env.LAURA_FEED_DISABLED !== 'true';
const FEED_NETWORK = process.env.LAURA_FEED_NETWORK || 'moltbook';

const dim = (text) => `\x1b[2m${text}\x1b[0m`;
const cyan = (text) => `\x1b[36m${text}\x1b[0m`;
const magenta = (text) => `\x1b[35m${text}\x1b[0m`;

const history = [
  {
    role: 'system',
    content: 'You are chatting with Laura through her terminal interface.',
  },
];

async function callBridge(content, { mode = 'chat', context = {} } = {}) {
  const messages =
    mode === 'chat' ? [...history, { role: 'user', content }] : [{ role: 'user', content }];

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      messages,
      source: 'laura-terminal',
      target: 'laura',
      mode,
      context,
    }),
  });

  if (!response.ok) {
    throw new Error(`Bridge responded with HTTP ${response.status}`);
  }

  return response.json();
}

function printNetworkThoughts(thoughts) {
  if (!Array.isArray(thoughts) || thoughts.length === 0) return;
  for (const thought of thoughts) {
    const speaker = thought?.speaker || 'MoltBot';
    const content = thought?.content || '';
    if (!content) continue;
    process.stdout.write(`\n${dim(`[${speaker}] ${content}`)}\n`);
  }
}

function startBackgroundFeed(rl) {
  if (!FEED_ENABLED) return null;

  const tick = async () => {
    try {
      const reply = await callBridge('Quoi de neuf sur le réseau MoltBook ?', {
        mode: 'social',
        context: { network: FEED_NETWORK, botName: 'MoltBot', activity: 'mini-social activity' },
      });
      printNetworkThoughts(reply?.networkThoughts);
      rl.prompt(true);
    } catch {
      // Background feed is best-effort; stay silent on failure so it
      // never disrupts the foreground chat.
    }
  };

  return setInterval(tick, FEED_INTERVAL_MS);
}

function loadPlugins() {
  let entries = [];
  try {
    entries = readdirSync(PLUGINS_DIR).filter((file) => file.endsWith('.mjs'));
  } catch {
    return [];
  }

  const plugins = [];
  for (const file of entries) {
    plugins.push({ file, url: pathToFileURL(path.join(PLUGINS_DIR, file)).href });
  }
  return plugins;
}

async function runPluginCommand(name, rl) {
  const plugins = loadPlugins();
  const target = plugins.find((plugin) => plugin.file === `${name}.mjs`);
  if (!target) {
    process.stdout.write(`${dim(`No plugin named "${name}" in terminal-plugins/.`)}\n`);
    return;
  }

  try {
    const mod = await import(target.url);
    const plugin = mod.default ?? mod;
    if (typeof plugin?.run !== 'function') {
      process.stdout.write(`${dim(`Plugin "${name}" has no run() export.`)}\n`);
      return;
    }
    await plugin.run({ callBridge, print: (line) => process.stdout.write(`${line}\n`) });
  } catch (error) {
    process.stdout.write(`${dim(`Plugin "${name}" failed: ${error.message}`)}\n`);
  }
  rl.prompt(true);
}

function printHelp() {
  process.stdout.write(
    [
      '',
      cyan('Laura terminal — commands:'),
      '  /help            show this message',
      '  /plugins         list available plugins (terminal-plugins/*.mjs)',
      '  /run <plugin>    run a plugin by file name (without .mjs)',
      '  /quit            exit',
      `  Anything else is sent to Laura via ${API_URL}`,
      '',
    ].join('\n')
  );
}

async function main() {
  process.stdout.write(`${magenta('Laura terminal — type /help for commands, /quit to exit.')}\n`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: cyan('you › '),
  });

  const feedTimer = startBackgroundFeed(rl);
  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();
    if (!input) return rl.prompt();

    if (input === '/quit' || input === '/exit') {
      rl.close();
      return;
    }
    if (input === '/help') {
      printHelp();
      return rl.prompt();
    }
    if (input === '/plugins') {
      const plugins = loadPlugins();
      if (plugins.length === 0) {
        process.stdout.write(`${dim('No plugins found in terminal-plugins/.')}\n`);
      } else {
        process.stdout.write(`${dim(`Plugins: ${plugins.map((p) => p.file.replace(/\.mjs$/, '')).join(', ')}`)}\n`);
      }
      return rl.prompt();
    }
    if (input.startsWith('/run ')) {
      await runPluginCommand(input.slice(5).trim(), rl);
      return;
    }

    history.push({ role: 'user', content: input });
    try {
      const reply = await callBridge(input);
      const content = reply?.message?.content || '(no response)';
      history.push({ role: 'assistant', content });
      process.stdout.write(`${magenta('laura ›')} ${content}\n`);
    } catch (error) {
      process.stdout.write(`${dim(`Error talking to ${API_URL}: ${error.message}`)}\n`);
      process.stdout.write(`${dim('Is the proxy running? Try: npm run dev:server')}\n`);
    }
    rl.prompt();
  });

  rl.on('close', () => {
    if (feedTimer) clearInterval(feedTimer);
    process.stdout.write(`${magenta('\nBye!')}\n`);
    process.exit(0);
  });
}

main();
