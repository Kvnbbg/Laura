/**
 * Laura-COPY-Web3 merge plane.
 * Mount with: import { attachWeb3Merge } from './web3-merge.mjs'
 *             attachWeb3Merge(app)
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export const MERGE_CONTRACT = 'laura-copy-web3-merge-v1';
export const ALLOWED_COPY = [
  'doctor',
  'rules',
  'positions',
  'trader',
  'scan',
  'hunt',
  'paper',
  'terminal',
  'help',
];

function readPaperSummary() {
  const runtime =
    process.env.COPY_RUNTIME_FILE ||
    (process.env.LAURA_COPY_REPO
      ? path.join(process.env.LAURA_COPY_REPO, 'data', 'runtime.json')
      : '');
  if (!runtime || !existsSync(runtime)) {
    return {
      available: false,
      openPositions: 0,
      closedPositions: 0,
      note: 'COPY runtime.json not mounted; paper desk is advisory only.',
    };
  }
  try {
    const raw = JSON.parse(readFileSync(runtime, 'utf8'));
    const open = Array.isArray(raw.open) ? raw.open.length : Array.isArray(raw.positions) ? raw.positions.length : 0;
    const closed = Array.isArray(raw.closed) ? raw.closed.length : 0;
    return {
      available: true,
      openPositions: open,
      closedPositions: closed,
      note: 'Summarized from COPY local runtime. No keys copied.',
    };
  } catch {
    return {
      available: false,
      openPositions: 0,
      closedPositions: 0,
      note: 'runtime.json unreadable; Laura will not guess balances.',
    };
  }
}

async function readChainHealth() {
  const rpc = process.env.LAURA_CHAIN_RPC || process.env.RH_RPC_URL || '';
  if (!rpc) {
    return { status: 'unconfigured', chainId: 'unknown', source: 'none' };
  }
  try {
    const response = await fetch(rpc, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
    });
    if (!response.ok) {
      return { status: 'degraded', chainId: 'unknown', source: 'rpc' };
    }
    const json = await response.json();
    return {
      status: 'ok',
      chainId: typeof json?.result === 'string' ? json.result : 'unknown',
      source: 'rpc',
    };
  } catch {
    return { status: 'unreachable', chainId: 'unknown', source: 'rpc' };
  }
}

export function buildMergeSnapshot(overrides = {}) {
  const paper = overrides.paper || readPaperSummary();
  const webhook = String(process.env.NATIVE_EXECUTOR_WEBHOOK || '').trim();
  return {
    schemaVersion: MERGE_CONTRACT,
    preferredCli: 'laura',
    fellowEngine: {
      name: 'copy',
      repository: 'https://github.com/Kvnbbg/copy',
      allowlisted: ALLOWED_COPY,
    },
    web3: {
      posture: 'read-and-queue',
      custody: 'none',
      walletConnect: false,
      queue: webhook ? 'configured-external' : 'idle-queue-only',
      chain: overrides.chain || { status: 'unconfigured', chainId: 'unknown', source: 'none' },
    },
    paper,
    surfaces: {
      chatPlugin: '/run copy',
      dispatcher: 'node bin/laura-copy.mjs',
      webDesk: '/web3',
      api: '/api/web3/merge',
    },
    blocked: [
      'browser wallet connect',
      'signing keys in Laura',
      'automatic COPY install',
      'VITE_* secrets',
      'silent live broadcast',
    ],
    generatedAt: new Date().toISOString(),
  };
}

export function attachWeb3Merge(app) {
  if (!app || typeof app.get !== 'function') {
    throw new Error('attachWeb3Merge requires an Express-like app');
  }
  app.get('/api/web3/merge', async (_req, res) => {
    const chain = await readChainHealth();
    res.json(buildMergeSnapshot({ chain }));
  });
}
