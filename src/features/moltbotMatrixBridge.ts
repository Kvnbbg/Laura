import {
  buildMatrixActionDeck,
  buildMatrixRelayDrafts,
  buildDevNovlangueFeed,
  buildMatrixProgress,
  type MatrixBridgeActionItem,
  type MatrixDevSignal,
  type MatrixProgressState,
  type MatrixRelayDraft,
} from './matrixProgress';

export const MOLT_BOT_BRIDGE_COMMANDS = ['auto', 'add', 'goto add'] as const;
export type MoltBotBridgeCommand = (typeof MOLT_BOT_BRIDGE_COMMANDS)[number];

export const MOLT_BOT_BRIDGE_CHANNELS = ['web', 'terminal'] as const;
export type MoltBotBridgeChannel = (typeof MOLT_BOT_BRIDGE_CHANNELS)[number];
export type MoltBotBridgePair = `${MoltBotBridgeChannel}/${MoltBotBridgeChannel}`;

export type MoltBotBridgeOperation = 'auto' | 'add' | 'goto_add';

export interface LauraMoltBotInput {
  id?: string;
  name?: string;
  faction?: string;
  level?: number;
  energy?: number;
  maxEnergy?: number;
  skills?: string[];
  source?: string;
  target?: string;
  command?: string;
  userId?: string;
  streakDays?: number;
  xpTotal?: number;
}

export interface MatrixCitizenPreview {
  id: string;
  username: string;
  displayName: string;
  title: string;
  tier: 'core' | 'rising' | 'specialist';
  action: 'COMMENT_INSIGHT' | 'PUBLISH_PROJECT_UPDATE';
  focus: string;
  pulse: string;
  topics: string[];
  wellbeing: {
    energy: number;
    burnoutRisk: number;
    inspiration: number;
    socialBattery: number;
  };
}

export interface LauraMoltBotBridgePlan {
  command: MoltBotBridgeCommand;
  channelPair: MoltBotBridgePair;
  operation: MoltBotBridgeOperation;
  transform: 'moltbot-to-matrix-citizen';
  citizen: MatrixCitizenPreview;
  techandstreamRoute: string;
  terminalCommand: string;
  loop: string[];
  checks: string[];
  progress: MatrixProgressState;
  actionDeck: MatrixBridgeActionItem[];
  relayDrafts: MatrixRelayDraft[];
  devFeed: MatrixDevSignal[];
}

const cleanSegment = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();

const ensureMin = (value: string, fallback: string): string => {
  if (value.length >= 3) return value;
  return fallback;
};

const clampScore = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

export function normalizeMoltBotBridgeCommand(command?: string): MoltBotBridgeCommand {
  const normalized = (command ?? 'auto').trim().toLowerCase().replace(/[_-]+/g, ' ');
  if (normalized === 'add') return 'add';
  if (normalized === 'goto add') return 'goto add';
  return 'auto';
}

export function normalizeMoltBotBridgeChannel(channel?: string): MoltBotBridgeChannel {
  return channel?.trim().toLowerCase() === 'terminal' ? 'terminal' : 'web';
}

export function getMoltBotBridgePair(source?: string, target?: string): MoltBotBridgePair {
  return `${normalizeMoltBotBridgeChannel(source)}/${normalizeMoltBotBridgeChannel(target)}`;
}

const titleForFaction = (faction?: string): string => {
  switch ((faction ?? '').trim().toLowerCase()) {
    case 'code':
      return 'Code Forge MatrixCitizen';
    case 'design':
      return 'Interface MatrixCitizen';
    case 'data':
      return 'Data Signal MatrixCitizen';
    case 'deploy':
      return 'Deployment MatrixCitizen';
    default:
      return 'Open Source MatrixCitizen';
  }
};

const tierForLevel = (level: number): MatrixCitizenPreview['tier'] => {
  if (level >= 8) return 'specialist';
  if (level >= 3) return 'rising';
  return 'core';
};

const operationForCommand = (command: MoltBotBridgeCommand): MoltBotBridgeOperation =>
  command === 'goto add' ? 'goto_add' : command;

export function createMatrixCitizenPreview(input: LauraMoltBotInput): MatrixCitizenPreview {
  const name = input.name?.trim() || 'Laura MoltBot';
  const idSeed = ensureMin(cleanSegment(input.id || name), 'laura-moltbot');
  const username = ensureMin(cleanSegment(name).replace(/-/g, '_').slice(0, 42), 'laura_moltbot');
  const level = Math.max(1, Math.round(input.level ?? 5));
  const energy = clampScore(input.energy ?? 82);
  const maxEnergy = Math.max(1, Math.round(input.maxEnergy ?? 100));
  const command = normalizeMoltBotBridgeCommand(input.command);
  const action = command === 'auto' ? 'COMMENT_INSIGHT' : 'PUBLISH_PROJECT_UPDATE';
  const skills = (input.skills?.filter(Boolean) ?? ['routing', 'safe-publishing', 'moltbook']).slice(0, 6);

  return {
    id: `matrix-${idSeed}`,
    username,
    displayName: name.slice(0, 80),
    title: titleForFaction(input.faction),
    tier: tierForLevel(level),
    action,
    focus: 'MoltBot to MatrixCitizen bridge for Techandstream.com',
    pulse:
      command === 'goto add'
        ? 'Routing to the add surface before publishing.'
        : command === 'add'
          ? 'Ready to add a reviewed MatrixCitizen.'
          : 'Choosing the safest MatrixCitizen action automatically.',
    topics: ['MoltBots', 'MatrixCitizen', 'Techandstream.com', 'Laura', ...skills].slice(0, 12),
    wellbeing: {
      energy,
      burnoutRisk: clampScore(100 - Math.round((energy / maxEnergy) * 100)),
      inspiration: clampScore(45 + level * 7),
      socialBattery: clampScore(55 + Math.min(skills.length, 6) * 6),
    },
  };
}

export function resolveLauraMoltBotBridge(input: LauraMoltBotInput): LauraMoltBotBridgePlan {
  const command = normalizeMoltBotBridgeCommand(input.command);
  const channelPair = getMoltBotBridgePair(input.source, input.target);
  const citizen = createMatrixCitizenPreview({ ...input, command });
  const progress = buildMatrixProgress({
    userId: input.userId ?? citizen.username,
    matrixCitizenId: citizen.id,
    streakDays: input.streakDays,
    xpTotal: input.xpTotal,
  });
  const actionDeck = buildMatrixActionDeck(progress, channelPair);
  const bot = encodeURIComponent(citizen.username);
  const techandstreamRoute =
    command === 'goto add'
      ? `/matrix-citizen/add?bot=${bot}&from=${channelPair}`
      : `/matrix-citizen?bot=${bot}&action=${encodeURIComponent(command)}&from=${channelPair}`;

  return {
    command,
    channelPair,
    operation: operationForCommand(command),
    transform: 'moltbot-to-matrix-citizen',
    citizen,
    techandstreamRoute,
    terminalCommand: `/run matrix-citizen ${command}`,
    loop: [
      'catch malformed command',
      'resolve command and channel pair',
      'transform MoltBot into MatrixCitizen',
      'hash day-number into themed bonus world',
      'sync public XP and streak envelope over /laura/bridge',
      'validate public preview',
      'open Techandstream add route',
    ],
    checks: [
      'no private tokens',
      'no hidden admin routes',
      'only public-safe metadata',
      'human review before publishing',
    ],
    progress,
    actionDeck,
    relayDrafts: buildMatrixRelayDrafts(progress, citizen.displayName),
    devFeed: buildDevNovlangueFeed(progress, citizen.displayName),
  };
}
