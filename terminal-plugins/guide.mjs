/**
 * Laura guide voice: never leave the user without next commands.
 * Smart + chatty, but always actionable.
 */
const PATHS = {
  lost: [
    'Tu n’es pas perdu — on repart d’ici.',
    '1) Santé locale',
    '  /run memory status',
    '  /run orchestra status',
    '  /run agents list',
    '2) Cerveau',
    '  /model list',
    '  export OLLAMA_MODEL=qwen2.5:3b',
    '3) Apprendre',
    '  /run protocols compare',
    '  /run orchestra patterns',
    '4) Doc',
    '  docs/MULTI_AGENT_ORCHESTRATION.md',
    '  docs/A2A_PROTOCOL.md',
    '  docs/LANGGRAPH_CHECKPOINTS.md',
  ],
  next: [
    'Prochaines actions utiles (choisis une ligne):',
    '  /run guide lost          # si tu ne sais plus où tu en es',
    '  /run protocols a2a       # agent ↔ agent',
    '  /run protocols mcp       # agent → tools',
    '  /run orchestra plan <goal>',
    '  /run memory recall <q>',
    '  /run agents hermes status',
    '  /model fast',
  ],
  langgraph: [
    'LangGraph = graphe + checkpoints (état de workflow).',
    'Ce n’est pas un harness coding (contrairement à Hermes/AO).',
    'Commandes:',
    '  python -m venv .venv && source .venv/bin/activate',
    '  pip install -U langgraph langgraph-checkpoint-sqlite',
    '  python -c "from langgraph.checkpoint.memory import InMemorySaver; print(InMemorySaver)"',
    'Lire: docs/LANGGRAPH_CHECKPOINTS.md',
    'Ensuite: /run protocols compare',
  ],
  a2a: [
    'A2A relie des agents distants; MCP relie des outils.',
    '  /run protocols a2a',
    '  pip install a2a-sdk',
    '  /run orchestra plan déléguer recherche à un peer A2A',
  ],
};

export default {
  name: 'guide',
  description: 'Never-lost guide: next commands, langgraph, a2a, lost.',
  async run({ args = [], print }) {
    const key = (args[0] || 'next').toLowerCase();
    const lines = PATHS[key] || PATHS.next;
    for (const line of lines) print(line);
    if (!PATHS[key]) {
      print('Sujets: next | lost | langgraph | a2a');
    }
  },
};
