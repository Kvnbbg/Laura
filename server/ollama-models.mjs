/**
 * Laura multi-model Ollama helpers.
 * Env:
 *   OLLAMA_URL                 default http://localhost:11434
 *   OLLAMA_MODEL | LAURA_LOCAL_MODEL   default model id
 *   OLLAMA_MODELS              comma allowlist (empty = any safe name)
 *   LAURA_MODEL_ALIASES        fast:qwen2.5:3b,smart:qwen2.5:7b,tiny:qwen:1.5b
 */

const SAFE_MODEL = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;

export function getOllamaConfig(env = process.env) {
  const url = (env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
  const defaultModel = (env.OLLAMA_MODEL || env.LAURA_LOCAL_MODEL || '').trim();
  const allowlist = (env.OLLAMA_MODELS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const aliases = {};
  for (const pair of (env.LAURA_MODEL_ALIASES || '').split(',')) {
    const idx = pair.indexOf(':');
    if (idx <= 0) continue;
    const alias = pair.slice(0, idx).trim().toLowerCase();
    const target = pair.slice(idx + 1).trim();
    if (alias && target) aliases[alias] = target;
  }
  if (!Object.keys(aliases).length) {
    Object.assign(aliases, {
      fast: 'qwen2.5:3b',
      smart: 'qwen2.5:7b',
      tiny: 'qwen:1.5b',
      mini: 'phi3:mini',
      code: 'qwen2.5-coder:3b',
    });
  }
  return { url, defaultModel, allowlist, aliases };
}

export function resolveOllamaModel(requested, config = getOllamaConfig()) {
  let name = String(requested || '').trim();
  if (!name) name = config.defaultModel;
  if (!name) {
    return { ok: false, reason: 'no_default_model' };
  }
  const lower = name.toLowerCase();
  if (config.aliases[lower]) {
    name = config.aliases[lower];
  }
  if (!SAFE_MODEL.test(name)) {
    return { ok: false, reason: 'unsafe_model_name', model: name };
  }
  if (config.allowlist.length && !config.allowlist.includes(name)) {
    const allowed = config.allowlist.some(
      (a) => a === name || name.startsWith(`${a}`) || a.startsWith(name.split(':')[0]),
    );
    if (!allowed) {
      return { ok: false, reason: 'not_in_allowlist', model: name, allowlist: config.allowlist };
    }
  }
  return { ok: true, model: name };
}

export async function listOllamaTags(config = getOllamaConfig()) {
  const res = await fetch(`${config.url}/api/tags`, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) {
    throw new Error(`Ollama tags HTTP ${res.status}`);
  }
  const json = await res.json();
  return (json.models || []).map((m) => ({
    name: m.name,
    size: m.size,
    modifiedAt: m.modified_at,
  }));
}

export async function chatOllama({
  config = getOllamaConfig(),
  model,
  messages,
  stream = false,
}) {
  const res = await fetch(`${config.url}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model, messages, stream }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) {
    const details = await res.text().catch(() => '');
    throw new Error(`Ollama chat HTTP ${res.status}: ${details.slice(0, 200)}`);
  }
  if (stream) {
    return res;
  }
  const json = await res.json();
  const content = json?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('Ollama response missing message.content');
  }
  return content;
}
