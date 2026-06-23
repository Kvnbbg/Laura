const COMMANDS = ['auto', 'add', 'goto add'];
const CHANNELS = ['web', 'terminal'];

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

const buildPlan = ({ command, source, target }) => {
  const name = process.env.LAURA_MATRIX_BOT_NAME || 'Laura MoltBot';
  const username = cleanSegment(name).replace(/-/g, '_') || 'laura_moltbot';
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
      id: `matrix-${cleanSegment(name) || 'laura-moltbot'}`,
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
      'validate public preview',
      'open Techandstream add route',
    ],
    checks: ['no private tokens', 'no hidden admin routes', 'public metadata only', 'human review before publishing'],
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
    print(`allowed commands: ${COMMANDS.join(', ')}`);
  },
};
