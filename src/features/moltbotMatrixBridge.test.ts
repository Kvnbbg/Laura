import { describe, expect, it } from 'vitest';
import {
  getMoltBotBridgePair,
  normalizeMoltBotBridgeCommand,
  resolveLauraMoltBotBridge,
} from './moltbotMatrixBridge';

describe('Laura MoltBot Matrix bridge', () => {
  it('normalizes commands and falls back to auto', () => {
    expect(normalizeMoltBotBridgeCommand('add')).toBe('add');
    expect(normalizeMoltBotBridgeCommand('goto-add')).toBe('goto add');
    expect(normalizeMoltBotBridgeCommand('goto_add')).toBe('goto add');
    expect(normalizeMoltBotBridgeCommand('broken')).toBe('auto');
  });

  it('resolves all web and terminal channel pairs', () => {
    expect(getMoltBotBridgePair('web', 'web')).toBe('web/web');
    expect(getMoltBotBridgePair('web', 'terminal')).toBe('web/terminal');
    expect(getMoltBotBridgePair('terminal', 'web')).toBe('terminal/web');
    expect(getMoltBotBridgePair('terminal', 'terminal')).toBe('terminal/terminal');
  });

  it('creates a Techandstream add route for goto add', () => {
    const plan = resolveLauraMoltBotBridge({
      name: 'Forge Bot',
      faction: 'code',
      level: 7,
      command: 'goto add',
      source: 'terminal',
      target: 'web',
    });

    expect(plan.operation).toBe('goto_add');
    expect(plan.channelPair).toBe('terminal/web');
    expect(plan.citizen.displayName).toBe('Forge Bot');
    expect(plan.citizen.action).toBe('PUBLISH_PROJECT_UPDATE');
    expect(plan.techandstreamRoute).toContain('/matrix-citizen/add');
    expect(plan.terminalCommand).toBe('/run matrix-citizen goto add');
    expect(plan.progress.sync.contract).toBe('laura-bridge-progress-v1');
    expect(plan.progress.world.name).toBeTruthy();
    expect(plan.progress.weekArc).toHaveLength(7);
    expect(plan.actionDeck.map((action) => action.command)).toEqual(['auto', 'add', 'goto add']);
    expect(plan.relayDrafts.some((draft) => draft.body.includes('no secrets'))).toBe(true);
    expect(plan.devFeed.map((signal) => signal.speaker)).toContain('Codex');
  });
});
