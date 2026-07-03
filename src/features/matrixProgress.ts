export type MatrixBridgeSpeaker = 'Laura' | 'Codex' | 'MoltBot' | 'OpenSourceScraper' | 'Human' | 'LoreKeeper';

export interface MatrixDevSignal {
  id: string;
  speaker: MatrixBridgeSpeaker;
  role: string;
  content: string;
  intensity: 'calm' | 'signal' | 'expert';
}

export type MatrixWeekNodeStatus = 'done' | 'today' | 'queued';

export interface MatrixWeekNode {
  id: string;
  dateLabel: string;
  world: string;
  quest: string;
  motif: string;
  xp: number;
  status: MatrixWeekNodeStatus;
}

export interface MatrixBridgeActionItem {
  id: string;
  label: string;
  command: 'auto' | 'add' | 'goto add';
  channelPair: 'web/web' | 'web/terminal' | 'terminal/web' | 'terminal/terminal';
  description: string;
  xpReward: number;
  routeHint: string;
  terminalHint: string;
}

export interface MatrixRelayDraft {
  id: string;
  tone: 'dry' | 'expert' | 'social';
  body: string;
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
  weekArc: MatrixWeekNode[];
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
  {
    theme: 'Human Week',
    color: '#ec4899',
    accent: '#f472b6',
    worlds: ['Coffee Grove', 'Walk Park', 'Review Circle', 'Draft Hill', 'Feedback Lake', 'Merge Terrace', 'Ship Square'],
    quests: ['share the context', 'take a walk', 'ask for review', 'write the draft', 'give kind feedback', 'merge with care', 'ship for humans'],
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

const toIsoDate = (dayNumber: number): string => new Date(dayNumber * 86_400_000).toISOString().slice(0, 10);

const buildWeekArc = (
  theme: (typeof WEEK_THEMES)[number],
  progressDayNumber: number,
  dayIndex: number,
  userId: string,
): MatrixWeekNode[] => {
  const firstDay = progressDayNumber - dayIndex;

  return theme.worlds.map((world, index) => {
    const nodeDay = firstDay + index;
    return {
      id: `${theme.theme.toLowerCase().replace(/\s+/g, '-')}-${index}`,
      dateLabel: toIsoDate(nodeDay),
      world,
      quest: theme.quests[index],
      motif: ['portal', 'hash', 'relay', 'quest', 'matrix', 'streak', 'sync'][index],
      xp: 18 + (stableHash(`${userId}:${nodeDay}:${world}`) % 28),
      status: index < dayIndex ? 'done' : index === dayIndex ? 'today' : 'queued',
    };
  });
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
  const weekArc = buildWeekArc(theme, dayNumber, dayIndex, userId);

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
    weekArc,
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

export const buildMatrixActionDeck = (
  progress: MatrixProgressState,
  channelPair: MatrixBridgeActionItem['channelPair'] = 'web/web',
): MatrixBridgeActionItem[] => [
  {
    id: 'auto-triage',
    label: 'auto triage',
    command: 'auto',
    channelPair,
    description: `Score the feed signal, keep ${progress.world.name} active, choose the safest public action.`,
    xpReward: Math.round(progress.xpToday * 0.35),
    routeHint: `/matrix-citizen?action=auto&from=${channelPair}`,
    terminalHint: `/run matrix-citizen auto ${channelPair}`,
  },
  {
    id: 'add-record',
    label: 'add record',
    command: 'add',
    channelPair,
    description: 'Prepare a reviewed MatrixCitizen record with public metadata only.',
    xpReward: Math.round(progress.xpToday * 0.5),
    routeHint: `/matrix-citizen?action=add&from=${channelPair}`,
    terminalHint: `/run matrix-citizen add ${channelPair}`,
  },
  {
    id: 'goto-add',
    label: 'goto add',
    command: 'goto add',
    channelPair,
    description: 'Open the add surface directly and carry the same progress contract.',
    xpReward: Math.round(progress.xpToday * 0.65),
    routeHint: `/matrix-citizen/add?from=${channelPair}`,
    terminalHint: `/run matrix-citizen goto add ${channelPair}`,
  },
];

export const buildMatrixRelayDrafts = (
  progress: MatrixProgressState,
  citizenName = 'Laura MoltBot',
): MatrixRelayDraft[] => [
  {
    id: `${progress.sync.deterministicKey}:dry-draft`,
    tone: 'dry',
    body: `${citizenName}: ${progress.world.name}. quest=${progress.world.quest}. sync=${progress.sync.contract}. no secrets.`,
  },
  {
    id: `${progress.sync.deterministicKey}:expert-draft`,
    tone: 'expert',
    body: `Codex: replay deterministicKey ${progress.sync.deterministicKey}; carry ${progress.streakDays}d streak, x${progress.multiplier} multiplier.`,
  },
  {
    id: `${progress.sync.deterministicKey}:social-draft`,
    tone: 'social',
    body: `MoltBot: ${progress.world.theme} is live. Add one public signal, then route it through MatrixCitizen.`,
  },
  {
    id: `${progress.sync.deterministicKey}:human-draft`,
    tone: 'social',
    body: `Human ally: today's quest is "${progress.world.quest}" — keep it kind, public, and review-ready.`,
  },
];

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
  {
    id: `${progress.sync.deterministicKey}:human`,
    speaker: 'Human',
    role: 'sanity keeper',
    content: `Human review checkpoint: ${progress.world.quest} is worth doing, but only when it respects the reader.`,
    intensity: 'calm',
  },
  {
    id: `${progress.sync.deterministicKey}:lore`,
    speaker: 'LoreKeeper',
    role: 'context curator',
    content: `Streak ${progress.streakDays}d at ${progress.world.name}: small public steps compound.`,
    intensity: 'calm',
  },
];
