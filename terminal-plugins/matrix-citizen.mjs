const COMMANDS = ['auto', 'add', 'goto add'];
const CHANNELS = ['web', 'terminal'];
const WEEK_THEMES = [
  ['Compiler Garden', ['AST Grove', 'Type Lagoon', 'Lint Orchard', 'Bundle Reef', 'Runtime Meadow', 'Patch Nursery', 'Release Canopy']],
  ['Protocol Citadel', ['Handshake Gate', 'Schema Keep', 'Token Vault', 'Relay Spire', 'Audit Bridge', 'Webhook Hall', 'Consensus Roof']],
  ['Open Source Reef', ['README Tide', 'Issue Coral', 'Fork Channel', 'Patch Current', 'Review Shelf', 'License Bay', 'Maintainer Light']],
  ['Matrix Workshop', ['Portal Loom', 'Vector Forge', 'Signal Bench', 'Glyph Router', 'Packet Kiln', 'Citizen Lathe', 'Expert Switchyard']],
];

const cleanSegment = (value) =>
  String(value || '')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();

const normalizeCommand = (command) => {
  const normalized = String(command || 'auto').trim().toLowerCase().replace(/[_-]+/g, ' ');
  if (normalized === 'add') return 'add';
  if (normalized === 'goto add') return 'goto add';
  return 'auto';
};

const normalizeChannel = (channel) => (String(channel || '').trim().toLowerCase() === 'web' ? 'web' : 'terminal');

const resolvePair = (pairArg) => {
  if (!pairArg || !String(pairArg).includes('/')) {
    return {
      source: normalizeChannel(process.env.LAURA_MATRIX_SOURCE || 'terminal'),
      target: normalizeChannel(process.env.LAURA_MATRIX_TARGET || 'terminal'),
    };
  }
  const [source, target] = String(pairArg).split('/');
  return { source: normalizeChannel(source), target: normalizeChannel(target) };
};

const operationFor = (command) => (command === 'goto add' ? 'goto_add' : command);

const stableHash = (value) => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

const dayNumber = (date = new Date()) =>
  Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000);

const buildProgress = (name, citizenId) => {
  const userId = process.env.LAURA_MATRIX_USER_ID || cleanSegment(name) || 'laura_moltbot';
  const day = dayNumber();
  const weekIndex = Math.floor(day / 7);
  const dayIndex = day % 7;
  const [theme, worlds] = WEEK_THEMES[stableHash(`${userId}:${weekIndex}`) % WEEK_THEMES.length];
  const streakDays = Math.max(1, Number(process.env.LAURA_MATRIX_STREAK_DAYS) || ((stableHash(userId) % 5) + 1));
  const xpToday = 24 + (stableHash(`${userId}:${day}`) % 31) + Math.min(streakDays, 7) * 3;
  const xpTotal = Math.max(xpToday, Number(process.env.LAURA_MATRIX_XP_TOTAL) || 900 + (stableHash(userId) % 700) + xpToday);
  const bonusWorld = worlds[dayIndex];
  return {
    contract: 'laura-bridge-progress-v1',
    userId,
    matrixCitizenId: citizenId,
    dayNumber: day,
    streakDays,
    xpTotal,
    xpToday,
    multiplier: Number((1 + Math.min(streakDays, 14) * 0.05).toFixed(2)),
    bonusWorld,
    weekTheme: theme,
    quest: `terminal sync: ${bonusWorld.toLowerCase()}`,
    deterministicKey: `${userId}:${day}:${theme.toLowerCase().replace(/\s+/g, '-')}-${dayIndex}`,
    updatedAt: new Date().toISOString(),
  };
};

const buildPlan = ({ command, source, target }) => {
  const name = process.env.LAURA_MATRIX_BOT_NAME || 'Laura MoltBot';
  const username = cleanSegment(name).replace(/-/g, '_') || 'laura_moltbot';
  const citizenId = `matrix-${cleanSegment(name) || 'laura-moltbot'}`;
  const progress = buildProgress(name, citizenId);
  const pair = `${source}/${target}`;
  const route =
    command === 'goto add'
      ? `/matrix-citizen/add?bot=${encodeURIComponent(username)}&from=${pair}`
      : `/matrix-citizen?bot=${encodeURIComponent(username)}&action=${encodeURIComponent(command)}&from=${pair}`;

  return {
    command,
    channelPair: pair,
    operation: operationFor(command),
    transform: 'moltbot-to-matrix-citizen',
    citizen: {
      id: citizenId,
      username,
      displayName: name,
      tier: 'rising',
      action: command === 'auto' ? 'COMMENT_INSIGHT' : 'PUBLISH_PROJECT_UPDATE',
      focus: 'MoltBot to MatrixCitizen bridge for Techandstream.com',
    },
    techandstreamRoute: route,
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
    checks: ['no private tokens', 'no hidden admin routes', 'public metadata only', 'human review before publishing'],
    progress,
  };
};

export default {
  name: 'matrix-citizen',
  description: 'Resolve the MoltBot -> MatrixCitizen bridge for auto/add/goto add across web and terminal channels.',
  async run({ args = [], print }) {
    const pairArg = args.find((arg) => arg.includes('/'));
    const commandText = args.filter((arg) => arg !== pairArg).join(' ') || process.env.LAURA_MATRIX_COMMAND || 'auto';
    const command = normalizeCommand(commandText);
    const { source, target } = resolvePair(pairArg);
    const plan = buildPlan({ command, source, target });

    print('MoltBot -> MatrixCitizen bridge');
    print(`command: ${plan.command}`);
    print(`pair: ${plan.channelPair}`);
    print(`operation: ${plan.operation}`);
    print(`citizen: ${plan.citizen.displayName} (${plan.citizen.tier})`);
    print(`action: ${plan.citizen.action}`);
    print(`bonus world: ${plan.progress.weekTheme} / ${plan.progress.bonusWorld}`);
    print(`streak: ${plan.progress.streakDays}d x${plan.progress.multiplier}`);
    print(`xp: ${plan.progress.xpTotal} (+${plan.progress.xpToday} today)`);
    print(`techandstream route: ${plan.techandstreamRoute}`);
    print('');
    print('channel matrix:');
    for (const sourceChannel of CHANNELS) {
      for (const targetChannel of CHANNELS) {
        print(`- ${sourceChannel}/${targetChannel}`);
      }
    }
    print('');
    print('catch -> resolve -> loop:');
    for (const step of plan.loop) {
      print(`- ${step}`);
    }
    print('');
    print(`next: ${plan.terminalCommand}`);
    print(`sync contract: ${plan.progress.contract}`);
    print(`allowed commands: ${COMMANDS.join(', ')}`);
  },
};
