# Checkpoints SQL — SQLite & Postgres (LangGraph)

Laura te guide avec des **commandes collables**. Elle n’exécute pas Postgres
pour toi sans que tu valides.

## Pourquoi SQL

`InMemorySaver` meurt au restart. Pour garder un workflow :

| Backend | Usage |
| --- | --- |
| **SqliteSaver** | Dev / mono-process / fichier local |
| **PostgresSaver** | Prod / multi-process / pool |
| **Async\*** | Graphes `async` |

Clé de reprise : `config = {"configurable": {"thread_id": "…"}}`  
(`thread_id` < 255 caractères sur Postgres).

## SQLite — commandes

```bash
python -m venv .venv && source .venv/bin/activate
pip install -U langgraph langgraph-checkpoint-sqlite

python <<'PY'
import sqlite3
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import StateGraph

builder = StateGraph(int)
builder.add_node("add_one", lambda x: x + 1)
builder.set_entry_point("add_one")
builder.set_finish_point("add_one")

conn = sqlite3.connect("checkpoints.sqlite", check_same_thread=False)
saver = SqliteSaver(conn)
# setup() crée les tables si besoin (souvent auto)
graph = builder.compile(checkpointer=saver)
config = {"configurable": {"thread_id": "demo-1"}}
print(graph.invoke(3, config))
print(graph.get_state(config))
PY

# Inspecter le fichier
ls -la checkpoints.sqlite
sqlite3 checkpoints.sqlite ".tables"
```

Variante context manager :

```python
with SqliteSaver.from_conn_string("checkpoints.sqlite") as saver:
    graph = builder.compile(checkpointer=saver)
```

**Limites SQLite** : pas idéal multi-threads / multi-machines ; pour async → `AsyncSqliteSaver`.

## Postgres — commandes

```bash
pip install -U psycopg psycopg-pool langgraph langgraph-checkpoint-postgres

# Exemple URI locale (à adapter)
export LG_DB="postgresql://postgres:postgres@127.0.0.1:5432/postgres?sslmode=disable"

python <<'PY'
import os
from langgraph.checkpoint.postgres import PostgresSaver

DB = os.environ["LG_DB"]
with PostgresSaver.from_conn_string(DB) as checkpointer:
    checkpointer.setup()  # OBLIGATOIRE la première fois (tables + migrations)
    print("postgres checkpoint tables ready")
PY
```

Connexion manuelle (pièges fréquents) :

```python
import psycopg
from psycopg.rows import dict_row
from langgraph.checkpoint.postgres import PostgresSaver

# REQUIS: autocommit=True + row_factory=dict_row
with psycopg.connect(DB_URI, autocommit=True, row_factory=dict_row) as conn:
    checkpointer = PostgresSaver(conn)
    checkpointer.setup()
```

Pool (prod) :

```python
from psycopg_pool import ConnectionPool
from langgraph.checkpoint.postgres import PostgresSaver

with ConnectionPool(conninfo=DB_URI, max_size=20, kwargs={
    "autocommit": True,
    "prepare_threshold": 0,
    "row_factory": dict_row,
}) as pool:
    checkpointer = PostgresSaver(pool)
    checkpointer.setup()
    graph = builder.compile(checkpointer=checkpointer)
```

## Ops / pièges

| Problème | Fix |
| --- | --- |
| Tables absentes | `checkpointer.setup()` une fois |
| `TypeError: tuple indices…` | `row_factory=dict_row` |
| setup non persisté | `autocommit=True` |
| `thread_id` trop long | UUID ≤ 255 chars |
| Croissance disque | prune / rétention (cron delete old checkpoints) |
| RAM only | ne pas laisser `InMemorySaver` en prod |

## Checkpointer ≠ Store ≠ Laura memory

| Système | Rôle |
| --- | --- |
| SQL checkpointer | État **du graphe** (où en est le workflow) |
| LangGraph Store | Faits cross-thread applicatifs |
| Laura RAG / agent-memory | Mémoire **humaine** Markdown, multi-hosts |

## Suite Laura

```text
/run guide langgraph
/run protocols mcp
/run protocols compare
/run orchestra plan workflow durable avec postgres checkpointer
```
