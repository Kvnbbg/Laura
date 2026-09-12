# Ollama multi-modèle pour Laura

## Objectif

Garder plusieurs modèles locaux prêts et basculer sans quitter le terminal.

## Variables

```bash
export OLLAMA_URL=http://127.0.0.1:11434
export OLLAMA_MODEL=qwen2.5:3b
export LAURA_LOCAL_MODEL=qwen2.5:3b
export OLLAMA_MODELS=qwen2.5:3b,qwen2.5:7b,phi3:mini,llama3.2:3b,gemma2:2b,qwen:1.5b,qwen2.5-coder:3b
export LAURA_MODEL_ALIASES=fast:qwen2.5:3b,smart:qwen2.5:7b,tiny:qwen:1.5b,code:qwen2.5-coder:3b
```

Si `OLLAMA_MODELS` est vide, tout nom sûr est accepté.

## Tirer les modèles (opérateur)

```bash
ollama pull qwen2.5:3b
ollama pull phi3:mini
ollama pull qwen2.5:7b
ollama pull qwen:1.5b
```

## API

- `GET /api/models` — défaut, allowlist, alias, tags installés
- `POST /api/chat` et `POST /api/chat/stream` avec `"model": "phi3:mini"` ou `"model": "fast"`

Sans `MISTRAL_API_KEY`, Laura utilise Ollama. Avec une clé Mistral, le cloud reste prioritaire.

## Terminal

```text
/model
/model fast
/model qwen2.5:7b
/model clear
/grimoire llm
```

## Politique qualité

| Alias | Modèle | Usage |
| --- | --- | --- |
| tiny | qwen:1.5b | smoke test |
| fast | qwen2.5:3b | chat local quotidien |
| mini | phi3:mini | alternative légère |
| smart | qwen2.5:7b | plus capable |
| code | qwen2.5-coder:3b | snippets |

Laura n’exécute jamais `ollama pull` seule.
