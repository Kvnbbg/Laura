/** Laura protocol guide — always ends with next commands. */
export default {
  name: 'protocols',
  description: 'MCP vs A2A, Agent Cards, next commands so the user is never lost.',
  async run({ args = [], print }) {
    const topic = (args[0] || 'list').toLowerCase();

    if (topic === 'list' || topic === 'help') {
      print('Protocoles agents — Laura te guide, tu colles les commandes.');
      print('  /run protocols mcp');
      print('  /run protocols a2a');
      print('  /run protocols compare');
      print('  /run protocols card');
      print('Docs: docs/A2A_PROTOCOL.md  docs/LANGGRAPH_CHECKPOINTS.md');
      print('Si tu es perdu: /run guide lost');
      return;
    }

    if (topic === 'mcp') {
      print('MCP = agent → outils/données (vertical).');
      print('Exemples: filesystem, DB, search, GitHub server.');
      print('Prochaines commandes:');
      print('  # lister des serveurs MCP déjà installés sur ta machine');
      print('  which npx && npx -y @modelcontextprotocol/server-filesystem --help');
      print('  /run memory status');
      print('  /run protocols compare');
      return;
    }

    if (topic === 'a2a') {
      print('A2A = agent ↔ agent (horizontal, process séparés).');
      print('Primitives: Agent Card, Message, Task, Artifacts.');
      print('Transport: JSON-RPC over HTTP(S), SSE, push.');
      print('Prochaines commandes:');
      print('  pip install a2a-sdk');
      print('  python -c "import a2a; print(\"ok\")"');
      print('  # ADK optional: pip install google-adk');
      print('  # adk api_server --a2a');
      print('  /run protocols card');
      print('  /run orchestra plan collab multi-agent cross-service');
      return;
    }

    if (topic === 'compare') {
      print('MCP  → USB-C des outils (un agent enrichit son monde).');
      print('A2A  → carte de visite + délégation (agents pairs).');
      print('LangGraph checkpoints → état *d’un* workflow (thread_id).');
      print('Les trois se combinent: graphe local + MCP tools + A2A peers.');
      print('Prochaines commandes:');
      print('  /run protocols mcp');
      print('  /run protocols a2a');
      print('  /run guide next');
      return;
    }

    if (topic === 'card') {
      print('Agent Card (découverte A2A) décrit name, skills, url, I/O modes.');
      print('Souvent servi sous un chemin well-known agent-card.json.');
      print('Sans card valide, un client A2A ne peut pas déléguer proprement.');
      print('Prochaines commandes:');
      print('  # inspecter une card si tu as une URL');
      print('  # curl -s "$AGENT_URL/.well-known/agent-card.json" | head');
      print('  /run agents list');
      return;
    }

    print(`Inconnu: ${topic}. /run protocols list`);
  },
};
