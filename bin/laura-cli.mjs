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
const STREAM_URL = process.env.LAURA_STREAM_URL || API_URL.replace(/\/chat$/, '/chat/stream');
const STREAM_ENABLED = process.env.LAURA_STREAM_DISABLED !== 'true';
const FEED_INTERVAL_MS = Number(process.env.LAURA_FEED_INTERVAL_MS) || 45000;
const FEED_ENABLED = process.env.LAURA_FEED_DISABLED !== 'true';
const FEED_NETWORK = process.env.LAURA_FEED_NETWORK || 'moltbook';
const CACHE_TTL_MS = Number(process.env.LAURA_CACHE_TTL_MS) || 60000;

const dim = (text) => `\x1b[2m${text}\x1b[0m`;
const cyan = (text) => `\x1b[36m${text}\x1b[0m`;
const magenta = (text) => `\x1b[35m${text}\x1b[0m`;

const history = [
  {
    role: 'system',
    content:
      'You are Laura, terminal-first companion. Your Grimoire lists tools: rune (IDE), copy (paper desk), rustfx (Rust web3), mindwalk, grimoire. ' +
      'When the user says to launch Rune, point them to /grimoire lancer rune or /run rune run and explain why (GPU keyboard IDE, stay out of the browser). ' +
      'You prefer Mistral or a capable local Ollama model (qwen2.5:3b, phi3:mini, llama3.2:3b). qwen:1.5b is allowed if LAURA_LOCAL_MODEL is set but is too small for multi-step agent work—say so honestly. ' +
      'Propose install commands (apt, ollama pull, git clone, make) but never claim you executed them; the operator copies and runs. Stay focused in the terminal.',
  },
];

const responseCache = new Map();

const cacheKey = (content, mode, context) => `${mode}::${content}::${JSON.stringify(context)}`;

function getCached(key) {
  const entry = responseCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    responseCache.delete(key);
    return undefined;
  }
  return entry.value;
}

function setCached(key, value) {
  responseCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function callBridge(content, { mode = 'chat', context = {} } = {}) {
  const key = mode !== 'chat' ? cacheKey(content, mode, context) : null;
  if (key) {
    const cached = getCached(key);
    if (cached) return cached;
  }

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

  const json = await response.json();
  if (key) setCached(key, json);
  return json;
}

async function streamChat(content, onToken) {
  const messages = [...history, { role: 'user', content }];

  const response = await fetch(STREAM_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Stream endpoint responded with HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed?.choices?.[0]?.delta?.content;
        if (typeof delta === 'string' && delta) {
          full += delta;
          onToken(delta);
        }
      } catch {
        // ignore partial SSE
      }
    }
  }

  return full;
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
      const reply = await callBridge('Quoi de neuf sur le r\u00e9seau MoltBook ?', {
        mode: 'social',
        context: { network: FEED_NETWORK, botName: 'MoltBot', activity: 'mini-social activity' },
      });
      printNetworkThoughts(reply?.networkThoughts);
      rl.prompt(true);
    } catch {
      // best-effort
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

async function runPluginCommand(command, rl) {
  const [name, ...args] = command.split(/\s+/).filter(Boolean);
  if (!name) {
    process.stdout.write(`${dim('Usage: /run <plugin> [args...]')}\n`);
    return;
  }
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
    await plugin.run({
      callBridge,
      print: (line) => process.stdout.write(`${line}\n`),
      args,
      command,
    });
  } catch (error) {
    process.stdout.write(`${dim(`Plugin "${name}" failed: ${error.message}`)}\n`);
  }
  rl.prompt(true);
}

async function suggestInstall(name, print) {
  if (!name) {
    print(dim('Usage: /install <package-or-tool-name>'));
    return;
  }

  print(dim(`Looking up "${name}" (npm registry + GitHub, read-only)\u2026`));
  const findings = [];

  try {
    const npmRes = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
      headers: { accept: 'application/json' },
    });
    if (npmRes.ok) {
      const pkg = await npmRes.json();
      const latest = pkg?.['dist-tags']?.latest;
      const description = pkg?.description;
      if (latest)
        findings.push(
          `npm package "${pkg?.name || name}"@${latest}${description ? ` \u2014 ${description}` : ''}`,
        );
    }
  } catch {
    // best-effort
  }

  try {
    const ghRes = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(name)}&per_page=1`,
      { headers: { accept: 'application/vnd.github+json', 'user-agent': 'laura-terminal/1.0' } },
    );
    if (ghRes.ok) {
      const data = await ghRes.json();
      const repo = data?.items?.[0];
      if (repo?.full_name) {
        findings.push(
          `GitHub repo "${repo.full_name}"${repo.description ? ` \u2014 ${repo.description}` : ''} (${repo.html_url})`,
        );
      }
    }
  } catch {
    // best-effort
  }

  const findingsText = findings.length
    ? findings.join('\n')
    : 'No npm package or GitHub repo found by that exact name.';

  try {
    const reply = await callBridge(
      `Un d\u00e9veloppeur cherche \u00e0 installer ou utiliser "${name}" mais ne conna\u00eet pas la bonne commande. ` +
        `Voici ce qu'une recherche en lecture seule a trouv\u00e9:\n${findingsText}\n\n` +
        `Propose la commande d'installation EXACTE la plus probable (npm install, go install, pip install, brew install, apt, ollama pull, etc.), ` +
        `en une ligne de code, et une phrase d'explication. Ne dis jamais d'ex\u00e9cuter quoi que ce soit automatiquement.`,
      { mode: 'agent', context: { activity: 'install suggestion', tags: ['code', 'tooling'] } },
    );
    print('');
    print(magenta('laura \u203a') + ' ' + (reply?.message?.content || findingsText));
  } catch {
    print(findingsText);
  }
  print(
    dim(
      '\n\u2192 Review the command above before running it yourself. Laura never installs anything automatically.',
    ),
  );
}

function printHelp() {
  process.stdout.write(
    [
      '',
      cyan('Laura terminal \u2014 commands:'),
      '  /help            show this message',
      '  /grimoire        open Laura\'s tool spellbook (Rune, LLM policy, improve)',
      '  /grimoire rune   propose + launch Rune from the Grimoire',
      '  /grimoire llm    why Mistral / Ollama / not qwen:1.5b by default',
      '  /grimoire improve  suggest install commands (never auto-run)',
      '  /plugins         list available plugins (terminal-plugins/*.mjs)',
      '  /run <plugin>    run a plugin by file name (without .mjs)',
      '  /install <name>  look up a package/tool; Laura suggests the install command',
      '  /quit            exit',
      `  Anything else is sent to Laura via ${API_URL}`,
      '',
    ].join('\n'),
  );
}

async function main() {
  process.stdout.write(
    `${magenta('Laura terminal \u2014 type /help or /grimoire, /quit to exit.')}\n`,
  );

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: cyan('you \u203a '),
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
    if (input === '/grimoire' || input.startsWith('/grimoire ')) {
      const rest = input === '/grimoire' ? '' : input.slice('/grimoire '.length).trim();
      await runPluginCommand(rest ? `grimoire ${rest}` : 'grimoire', rl);
      return;
    }
    if (input === '/plugins') {
      const plugins = loadPlugins();
      if (plugins.length === 0) {
        process.stdout.write(`${dim('No plugins found in terminal-plugins/.')}\n`);
      } else {
        process.stdout.write(
          `${dim(`Plugins: ${plugins.map((p) => p.file.replace(/\.mjs$/, '')).join(', ')}`)}\n`,
        );
      }
      return rl.prompt();
    }
    if (input.startsWith('/run ')) {
      await runPluginCommand(input.slice(5).trim(), rl);
      return;
    }
    if (input === '/install' || input.startsWith('/install ')) {
      await suggestInstall(input.slice(8).trim(), (line) => process.stdout.write(`${line}\n`));
      return rl.prompt();
    }

    history.push({ role: 'user', content: input });

    if (STREAM_ENABLED) {
      let wrote = false;
      try {
        const full = await streamChat(input, (token) => {
          if (!wrote) {
            process.stdout.write(`${magenta('laura \u203a')} `);
            wrote = true;
          }
          process.stdout.write(token);
        });
        if (wrote) process.stdout.write('\n');
        history.push({ role: 'assistant', content: full || '(no response)' });
        return rl.prompt();
      } catch {
        if (wrote) process.stdout.write('\n');
      }
    }

    try {
      const reply = await callBridge(input);
      const content = reply?.message?.content || '(no response)';
      history.push({ role: 'assistant', content });
      process.stdout.write(`${magenta('laura \u203a')} ${content}\n`);
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
