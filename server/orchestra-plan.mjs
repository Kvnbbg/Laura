/**
 * Lightweight multi-agent plan builder for Laura.
 * Does not execute agents — produces a structured plan + suggested commands.
 */

const PATTERNS = {
  solo: {
    id: 'solo',
    title: 'Solo agent',
    when: 'Une tâche bornée, un seul contexte suffit',
    steps: ['Choisir un coding agent', 'Un tour avec max-turns', 'Commit / PR humain'],
  },
  pipeline: {
    id: 'pipeline',
    title: 'Pipeline séquentiel',
    when: 'Dépendances strictes (recherche → draft → review)',
    steps: ['Agent A produit artefact', 'Agent B consomme', 'Gate (tests/review)', 'Merge humain'],
  },
  fanout: {
    id: 'fanout',
    title: 'Fan-out / orchestrator–worker',
    when: 'Sous-tâches indépendantes parallélisables',
    steps: [
      'Orchestrator découpe les goals',
      'Workers isolés (worktree/workspace)',
      'Synthèse des résumés seulement',
      'Gate qualité',
    ],
  },
  supervisor: {
    id: 'supervisor',
    title: 'Superviseur / équipe',
    when: 'Objectif large, spécialistes durables',
    steps: [
      'Créer coordinator + specialists',
      'Bindings / routing',
      'Délégation bornée (profondeur 1–2)',
      'Board ou MEMORY partagée',
    ],
  },
  blackboard: {
    id: 'blackboard',
    title: 'Blackboard mémoire',
    when: 'Handoff cross-session / cross-host',
    steps: ['Écrire faits dans Markdown mémoire', 'Recall avant tâche', 'Claim unique si board'],
  },
};

const RUNTIMES = {
  ao: {
    bestFor: ['fanout', 'pipeline', 'supervisor'],
    isolation: 'git worktree + branch + PR',
    suggest: [
      'Install AO desktop from Untrivial-ai/agent-orchestrator releases',
      'Point AO at the repo; let project orchestrator spawn workers',
      'Supervise Kanban: Working → Needs you → In review → Ready to merge',
    ],
  },
  openclaw: {
    bestFor: ['supervisor', 'fanout', 'blackboard'],
    isolation: 'per-agent workspace + channel bindings',
    suggest: [
      'npx openclaw@latest  # review onboarding',
      'openclaw agents team create --non-interactive',
      'openclaw agents list --bindings',
      'openclaw doctor',
    ],
  },
  hermes: {
    bestFor: ['fanout', 'pipeline', 'supervisor'],
    isolation: 'child conversation + terminal (+ optional worktree)',
    suggest: [
      '# review install.sh then install hermes',
      'hermes doctor',
      'hermes status',
      'In chat: parallel delegate_task batch for independent research',
    ],
  },
  laura_solo: {
    bestFor: ['solo', 'blackboard'],
    isolation: 'single Ollama session + RAG',
    suggest: [
      'export OLLAMA_MODEL=qwen2.5:3b LAURA_RAG=1',
      '/run memory recall "…"',
      'npm run chat',
    ],
  },
};

function pickPattern(goal) {
  const g = String(goal || '').toLowerCase();
  if (/parallel|fan\s*out|plusieurs|multi|research/.test(g)) return PATTERNS.fanout;
  if (/équipe|team|supervisor|coordinator|canal|telegram|discord/.test(g)) return PATTERNS.supervisor;
  if (/mémoire|memory|handoff|partag/.test(g)) return PATTERNS.blackboard;
  if (/pipeline|review|draft|étape|stage/.test(g)) return PATTERNS.pipeline;
  if (/simple|solo|fix|one\s*shot|petit/.test(g)) return PATTERNS.solo;
  return PATTERNS.fanout;
}

function pickRuntimes(patternId) {
  return Object.entries(RUNTIMES)
    .filter(([, r]) => r.bestFor.includes(patternId))
    .map(([id, r]) => ({ id, ...r }));
}

/**
 * @param {string} goal
 * @param {{ pattern?: string, prefer?: string }} [opts]
 */
export function buildOrchestraPlan(goal, opts = {}) {
  const pattern =
    (opts.pattern && PATTERNS[opts.pattern]) || pickPattern(goal);
  let runtimes = pickRuntimes(pattern.id);
  if (opts.prefer && RUNTIMES[opts.prefer]) {
    runtimes = [
      { id: opts.prefer, ...RUNTIMES[opts.prefer] },
      ...runtimes.filter((r) => r.id !== opts.prefer),
    ];
  }
  if (!runtimes.length) runtimes = [{ id: 'laura_solo', ...RUNTIMES.laura_solo }];

  const primary = runtimes[0];
  return {
    schemaVersion: 'laura-orchestra-plan-v1',
    goal: String(goal || '').trim() || '(unspecified)',
    pattern: { id: pattern.id, title: pattern.title, when: pattern.when },
    steps: pattern.steps,
    primaryRuntime: primary.id,
    runtimes,
    antiCollision: [
      'Isolate workers (worktree / workspace / sandbox)',
      'One claim per task',
      'Route CI/review back to owning worker',
      'Persist facts outside chat (board / MEMORY.md / agent-memory)',
      'Bound delegation depth',
      'Human gate on merge and remote installers',
    ],
    suggestedCommands: primary.suggest,
    lauraNext: [
      `/run agents ${primary.id === 'laura_solo' ? 'list' : primary.id} status`,
      '/run memory context ' + JSON.stringify(String(goal).slice(0, 80)),
      '/run orchestra status',
    ],
  };
}

export function listPatterns() {
  return Object.values(PATTERNS);
}

export function listRuntimes() {
  return Object.entries(RUNTIMES).map(([id, r]) => ({ id, ...r }));
}
