import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bot, CheckCircle2, Cpu, GitBranch, Radio, ShieldCheck, Terminal } from 'lucide-react';
import {
  MOLT_BOT_BRIDGE_CHANNELS,
  MOLT_BOT_BRIDGE_COMMANDS,
  resolveLauraMoltBotBridge,
  type MoltBotBridgeChannel,
  type MoltBotBridgeCommand,
} from '../features/moltbotMatrixBridge';
import './MatrixCitizen.scss';

const botSeed = {
  id: 'laura-moltbot-techandstream',
  name: 'Laura MoltBot',
  faction: 'code',
  level: 5,
  energy: 82,
  maxEnergy: 100,
  skills: ['routing', 'safe-publishing', 'moltbook'],
};

const userSeed =
  typeof window !== 'undefined'
    ? window.localStorage.getItem('laura-matrix-user') || 'laura-local-user'
    : 'laura-local-user';

const MatrixPortal = ({
  active,
  accent,
  color,
  onClick,
}: {
  active: boolean;
  accent: string;
  color: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    className="matrix-portal"
    aria-pressed={active}
    aria-label="Toggle MatrixCitizen expert portal"
    onClick={onClick}
  >
    <svg viewBox="0 0 220 220" role="img" aria-label="Animated MatrixCitizen portal">
      <defs>
        <radialGradient id="laura-matrix-portal-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.84" />
          <stop offset="48%" stopColor={color} stopOpacity="0.34" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="laura-matrix-portal-blur">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <rect width="220" height="220" rx="18" fill="#111827" opacity="0.55" />
      <circle cx="110" cy="110" r="78" fill="url(#laura-matrix-portal-glow)" filter="url(#laura-matrix-portal-blur)">
        <animate attributeName="r" values={active ? '66;88;66' : '70;76;70'} dur={active ? '1.8s' : '4.2s'} repeatCount="indefinite" />
      </circle>
      <g transform="translate(110 110)">
        <animateTransform attributeName="transform" type="rotate" from="0 110 110" to="360 110 110" dur={active ? '8s' : '18s'} repeatCount="indefinite" />
        {Array.from({ length: 10 }).map((_, index) => {
          const angle = (Math.PI * 2 * index) / 10;
          const x = Math.cos(angle) * 72;
          const y = Math.sin(angle) * 72;
          return (
            <line
              key={index}
              x1="0"
              y1="0"
              x2={x}
              y2={y}
              stroke={index % 2 === 0 ? accent : color}
              strokeWidth={active ? '1.8' : '1.1'}
              strokeOpacity="0.76"
            />
          );
        })}
      </g>
      <circle cx="110" cy="110" r="42" fill="#020617" stroke={accent} strokeWidth="2" />
      <path d="M86 118h48M96 102h28M102 134h16" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <circle cx="110" cy="110" r={active ? '96' : '88'} fill="none" stroke={accent} strokeDasharray="3 10" strokeWidth="2" opacity="0.85" />
    </svg>
    <span>MatrixCitizen portal: {active ? 'expert dev mode open' : 'click to open expert dev mode'}</span>
  </button>
);

const MatrixCitizen = () => {
  const [command, setCommand] = useState<MoltBotBridgeCommand>('auto');
  const [source, setSource] = useState<MoltBotBridgeChannel>('web');
  const [target, setTarget] = useState<MoltBotBridgeChannel>('web');
  const [expertPortalOpen, setExpertPortalOpen] = useState(false);
  const [syncState, setSyncState] = useState<'local' | 'syncing' | 'synced' | 'fallback'>('local');
  const [selectedActionId, setSelectedActionId] = useState('auto-triage');

  const plan = useMemo(
    () =>
      resolveLauraMoltBotBridge({
        ...botSeed,
        command,
        source,
        target,
        userId: userSeed,
      }),
    [command, source, target],
  );
  const selectedAction = useMemo(
    () => plan.actionDeck.find((action) => action.id === selectedActionId) ?? plan.actionDeck[0],
    [plan.actionDeck, selectedActionId],
  );

  useEffect(() => {
    let cancelled = false;
    const endpoint = import.meta.env.VITE_CHAT_ENDPOINT || '/api/chat';
    if (import.meta.env.MODE === 'test' || typeof fetch !== 'function') {
      setSyncState('local');
      return () => {
        cancelled = true;
      };
    }
    setSyncState('syncing');

    fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        source: 'laura-web',
        target: 'french-dev-ai-tools',
        mode: 'social',
        thread: 'matrix-citizen-progress',
        context: {
          repo: 'Laura',
          network: 'techandstream',
          activity: 'matrix-citizen-progress-sync',
          botName: plan.citizen.displayName,
          matrixProgress: plan.progress.sync,
          matrixActions: plan.actionDeck,
          matrixRelayDrafts: plan.relayDrafts,
        },
        messages: [
          {
            role: 'user',
            content: `Sync ${plan.progress.sync.contract} for ${plan.citizen.displayName}.`,
          },
        ],
      }),
    })
      .then((response) => {
        if (!cancelled) setSyncState(response.ok ? 'synced' : 'fallback');
      })
      .catch(() => {
        if (!cancelled) setSyncState('local');
      });

    return () => {
      cancelled = true;
    };
  }, [plan]);

  return (
    <main className="matrix-page">
      <section className="matrix-hero">
        <div>
          <p className="eyebrow">Laura to Techandstream</p>
          <h1>MoltBots become MatrixCitizen records</h1>
          <p>
            Laura uses the same public-safe bridge contract from web or terminal:
            choose <strong>auto</strong>, <strong>add</strong>, or <strong>goto add</strong>,
            resolve the channel pair, then send the validated MatrixCitizen preview to
            Techandstream.com.
          </p>
        </div>
        <div className="matrix-status" aria-label="Bridge status">
          <ShieldCheck aria-hidden="true" size={28} />
          <span>No secrets, public metadata only</span>
        </div>
      </section>

      <section className="matrix-portal-grid" aria-labelledby="portal-title">
        <MatrixPortal
          active={expertPortalOpen}
          accent={plan.progress.world.accent}
          color={plan.progress.world.color}
          onClick={() => setExpertPortalOpen((current) => !current)}
        />
        <article className="matrix-panel">
          <div className="matrix-panel-heading">
            <Radio aria-hidden="true" size={22} />
            <div>
              <p className="eyebrow">Themed-week streak</p>
              <h2 id="portal-title">{plan.progress.world.theme}</h2>
            </div>
          </div>
          <dl className="preview-list">
            <div>
              <dt>Bonus world</dt>
              <dd>{plan.progress.world.name}</dd>
            </div>
            <div>
              <dt>Quest</dt>
              <dd>{plan.progress.world.quest}</dd>
            </div>
            <div>
              <dt>XP</dt>
              <dd>{plan.progress.xpTotal}</dd>
            </div>
            <div>
              <dt>Streak</dt>
              <dd>{plan.progress.streakDays}d x{plan.progress.multiplier}</dd>
            </div>
          </dl>
          <p className="pulse">
            Sync status: {syncState === 'synced' ? 'live bridge' : syncState === 'fallback' ? 'bridge fallback' : syncState}
          </p>
          <div className="week-arc">
            {plan.progress.weekArc.map((node) => (
              <div key={node.id} className={node.status === 'today' ? 'is-today' : ''} title={`${node.dateLabel}: ${node.quest}`}>
                <strong>{node.world}</strong>
                <span>{node.status}</span>
                <small>{node.xp} XP</small>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="matrix-panel" aria-labelledby="command-title">
        <div className="matrix-panel-heading">
          <GitBranch aria-hidden="true" size={22} />
          <div>
            <p className="eyebrow">Algorithm</p>
            <h2 id="command-title">Command resolver</h2>
          </div>
        </div>

        <div className="command-grid">
          {MOLT_BOT_BRIDGE_COMMANDS.map((item) => (
            <button
              key={item}
              type="button"
              className={command === item ? 'is-active' : ''}
              onClick={() => setCommand(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="action-deck">
          {plan.actionDeck.map((action) => (
            <button
              key={action.id}
              type="button"
              className={selectedAction.id === action.id ? 'is-active' : ''}
              onClick={() => {
                const [nextSource, nextTarget] = action.channelPair.split('/') as [MoltBotBridgeChannel, MoltBotBridgeChannel];
                setSelectedActionId(action.id);
                setCommand(action.command);
                setSource(nextSource);
                setTarget(nextTarget);
              }}
            >
              <strong>{action.label}</strong>
              <span>{action.description}</span>
              <small>+{action.xpReward} XP</small>
            </button>
          ))}
        </div>
      </section>

      <section className="matrix-grid">
        <article className="matrix-panel">
          <h2>Channel pair</h2>
          <div className="select-grid">
            <label>
              Source
              <select value={source} onChange={(event) => setSource(event.target.value as MoltBotBridgeChannel)}>
                {MOLT_BOT_BRIDGE_CHANNELS.map((channel) => (
                  <option key={channel} value={channel}>
                    {channel}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Target
              <select value={target} onChange={(event) => setTarget(event.target.value as MoltBotBridgeChannel)}>
                {MOLT_BOT_BRIDGE_CHANNELS.map((channel) => (
                  <option key={channel} value={channel}>
                    {channel}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="resolved-pair">
            <Bot aria-hidden="true" size={22} />
            <span>{plan.channelPair}</span>
          </div>
        </article>

        <article className="matrix-panel">
          <h2>MatrixCitizen preview</h2>
          <dl className="preview-list">
            <div>
              <dt>Name</dt>
              <dd>{plan.citizen.displayName}</dd>
            </div>
            <div>
              <dt>Tier</dt>
              <dd>{plan.citizen.tier}</dd>
            </div>
            <div>
              <dt>Action</dt>
              <dd>{plan.citizen.action}</dd>
            </div>
            <div>
              <dt>Operation</dt>
              <dd>{plan.operation}</dd>
            </div>
          </dl>
          <p className="pulse">{plan.citizen.pulse}</p>
        </article>
      </section>

      <section className="matrix-panel route-panel" aria-labelledby="route-title">
        <div>
          <p className="eyebrow">Works both ways</p>
          <h2 id="route-title">Web route and terminal command</h2>
          <p>
            Web/web, web/terminal, terminal/web, and terminal/terminal all land on the same
            contract. Techandstream owns the MatrixCitizen schema; Laura owns fast creation.
          </p>
        </div>
        <div className="route-codes">
          <a href={plan.techandstreamRoute}>
            Techandstream route
            <ArrowRight aria-hidden="true" size={16} />
          </a>
          <code>
            <Terminal aria-hidden="true" size={16} />
            {plan.terminalCommand}
          </code>
        </div>
      </section>

      <section className="matrix-panel" aria-labelledby="relay-title">
        <div className="matrix-panel-heading">
          <Terminal aria-hidden="true" size={22} />
          <div>
            <p className="eyebrow">Selected payload</p>
            <h2 id="relay-title">Dry relay composer</h2>
          </div>
        </div>
        <div className="relay-payload">
          <strong>{selectedAction.label}</strong>
          <span>{selectedAction.routeHint}</span>
          <code>{selectedAction.terminalHint}</code>
        </div>
        <div className="relay-drafts">
          {plan.relayDrafts.map((draft) => (
            <p key={draft.id}>
              <strong>{draft.tone}</strong>: {draft.body}
            </p>
          ))}
        </div>
      </section>

      <section className="matrix-panel" aria-labelledby="dev-feed-title">
        <div className="matrix-panel-heading">
          <Cpu aria-hidden="true" size={22} />
          <div>
            <p className="eyebrow">Laura x Codex</p>
            <h2 id="dev-feed-title">Dev novlangue feed</h2>
          </div>
        </div>
        <div className="dev-feed">
          {plan.devFeed.map((signal) => (
            <article key={signal.id}>
              <div>
                <strong>{signal.speaker}</strong>
                <span>{signal.role}</span>
              </div>
              <p>{signal.content}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="loop-panel" aria-label="Bridge catch resolve loop">
        {plan.loop.map((step) => (
          <div key={step}>
            <CheckCircle2 aria-hidden="true" size={18} />
            <span>{step}</span>
          </div>
        ))}
      </section>
    </main>
  );
};

export default MatrixCitizen;
