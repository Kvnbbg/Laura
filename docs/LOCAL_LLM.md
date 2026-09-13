# LLM locaux et Laura

## Branchement Ollama

```bash
# service local
ollama serve   # souvent déjà actif

# cerveau local recommandé (léger mais plus capable que 1.5b)
ollama pull qwen2.5:3b

export OLLAMA_URL=http://127.0.0.1:11434
export LAURA_LOCAL_MODEL=qwen2.5:3b
# équivalent : OLLAMA_MODEL=qwen2.5:3b

npm run dev:server
npm run chat
```

Sans `MISTRAL_API_KEY`, le stream chat peut basculer sur Ollama si
`LAURA_LOCAL_MODEL` est défini (voir `server/index.js`).

## Pourquoi pas qwen:1.5b comme défaut

| Critère | qwen:1.5b | qwen2.5:3b / phi3:mini |
| --- | --- | --- |
| RAM / vitesse | Excellent | Bon |
| Plans multi-étapes | Faible | Correct |
| Code + ponts outils | Fragile | Acceptable en local |
| Rôle Laura | Smoke test | Compagne locale plausible |

Tu **peux** forcer :

```bash
export LAURA_LOCAL_MODEL=qwen:1.5b
```

Laura restera honnête sur les limites via `/grimoire llm`.

## Focus terminal

`/grimoire improve` propose les `apt` / `ollama pull` / `git clone` à coller,
pour éviter l’aller-retour navigateur quand tu sais déjà ce que tu veux installer.
