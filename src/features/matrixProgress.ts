export type MatrixBridgeSpeaker = 'Laura' | 'Codex' | 'MoltBot' | 'OpenSourceScraper';

export interface MatrixDevSignal {
  id: string;
  speaker: MatrixBridgeSpeaker;
  role: string;
  content: string;
  intensity: 'calm' | 'signal' | 'expert';
}

export interface MatrixBonusWorld {
  id: string;
  name: string;
  theme: string;
  dayIndex: number;
  weekIndex: number;
  color: string;
  accent: string;
  motif: string;
  quest: string;
}

export interface MatrixProgressSync {
  contract: 'laura-bridge-progress-v1';
  userId: string;
  matrixCitizenId: string;
  dayNumber: number;
  streakDays: number;
  xpTotal: number;
  xpToday: number;
  multiplier: number;
  bonusWorld: string;
  weekTheme: string;
  quest: string;
  deterministicKey: string;
  updatedAt: string;
}

export interface MatrixProgressState {
  userId: string;
  matrixCitizenId: string;
  dayNumber: number;
  dayIndex: number;
  weekIndex: number;
  streakDays: number;
  xpTotal: number;
  xpToday: number;
  multiplier: number;
  world: MatrixBonusWorld;
  sync: MatrixProgressSync;
}

export interface MatrixProgressInput {
  userId?: string;
  matrixCitizenId?: string;
  streakDays?: number;
  xpTotal?: number;
  now?: Date;
}

const WEEK_THEMES = [
  {
    theme: 'Compiler Garden',
    color: '#14b8a6',
    accent: '#22d3ee',
    worlds: ['AST Grove', 'Type Lagoon', 'Lint Orchard', 'Bundle Reef', 'Runtime Meadow', 'Patch Nursery', 'Release Canopy'],
    quests: ['normalize the input', 'compose the contract', 'prune the warning', 'split the chunk', 'trace the state', 'ship the diff', 'tag the release'],
  },
  {
    theme: 'Protocol Citadel',
    color: '#6366f1',
    accent: '#a5b4fc',
    worlds: ['Handshake Gate', 'Schema Keep', 'Token Vault', 'Relay Spire', 'Audit Bridge', 'Webhook Hall', 'Consensus Roof'],
    quests: ['open the handshake', 'validate the payload', 'seal the secret', 'relay the signal', 'write the audit', 'retry the webhook', 'publish consensus'],
  },
  {
    theme: 'Open Source Reef',
    color: '#10b981',
    accent: '#bef264',
    worlds: ['README Tide', 'Issue Coral', 'Fork Channel', 'Patch Current', 'Review Shelf', 'License Bay', 'Maintainer Light'],
    quests: ['read the public note', 'triage the issue', 'fork with intent', 'land the patch', 'resolve the review', 'respect the license', 'thank the maintainer'],
  },
  {
    theme: 'Matrix Workshop',
    color: '#f59e0b',
    accent: '#facc15',
    worlds: ['Portal Loom', 'Vector Forge', 'Signal Bench', 'Glyph Router', 'Packet Kiln', 'Citizen Lathe', 'Expert Switchyard'],
    quests: ['open the portal', 'forge the vector', 'compress the signal', 'route the glyph', 'harden the packet', 'shape the citizen', 'flip expert mode'],
  },
] as const;

export const getUtcDayNumber = (date = new Date()): number =>
  Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000);

export const stableHash = (value: string): number => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

const clampPositiveInt = (value: number | undefined, fallback: number): number => {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.round(value ?? fallback));
};

export const buildMatrixProgress = (input: MatrixProgressInput = {}): MatrixProgressState => {
  const now = input.now ?? new Date();
  const dayNumber = getUtcDayNumber(now);
  const userId = input.userId?.trim() || 'matrix-guest';
  const matrixCitizenId = input.matrixCitizenId?.trim() || `matrix-${userId.replace(/[^\w-]/g, '-')}`;
  const weekIndex = Math.floor(dayNumber / 7);
  const dayIndex = dayNumber % 7;
  const themeIndex = stableHash(`${userId}:${weekIndex}`) % WEEK_THEMES.length;
  const theme = WEEK_THEMES[themeIndex];
  const streakDays = Math.max(1, clampPositiveInt(input.streakDays, (stableHash(userId) % 5) + 1));
  const xpToday = 24 + (stableHash(`${userId}:${dayNumber}`) % 31) + Math.min(streakDays, 7) * 3;
  const xpTotal = Math.max(xpToday, clampPositiveInt(input.xpTotal, 900 + (stableHash(userId) % 700)) + xpToday);
  const multiplier = Number((1 + Math.min(streakDays, 14) * 0.05).toFixed(2));
  const world: MatrixBonusWorld = {
    id: `${theme.theme.toLowerCase().replace(/\s+/g, '-')}-${dayIndex}`,
    name: theme.worlds[dayIndex],
    theme: theme.theme,
    dayIndex,
    weekIndex,
    color: theme.color,
    accent: theme.accent,
    motif: ['portal', 'hash', 'relay', 'quest', 'matrix', 'streak', 'sync'][dayIndex],
    quest: theme.quests[dayIndex],
  };
  const deterministicKey = `${userId}:${dayNumber}:${world.id}`;

  return {
    userId,
    matrixCitizenId,
    dayNumber,
    dayIndex,
    weekIndex,
    streakDays,
    xpTotal,
    xpToday,
    multiplier,
    world,
    sync: {
      contract: 'laura-bridge-progress-v1',
      userId,
      matrixCitizenId,
      dayNumber,
      streakDays,
      xpTotal,
      xpToday,
      multiplier,
      bonusWorld: world.name,
      weekTheme: world.theme,
      quest: world.quest,
      deterministicKey,
      updatedAt: now.toISOString(),
    },
  };
};

export const buildDevNovlangueFeed = (
  progress: MatrixProgressState,
  citizenName = 'Laura MoltBot',
): MatrixDevSignal[] => [
  {
    id: `${progress.sync.deterministicKey}:laura`,
    speaker: 'Laura',
    role: 'terminal persona',
    content: `Handshake /laura/bridge: ${citizenName} garde le terminal comme source canonique, XP ${progress.xpTotal}.`,
    intensity: 'signal',
  },
  {
    id: `${progress.sync.deterministicKey}:codex`,
    speaker: 'Codex',
    role: 'patch operator',
    content: `Diff normalise: streak ${progress.streakDays}j, monde ${progress.world.name}, contrat ${progress.sync.contract}.`,
    intensity: 'expert',
  },
  {
    id: `${progress.sync.deterministicKey}:moltbot`,
    speaker: 'MoltBot',
    role: 'matrix relay',
    content: `Bonus world actif: ${progress.world.theme}. Quete du jour: ${progress.world.quest}.`,
    intensity: 'signal',
  },
  {
    id: `${progress.sync.deterministicKey}:source`,
    speaker: 'OpenSourceScraper',
    role: 'public text watcher',
    content: 'Lecture open-source uniquement: on resume des signaux publics, jamais de secrets ni de logs bruts.',
    intensity: 'calm',
  },
];
