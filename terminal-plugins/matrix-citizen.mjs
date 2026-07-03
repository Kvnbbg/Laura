const COMMANDS = ['auto', 'add', 'goto add'];
const CHANNELS = ['web', 'terminal'];
const PUBLIC_ORIGIN = 'https://techandstream.com';
const FRENCH_DEV_TOOLS_URL = 'https://github.com/Kvnbbg/french-dev-ai-tools';
const SECURITY = {
  sourceRepository: 'Laura',
  targetRepository: 'french-dev-ai-tools',
  targetRepositoryUrl: FRENCH_DEV_TOOLS_URL,
  publicOrigin: PUBLIC_ORIGIN,
  publishTarget: 'techandstream.com',
  reviewGate: 'human-review-required',
  writeMode: 'manual-publish-only',
  allowedPayload: [
    'public article registry entries',
    'public Moltbook page text',
    'deterministic MatrixCitizen progress',
    'reviewed MatrixCitizen preview metadata',
  ],
  blockedPayload: ['.env files', 'API keys or tokens', 'private uploads', 'unredacted terminal output', 'private prompts'],
};
const WEEK_THEMES = [
  {
    theme: 'Compiler Garden',
    worlds: ['AST Grove', 'Type Lagoon', 'Lint Orchard', 'Bundle Reef', 'Runtime Meadow', 'Patch Nursery', 'Release Canopy'],
    quests: ['normalize the input', 'compose the contract', 'prune the warning', 'split the chunk', 'trace the state', 'ship the diff', 'tag the release'],
  },
  {
    theme: 'Protocol Citadel',
    worlds: ['Handshake Gate', 'Schema Keep', 'Token Vault', 'Relay Spire', 'Audit Bridge', 'Webhook Hall', 'Consensus Roof'],
    quests: ['open the handshake', 'validate the payload', 'seal the secret', 'relay the signal', 'write the audit', 'retry the webhook', 'publish consensus'],
  },
  {
    theme: 'Open Source Reef',
    worlds: ['README Tide', 'Issue Coral', 'Fork Channel', 'Patch Current', 'Review Shelf', 'License Bay', 'Maintainer Light'],
    quests: ['read the public note', 'triage the issue', 'fork with intent', 'land the patch', 'resolve the review', 'respect the license', 'thank the maintainer'],
  },
  {
    theme: 'Matrix Workshop',
    worlds: ['Portal Loom', 'Vector Forge', 'Signal Bench', 'Glyph Router', 'Packet Kiln', 'Citizen Lathe', 'Expert Switchyard'],
    quests: ['open the portal', 'forge the vector', 'compress the signal', 'route the glyph', 'harden the packet', 'shape the citizen', 'flip expert mode'],
  },
  {
    theme: 'Human Week',
    worlds: ['Coffee Grove', 'Walk Park', 'Review Circle', 'Draft Hill', 'Feedback Lake', 'Merge Terrace', 'Ship Square'],
    quests: ['share the context', 'take a walk', 'ask for review', 'write the draft', 'give kind feedback', 'merge with care', 'ship for humans'],
  },
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

const buildTechandstreamRoute = (command, username, channelPair) => {
  const path = command === 'goto add' ? '/matrix-citizen/add' : '/matrix-citizen';
  const url = new URL(path, PUBLIC_ORIGIN);
  url.searchParams.set('bot', username);
  url.searchParams.set('from', channelPair);
  if (command !== 'goto add') {
    url.searchParams.set('action', command);
  }
  return url.toString();
};

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

const toIsoDate = (day) => new Date(day * 86400000).toISOString().slice(0, 10);

const buildWeekArc = ({ theme, worlds, quests }, day, dayIndex, userId) => {
  const firstDay = day - dayIndex;
  return worlds.map((world, index) => {
    const nodeDay = firstDay + index;
    return {
      dateLabel: toIsoDate(nodeDay),
      world,
      quest: quests[index],
      xp: 18 + (stableHash(`${userId}:${nodeDay}:${world}`) % 28),
      status: index < dayIndex ? 'done' : index === dayIndex ? 'today' : 'queued',
    };
  });
};

const buildActionDeck = (progress, channelPair) => [
  {
    label: 'auto triage',
    command: 'auto',
    routeHint: `/matrix-citizen?action=auto&from=${channelPair}`,
    terminalHint: `/run matrix-citizen auto ${channelPair}`,
    xpReward: Math.round(progress.xpToday * 0.35),
  },
  {
    label: 'add record',
    command: 'add',
    routeHint: `/matrix-citizen?action=add&from=${channelPair}`,
    terminalHint: `/run matrix-citizen add ${channelPair}`,
    xpReward: Math.round(progress.xpToday * 0.5),
  },
  {
    label: 'goto add',
    command: 'goto add',
    routeHint: `/matrix-citizen/add?from=${channelPair}`,
    terminalHint: `/run matrix-citizen goto add ${channelPair}`,
    xpReward: Math.round(progress.xpToday * 0.65),
  },
];

const buildRelayDrafts = (progress, name) => [
  `${name}: ${progress.bonusWorld}. quest=${progress.quest}. sync=${progress.contract}. no secrets.`,
  `Codex: replay deterministicKey ${progress.deterministicKey}; carry ${progress.streakDays}d streak, x${progress.multiplier} multiplier.`,
  `MoltBot: ${progress.weekTheme} is live. Add one public signal, then route it through MatrixCitizen.`,
  `Human review: required before Techandstream receives any public publish action.`,
];

const buildProgress = (name, citizenId) => {
  const userId = process.env.LAURA_MATRIX_USER_ID || cleanSegment(name) || 'laura_moltbot';
  const day = dayNumber();
  const weekIndex = Math.floor(day / 7);
  const dayIndex = day % 7;
  const themeConfig = WEEK_THEMES[stableHash(`${userId}:${weekIndex}`) % WEEK_THEMES.length];
  const streakDays = Math.max(1, Number(process.env.LAURA_MATRIX_STREAK_DAYS) || ((stableHash(userId) % 5) + 1));
  const xpToday = 24 + (stableHash(`${userId}:${day}`) % 31) + Math.min(streakDays, 7) * 3;
  const xpTotal = Math.max(xpToday, Number(process.env.LAURA_MATRIX_XP_TOTAL) || 900 + (stableHash(userId) % 700) + xpToday);
  const bonusWorld = themeConfig.worlds[dayIndex];
  const quest = themeConfig.quests[dayIndex];
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
    weekTheme: themeConfig.theme,
    quest,
    weekArc: buildWeekArc(themeConfig, day, dayIndex, userId),
    deterministicKey: `${userId}:${day}:${themeConfig.theme.toLowerCase().replace(/\s+/g, '-')}-${dayIndex}`,
    updatedAt: new Date().toISOString(),
  };
};

const buildPlan = ({ command, source, target }) => {
  const name = process.env.LAURA_MATRIX_BOT_NAME || 'Laura MoltBot';
  const username = cleanSegment(name).replace(/-/g, '_') || 'laura_moltbot';
  const citizenId = `matrix-${cleanSegment(name) || 'laura-moltbot'}`;
  const progress = buildProgress(name, citizenId);
  const pair = `${source}/${target}`;
  const actionDeck = buildActionDeck(progress, pair);
  const route = buildTechandstreamRoute(command, username, pair);

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
      focus: 'Public MoltBot to MatrixCitizen bridge for Techandstream.com via french-dev-ai-tools',
    },
    techandstreamRoute: route,
    frenchDevToolsUrl: FRENCH_DEV_TOOLS_URL,
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
      `target repository: ${SECURITY.targetRepository}`,
      `public origin: ${SECURITY.publicOrigin}`,
      'no private tokens',
      'no non-public admin routes',
      'public metadata only',
      'human review before publishing',
    ],
    security: SECURITY,
    progress,
    actionDeck,
    relayDrafts: buildRelayDrafts(progress, name),
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
    print(`source repo: ${plan.security.sourceRepository}`);
    print(`target repo: ${plan.security.targetRepository}`);
    print(`source URL: ${plan.frenchDevToolsUrl}`);
    print(`techandstream route: ${plan.techandstreamRoute}`);
    print(`write mode: ${plan.security.writeMode}`);
    print('');
    print('week arc:');
    for (const node of plan.progress.weekArc) {
      print(`- ${node.dateLabel} ${node.status}: ${node.world} / ${node.quest} (+${node.xp} XP)`);
    }
    print('');
    print('action deck:');
    for (const action of plan.actionDeck) {
      print(`- ${action.label}: ${action.terminalHint} (+${action.xpReward} XP)`);
    }
    print('');
    print('relay drafts:');
    for (const draft of plan.relayDrafts) {
      print(`- ${draft}`);
    }
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
