/** MCP + A2A + SQL checkpoints — always end with next commands. */
export default {
  name: 'protocols',
  description: 'MCP, A2A, SQL checkpoints — guided commands so the user is never lost.',
  async run({ args = [], print }) {
    const topic = (args[0] || 'list').toLowerCase();
    const sub = (args[1] || '').toLowerCase();

    if (topic === 'list' || topic === 'help') {
      print('Protocoles & persistance — Laura donne les commandes.');
      print('  /run protocols mcp');
      print('  /run protocols a2a');
      print('  /run protocols compare');
      print('  /run protocols card');
      print('  /run protocols sql');
      print('  /run protocols sql sqlite');
      print('  /run protocols sql postgres');
      print('Docs: docs/MCP_PROTOCOL.md  docs/SQL_CHECKPOINTS.md  docs/A2A_PROTOCOL.md');
      print('Perdu ? /run guide lost');
      return;
    }

    if (topic === 'mcp') {
      print('=== MCP (Model Context Protocol) ===');
      print('Architecture: Host → Client → Server (JSON-RPC).');
      print('Primitives serveur:');
      print('  Tools      — le modèle appelle (actions)');
      print('  Resources  — contexte / données');
      print('  Prompts    — templates UX');
      print('Transport: stdio (local) | Streamable HTTP (remote)');
      print('Vertical: agent → outils. Horizontal agents = A2A.');
      print('Prochaines commandes:');
      print('  pip install mcp && python -c "import mcp; print(\"ok\")"');
      print('  npx -y @modelcontextprotocol/server-filesystem --help');
      print('  /run protocols compare');
      print('  cat docs/MCP_PROTOCOL.md  # si repo Laura cloné');
      return;
    }

    if (topic === 'a2a') {
      print('=== A2A (Agent2Agent) ===');
      print('Agent Card + Message + Task + Artifacts.');
      print('Cross-process / cross-vendor. MCP reste pour les tools.');
      print('Prochaines commandes:');
      print('  pip install a2a-sdk');
      print('  python -c "import a2a; print(\"ok\")"');
      print('  /run protocols card');
      print('  /run orchestra plan peer A2A + tools MCP');
      return;
    }

    if (topic === 'compare') {
      print('MCP  = USB-C des outils (vertical)');
      print('A2A  = délégation entre agents (horizontal)');
      print('SQL checkpoints = état d’un graphe LangGraph (thread_id)');
      print('Laura RAG = mémoire faits Markdown (pas un checkpointer)');
      print('Prochaines commandes:');
      print('  /run protocols mcp');
      print('  /run protocols sql');
      print('  /run guide next');
      return;
    }

    if (topic === 'card') {
      print('Agent Card A2A: name, skills, url, I/O modes.');
      print('  curl -s "$AGENT_URL/.well-known/agent-card.json" | head');
      print('  /run agents list');
      return;
    }

    if (topic === 'sql' || topic === 'checkpoint' || topic === 'checkpoints') {
      if (sub === 'postgres' || sub === 'pg') {
        print('=== PostgresSaver (prod) ===');
        print('  pip install -U psycopg psycopg-pool langgraph langgraph-checkpoint-postgres');
        print('  export LG_DB="postgresql://USER:PASS@127.0.0.1:5432/DB?sslmode=disable"');
        print('  # première fois: checkpointer.setup() obligatoire');
        print('  # connexion manuelle: autocommit=True + row_factory=dict_row');
        print('  # thread_id max ~255 chars');
        print('Doc: docs/SQL_CHECKPOINTS.md');
        print('Ensuite: /run protocols sql sqlite');
        return;
      }
      if (sub === 'sqlite' || sub === '') {
        print('=== SqliteSaver (dev local) ===');
        print('  pip install -U langgraph langgraph-checkpoint-sqlite');
        print('  python -c "from langgraph.checkpoint.sqlite import SqliteSaver; print(\"ok\")"');
        print('  # fichier typique: checkpoints.sqlite');
        print('  # conn = sqlite3.connect("checkpoints.sqlite", check_same_thread=False)');
        print('Prod multi-process → /run protocols sql postgres');
        print('Doc: docs/SQL_CHECKPOINTS.md');
        return;
      }
      print('Usage: /run protocols sql [sqlite|postgres]');
      return;
    }

    print(`Inconnu: ${topic}. /run protocols list`);
  },
};
