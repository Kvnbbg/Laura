#!/usr/bin/env node
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

let sessionModel = process.env.LAURA_SESSION_MODEL || process.env.LAURA_LOCAL_MODEL || process.env.OLLAMA_MODEL || '';

const dim = (text) => `\x1b[2m${text}\x1b[0m`;
const cyan = (text) => `\x1b[36m${text}\x1b[0m`;
const magenta = (text) => `\x1b[35m${text}\x1b[0m`;

const history = [
  {
    role: 'system',
    content:
      'You are Laura, terminal-first. Grimoire tools: rune, copy, rustfx, mindwalk. Prefer Mistral or Ollama qwen2.5:3b/phi3 over qwen:1.5b for multi-step work. Propose install commands only.',
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
  const messages = mode === 'chat' ? [...history, { role: 'user', content }] : [{ role: 'user', content }];
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      messages,
      source: 'laura-terminal',
      target: 'laura',
      mode,
      context,
      ...(sessionModel ? { model: sessionModel } : {}),
    }),
  });
  if (!response.ok) throw new Error(`Bridge HTTP ${response.status}`);
  const json = await response.json();
  if (key) setCached(key, json);
  return json;
}

async function streamChat(content, onToken) {
  const messages = [...history, { role: 'user', content }];
  const response = await fetch(STREAM_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages, ...(sessionModel ? { model: sessionModel } : {}) }),
  });
  if (!response.ok || !response.body) throw new Error(`Stream HTTP ${response.status}`);
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
        /* ignore */
      }
    }
  }
  return full;
}

function loadPlugins() {
  try {
    return readdirSync(PLUGINS_DIR)
      .filter((f) => f.endsWith('.mjs'))
      .map((file) => ({ file, url: pathToFileURL(path.join(PLUGINS_DIR, file)).href }));
  } catch {
    return [];
  }
}

async function runPluginCommand(command, rl) {
  const [name, ...args] = command.split(/\s+/).filter(Boolean);
  if (!name) {
    process.stdout.write(`${dim('Usage: /run <plugin> [args...]')}\n`);
    return;
  }
  const target = loadPlugins().find((p) => p.file === `${name}.mjs`);
  if (!target) {
    process.stdout.write(`${dim(`No plugin "${name}"`)}\n`);
    return;
  }
  try {
    const mod = await import(target.url);
    const plugin = mod.default ?? mod;
    await plugin.run({
      callBridge,
      print: (line) => process.stdout.write(`${line}\n`),
      args,
      command,
    });
  } catch (error) {
    process.stdout.write(`${dim(`Plugin failed: ${error.message}`)}\n`);
  }
  rl.prompt(true);
}

function printHelp() {
  process.stdout.write(
    [
      '',
      cyan('Laura terminal'),
      '  /help   /grimoire   /model [name|alias|clear|list]',
      '  /plugins   /run <plugin>   /install <name>   /quit',
      '',
    ].join('\n'),
  );
}

async function main() {
  process.stdout.write(`${magenta('Laura terminal — /help /grimoire /model')}\n`);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: cyan('you › '),
  });
  rl.prompt();
  rl.on('line', async (line) => {
    const input = line.trim();
    if (!input) return rl.prompt();
    if (input === '/quit' || input === '/exit') return rl.close();
    if (input === '/help') {
      printHelp();
      return rl.prompt();
    }
    if (input === '/model' || input.startsWith('/model ')) {
      const arg = input === '/model' ? '' : input.slice(7).trim();
      if (!arg || arg === 'list' || arg === 'ls') {
        try {
          const modelsUrl = process.env.LAURA_MODELS_URL || API_URL.replace(/\/chat$/, '/models');
          const res = await fetch(modelsUrl);
          const json = await res.json();
          process.stdout.write(`${dim(JSON.stringify(json, null, 2))}\n`);
        } catch (e) {
          process.stdout.write(`${dim(`models: ${e.message}`)}\n`);
        }
        process.stdout.write(`${dim(`session model: ${sessionModel || '(server default)'}`)}\n`);
        return rl.prompt();
      }
      if (arg === 'clear' || arg === 'default') {
        sessionModel = '';
        process.stdout.write(`${dim('session model cleared')}\n`);
        return rl.prompt();
      }
      sessionModel = arg;
      process.stdout.write(`${dim(`session model → ${sessionModel}`)}\n`);
      return rl.prompt();
    }
    if (input === '/grimoire' || input.startsWith('/grimoire ')) {
      const rest = input === '/grimoire' ? '' : input.slice(10).trim();
      await runPluginCommand(rest ? `grimoire ${rest}` : 'grimoire', rl);
      return;
    }
    if (input === '/plugins') {
      process.stdout.write(`${dim(loadPlugins().map((p) => p.file.replace(/\.mjs$/, '')).join(', ') || 'none')}\n`);
      return rl.prompt();
    }
    if (input.startsWith('/run ')) {
      await runPluginCommand(input.slice(5).trim(), rl);
      return;
    }
    if (input === '/install' || input.startsWith('/install ')) {
      process.stdout.write(`${dim('Use /grimoire improve or ask Laura for install lines (review before run).')}\n`);
      return rl.prompt();
    }

    history.push({ role: 'user', content: input });
    if (STREAM_ENABLED) {
      let wrote = false;
      try {
        const full = await streamChat(input, (token) => {
          if (!wrote) {
            process.stdout.write(`${magenta('laura ›')} `);
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
      process.stdout.write(`${magenta('laura ›')} ${content}\n`);
    } catch (error) {
      process.stdout.write(`${dim(`Error: ${error.message}`)}\n`);
    }
    rl.prompt();
  });
  rl.on('close', () => {
    process.stdout.write(`${magenta('\nBye!')}\n`);
    process.exit(0);
  });
}

main();
