# LangGraph — checkpoints & exécution durable

Laura **n’embarque pas** LangGraph. Elle explique quand l’utiliser et quelles
commandes lancer. Tu n’es jamais perdu : chaque section finit par des commandes.

## Idée en une phrase

Un **checkpointer** photographie l’état du graphe à chaque superstep.
Si le process crash, si un humain intervient, ou si tu veux du *time travel*,
tu reprends depuis le dernier checkpoint — pas depuis zéro.

## Checkpointer vs Store

| | **Checkpointer** | **Store** |
| --- | --- | --- |
| Contenu | Snapshots d’état du graphe | Données app (préférences, faits) |
| Portée | Un **thread** (`thread_id`) | Cross-thread |
| Mémoire | Court terme / workflow | Long terme |
| Pour | Continuité, HITL, fault-tolerance, time travel | Préférences user, knowledge partagée |

Laura RAG / agent-memory ≈ **Store** (faits durables).  
LangGraph checkpointer ≈ **état de workflow** (où en est le graphe).

## Modes de durabilité

| Mode | Comportement | Quand |
| --- | --- | --- |
| `exit` | Persist seulement à la fin / interrupt | Perf max, OK si crash mid-run acceptable |
| `async` | Persist en arrière-plan pendant l’étape suivante | Bon compromis |
| `sync` | Persist **avant** l’étape suivante | Max sécurité, un peu plus lent |

## Backends courants

- `InMemorySaver` — dev uniquement (perdu au restart)
- `SqliteSaver` — local fichier
- `PostgresSaver` — prod

## Minimal mental model

```text
StateGraph nodes/edges
        │
        ▼ compile(checkpointer=…)
        │
 invoke/stream(config={configurable:{thread_id:"…"}}, durability="sync")
        │
        ▼ checkpoint N
   [crash / human interrupt]
        │
        ▼ same thread_id → resume from checkpoint N
```

## Capacités débloquées

1. **Fault tolerance** — reprise au dernier superstep réussi  
2. **Human-in-the-loop** — interrupt → humain approuve → resume  
3. **Time travel** — rejouer / brancher depuis un checkpoint antérieur  
4. **Conversation continuity** — même `thread_id` = même fil

## Commandes (à valider dans ton venv)

```bash
# Environnement
python -m venv .venv && source .venv/bin/activate
pip install -U langgraph langgraph-checkpoint-sqlite
# prod optionnel:
# pip install langgraph-checkpoint-postgres

# Smoke (doc officielle)
python -c "from langgraph.checkpoint.memory import InMemorySaver; print('ok', InMemorySaver)"
```

Snippet type (ne pas coller aveuglément en prod) :

```python
from langgraph.checkpoint.memory import InMemorySaver
# from langgraph.checkpoint.sqlite import SqliteSaver

checkpointer = InMemorySaver()
graph = builder.compile(checkpointer=checkpointer)
config = {"configurable": {"thread_id": "laura-demo-1"}}
graph.invoke({"messages": […]}, config, durability="sync")
# plus tard, même thread_id → reprend
```

## Quand Laura suggère LangGraph

- Workflow métier avec **états + branches + HITL**  
- Besoin de **reprendre après crash** (pas un simple chat Ollama)  
- Pas un substitute de Hermes/AO pour coder un repo

## Suite dans Laura

```text
/run guide next
/run orchestra plan workflow métier avec human-in-the-loop
/run protocols a2a
```
