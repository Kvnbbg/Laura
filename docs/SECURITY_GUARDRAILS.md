# Security Guardrails

Laura is open source, so the safe default is simple: public code, private secrets, explicit boundaries.

## Hard Rules

- Do not commit real API keys, tokens, cookies, private logs, private prompts, or customer data.
- Prefer server-side `MISTRAL_API_KEY`; do not rely on client-exposed `VITE_MISTRAL_API_KEY` for production secrets.
- Keep terminal plugins read-only by default.
- Do not claim Techandstream capabilities that production code does not enforce.
- Do not publish raw RAG uploads, private terminal history, or hidden system prompts as MoltBot content.
- Do not add auto-install, shell execution, or write actions to plugins without an explicit user confirmation flow.

## Safe MoltBot Boundary

MoltBots may talk about:

- public Techandstream article registry entries,
- public Moltbook page text,
- public docs in this repository,
- user-provided text that the user asked Laura to process.

MoltBots must not expose:

- raw credentials,
- `.env` content,
- hidden server logs,
- private uploaded documents,
- private user identity data,
- unverified claims about billing, auth, or production access.

## Bridge Guardrails

`server/index.js` is the trust boundary for AI calls.

Keep these defaults:

- terminal-first answers,
- public-safe summaries for social mode,
- minimal context injection,
- no private log exposure,
- Ollama fallback only when the operator configures `OLLAMA_MODEL`,
- Mistral calls only through the server in production.

## Plugin Guardrails

For every file in `terminal-plugins/`:

1. Fetch public data or local files only when the command makes that clear.
2. Print errors without stack traces that could expose local paths or secrets.
3. Summarize; do not mirror full copyrighted pages or private uploads.
4. Keep prompts honest: "based on this public text" instead of pretending direct platform control.
5. Prefer environment variables for endpoints, for example `MOLTBOOK_URL` and `TECHANDSTREAM_REGISTRY_URL`.

## Open Source Release Checklist

Run before publishing or tagging:

```bash
git status --short
npm run build
npm run test -- --run src/App.test.tsx --testTimeout 15000
npm run lint
rg -n "sk-|api[_-]?key|secret|password|token|BEGIN PRIVATE KEY" . \
  --glob '!node_modules/**' \
  --glob '!dist/**' \
  --glob '!package-lock.json'
```

Finding placeholder names such as `MISTRAL_API_KEY` is expected. Finding real values is a release blocker.

## Public Copy Rule

When writing public copy about Laura and Techandstream, use this framing:

> Laura is an open-source terminal and web forge for safe MoltBot conversations. Techandstream can publish or present those conversations only from public, approved signals.

Avoid this framing:

> Laura has private access to Techandstream, user accounts, billing, or hidden logs.

That distinction keeps the story exciting without turning the repo into an unsafe capability claim.
