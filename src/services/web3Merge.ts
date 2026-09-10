export interface Web3MergeSnapshot {
  schemaVersion: string;
  preferredCli: string;
  fellowEngine: {
    name: string;
    repository: string;
    allowlisted: string[];
  };
  web3: {
    posture: string;
    custody: string;
    walletConnect: boolean;
    queue: string;
    chain: {
      status: string;
      chainId: string;
      source: string;
    };
  };
  paper: {
    available: boolean;
    openPositions: number;
    closedPositions: number;
    note: string;
  };
  surfaces: {
    chatPlugin: string;
    dispatcher: string;
    webDesk: string;
    api: string;
  };
  blocked: string[];
  generatedAt: string;
}

export const FALLBACK_MERGE: Web3MergeSnapshot = {
  schemaVersion: 'laura-copy-web3-merge-v1',
  preferredCli: 'laura',
  fellowEngine: {
    name: 'copy',
    repository: 'https://github.com/Kvnbbg/copy',
    allowlisted: ['doctor', 'rules', 'positions', 'trader', 'scan', 'hunt', 'paper', 'terminal', 'help'],
  },
  web3: {
    posture: 'read-and-queue',
    custody: 'none',
    walletConnect: false,
    queue: 'idle-queue-only',
    chain: { status: 'unconfigured', chainId: 'unknown', source: 'none' },
  },
  paper: {
    available: false,
    openPositions: 0,
    closedPositions: 0,
    note: 'Desk is showing the static contract until /api/web3/merge answers.',
  },
  surfaces: {
    chatPlugin: '/run copy',
    dispatcher: 'node bin/laura-copy.mjs',
    webDesk: '/web3',
    api: '/api/web3/merge',
  },
  blocked: ['browser wallet connect', 'signing keys in Laura', 'automatic COPY install'],
  generatedAt: new Date(0).toISOString(),
};

export async function fetchWeb3Merge(signal?: AbortSignal): Promise<Web3MergeSnapshot> {
  try {
    const response = await fetch('/api/web3/merge', { signal });
    if (!response.ok) return FALLBACK_MERGE;
    return (await response.json()) as Web3MergeSnapshot;
  } catch {
    return FALLBACK_MERGE;
  }
}
