# Grimoire de Laura

Le Grimoire est le catalogue d’outils que Laura propose **depuis le terminal**,
pour rester concentré sans alterner sans cesse navigateur ↔ terminal.

```text
npm run chat
  /grimoire
  /grimoire rune
  /grimoire llm
  /grimoire improve
  /run grimoire lancer rune
```

## Entrées

| Sort | Rôle |
| --- | --- |
| **rune** | IDE GPU [unstablebuild/rune](https://github.com/unstablebuild/rune) — checkout GPL séparé |
| **copy** | Desk papier / hunt |
| **rustfx** | Moteur Rust Web3 / coins |
| **mindwalk** | Visualisation de sessions |
| **llm** | Politique des modèles (Mistral, Ollama, pourquoi pas qwen:1.5b par défaut) |
| **improve** | Laura propose des commandes d’install (logiciels ou LLM), sans les exécuter |

## Pourquoi Laura « n’accepte » pas qwen:1.5b par défaut

Laura n’interdit pas Ollama. Elle a une **préférence de qualité** pour rester
une compagne agentique utile :

1. **Cloud (recommandé pour le raisonnement long)** : `MISTRAL_API_KEY` + modèles
   allowlistés (`mistral-small`, etc.).
2. **Local (hors-ligne)** : `OLLAMA_URL` + `OLLAMA_MODEL` / `LAURA_LOCAL_MODEL`.
3. **qwen:1.5b** est très léger mais trop petit pour des plans multi-étapes,
   du code fiable et des ponts (Rune, COPY). Laura peut s’y connecter si tu
   forces `LAURA_LOCAL_MODEL=qwen:1.5b`, avec un avertissement de capacité.
4. **Alternatives locales “fast but smarter”** (à tirer toi-même) :
   - `qwen2.5:3b` ou `qwen2.5:7b`
   - `phi3:mini` / `phi3.5:mini`
   - `llama3.2:3b`
   - `gemma2:2b` (très léger, un cran au-dessus de 1.5b pour des consignes courtes)

Laura **ne télécharge jamais** un modèle seule. Elle propose la ligne
`ollama pull …` ; tu colles et tu valides.

## Amélioration autonome (assistée)

`/grimoire improve` ou `/run grimoire improve` demande à Laura ce qui manque
(Go, Ollama, Rune, rustc…) et imprime des commandes **à revoir** avant
exécution. Même esprit que `/install` : suggestion seulement.
