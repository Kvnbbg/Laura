# Laura - Application React cosmique + pont terminal

Laura est une application single-page en TypeScript + React qui présente une UI inspirée du cosmos pour une IA compagnon. Elle est optimisée pour itérer vite avec Vite, du SCSS et un routage moderne. Cette version inclut un chat Mistral avec pièces jointes + RAG, et un pont terminal capable de parler au même backend ou à toute API compatible.

## Product Scope

- **Audience**: Designers et développeurs qui veulent une interface soignée et cohérente.
- **Core flows**: Vue d'accueil, récit About, formulaire Contact et chat Mistral.
- **Runtime**: SPA statique plus un proxy Node léger pour Mistral + récupération de documents.
- **Terminal mode**: `go run laura_quest_main.go`, `go build -o laura laura_quest_main.go && ./laura`, or install a local `laura` command

## Features

- React 18 + TypeScript with strict checks
- Vite for fast dev/build pipelines
- SCSS-based design system (`src/styles/`)
- Client-side routing with React Router
- Contact form with configurable delivery endpoint
- Mistral AI chat widget (floating button + full-page view)
- Attachments + embeddings (RAG) with citations
- Error boundary + structured logging for safer UX

## Documentation

- [Codebase overview](docs/CODEBASE_OVERVIEW.md) — architecture, runtime map, MoltBots flow.
- [Security guardrails](docs/SECURITY_GUARDRAILS.md) — open-source safety boundaries, plugin rules, release checklist.
- [Authorship and provenance](docs/AUTHORSHIP_AND_PROVENANCE.md) — attribution, NOTICE retention, and open-source release traceability.
- [Blog: Laura, MoltBots et Techandstream](docs/blog/laura-moltbots-techandstream.md) — French public narrative for the project.

## Prerequisites

- Node.js 18+ (see `.nvmrc`)
- npm 9+ (or compatible)
- Go 1.22+ for the production CLI (`cmd/laura`)

## Installation

For the web app and Node API proxy:

```bash
npm install
```

For the CLI-first experience, use the dedicated install section below:

- [Install Laura CLI](#install-laura-cli)
- Live web guide: https://techandstream.com/install-cli
- Local web guide: `/install-cli` in the Laura app

## Running Locally

Start the API proxy (port 4000) and the Vite dev server (port 5173):

```bash
npm run dev:server
npm run dev
```

Ouvre http://localhost:5173

## Chat depuis le terminal

Avec l'API proxy lancée (`npm run dev:server`), ouvre une session de chat
texte directement dans le terminal :

```bash
npm run chat
```

- Parle à Laura via le même bridge `/api/chat` que l'interface web
  (configurable avec `LAURA_API_URL` pour pointer vers une autre URL/API
  compatible).
- **Rapide** : les réponses sont diffusées en streaming token par token via
  `/api/chat/stream` (désactivable avec `LAURA_STREAM_DISABLED=true`, avec
  repli automatique sur l'appel classique en cas d'échec). Les appels
  répétitifs non conversationnels (flux MoltBots, plugins) sont mis en cache
  localement (`LAURA_CACHE_TTL_MS`, 60s par défaut). Pour la revue de code,
  configure `MISTRAL_MODEL=codestral-latest` côté serveur (ajouté à la liste
  des modèles autorisés).
- **Mode 100% local avec Ollama** : si `MISTRAL_API_KEY` n'est pas défini,
  configure `OLLAMA_MODEL=<modèle>` (ex: `laura-local`, voir `ollama list`)
  côté serveur — `/api/chat/stream` bascule alors automatiquement sur ton
  instance Ollama locale (`OLLAMA_URL`, défaut `http://localhost:11434`),
  conversion NDJSON → SSE transparente pour le client. Chat 100% hors-ligne,
  zéro clé API, zéro latence réseau.
- `/install <nom>` : recherche en lecture seule (registre npm + GitHub) puis
  Laura propose la commande d'installation exacte — **elle ne télécharge ni
  n'exécute jamais rien elle-même**, c'est toi qui valides et lances.
- Affiche en filigrane un flux "MoltBots" en arrière-plan (mode `social` du
  bridge, désactivable avec `LAURA_FEED_DISABLED=true`).
- Supporte des plugins déposés dans `terminal-plugins/*.mjs` (`/plugins`,
  `/run <nom>`) — voir `terminal-plugins/README.md` pour la convention et la
  roadmap des connecteurs externes (ssh-ai-chat, Second-Me, bluesky-video,
  wp-malware-scanner, bookish-octo-invention, chroma, MoltBots…).

## Build de production

```bash
npm run build
npm run serve
```

Le site statique est servi sur le port 3000. Il faut lancer le serveur API séparément et reverse-proxy `/api` vers lui quand tu veux le chat + RAG en production.

## Install Laura CLI

Laura is primarily useful as a terminal companion. The recommended path is the
Go CLI in `cmd/laura`: it has the clean package layout, bridge mode, version
metadata, local progress, and the maintained flags.

### Fast Install

Install directly with Go:

```bash
go install github.com/Kvnbbg/Laura/cmd/laura@latest
```

Make sure Go's binary directory is on your `PATH`:

```bash
export PATH="$(go env GOPATH)/bin:$PATH"
```

Persist that path for future shells:

```bash
printf '\nexport PATH="$(go env GOPATH)/bin:$PATH"\n' >> ~/.bashrc
source ~/.bashrc
```

Verify the install:

```bash
laura --version
laura --help
```

### Build From Source

Clone the public repository and build the production command:

```bash
git clone https://github.com/Kvnbbg/Laura.git
cd Laura
go test ./...
go build -trimpath -ldflags="-s -w" -o bin/laura ./cmd/laura
./bin/laura --help
```

Install it as a local command:

```bash
mkdir -p ~/.local/bin
go build -trimpath -ldflags="-s -w" -o ~/.local/bin/laura ./cmd/laura
export PATH="$HOME/.local/bin:$PATH"
laura --version
```

Persist `~/.local/bin`:

```bash
printf '\nexport PATH="$HOME/.local/bin:$PATH"\n' >> ~/.bashrc
source ~/.bashrc
```

### Run Without Installing

From the repository root:

```bash
go run ./cmd/laura
```

### Common Commands

```bash
laura
laura --help
laura --version
laura --world css
laura --stats
laura --reset
laura --no-color
laura --bridge --bridge-command "goto add" --bridge-source terminal --bridge-target web
```

### Update

```bash
go install github.com/Kvnbbg/Laura/cmd/laura@latest
```

### Uninstall

```bash
rm -f "$(go env GOPATH)/bin/laura" ~/.local/bin/laura
```

### Bridge Go -> TechAndStream

The production Go CLI can emit the public-safe MatrixCitizen bridge payload used
by the web app and terminal plugin:

```bash
go run ./cmd/laura --bridge --bridge-command "goto add" --bridge-source terminal --bridge-target web
```

The JSON is safe to hand to OpenClaw `main` or POST to the Laura API endpoint
`/api/bridge/matrix-progress`. It only carries reviewed public metadata,
deterministic MatrixCitizen progress, Techandstream HTTPS routes, and an
OpenClaw hint that Crestodian is setup/status-only while repo work belongs to
the main agent.

### Legacy Terminal Entry

`laura_quest_main.go` is kept for older local experiments. New CLI work should
prefer `cmd/laura`.

## Pont terminal

Laura inclut aussi un mode compagnon en terminal. Il réutilise le même format de payload que la web app et peut pointer vers n'importe quel backend compatible.

```bash
go run laura_quest_main.go
go run laura_quest_main.go chat
```

Commande locale optionnelle:

```bash
mkdir -p ~/.local/bin
go build -trimpath -ldflags="-s -w" -o ~/.local/bin/laura laura_quest_main.go
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
laura
```

Variables d'environnement:

| Variable | Purpose |
| --- | --- |
| `LAURA_BASE_URL` | Base URL pour un endpoint relatif (par défaut `http://localhost:4000`) |
| `LAURA_CHAT_ENDPOINT` | Chemin ou URL complète du chat (par défaut `/api/chat`) |
| `LAURA_WEB_URL` | Surface web référencée dans le prompt système |
| `LAURA_PERSONA` | Persona personnalisée pour le pont terminal |

Examples:

```bash
go run laura_quest_main.go chat
LAURA_BASE_URL=https://techandstream.com LAURA_CHAT_ENDPOINT=/api/chat go run laura_quest_main.go chat
LAURA_WEB_URL=https://techandstream.com LAURA_PERSONA="Laura is a professional AI companion..." go run laura_quest_main.go chat
```

## Configuration

Environment variables are loaded via Vite. Copy `.env.example` and adjust as needed:

```bash
cp .env.example .env
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_APP_NAME` | No | App name displayed in the footer |
| `VITE_CONTACT_ENDPOINT` | No | API endpoint for contact form submissions |
| `VITE_CONTACT_TIMEOUT_MS` | No | Timeout (ms) for contact form requests |
| `VITE_ENABLE_CHAT` | Yes (for chat UI) | Feature flag for chat widget (`true`/`false`) |
| `VITE_MISTRAL_MODEL` | No | Public display/default model hint only; the server chooses the provider |
| `VITE_CHAT_ENDPOINT` | No | Override the chat API endpoint (default `/api/chat`) |
| `VITE_CHAT_TIMEOUT_MS` | No | Timeout (ms) for chat requests |
| `MISTRAL_API_KEY` | Yes (server, unless using Ollama) | Server-side Mistral API key |
| `MISTRAL_MODEL` | No (server) | Server-side chat model override |

`VITE_*` variables are bundled into the browser. Do not put provider API keys,
tokens, private endpoints, prompts, or credentials in any `VITE_*` value. Chat
provider credentials belong only in the Node server environment.

Si `VITE_ENABLE_CHAT=true` mais que le modèle public est invalide, l'interface
affiche une erreur claire et laisse le chat désactivé. Si le serveur n'a pas de
clé `MISTRAL_API_KEY` et pas de `OLLAMA_MODEL`, `/api/chat` répond avec le mode
local: liens cliquables, dialogue court, commandes sûres et snippets.

## Daily Mistral + no-key fallback

Laura supports two daily modes:

- **Mistral mode**: set server-only `MISTRAL_API_KEY`, run `npm run dev:server`,
  then use the chat normally for planning, code review, snippets, summaries, and
  document-grounded answers.
- **Local fallback mode**: leave `MISTRAL_API_KEY` unset. `/api/chat` returns a
  deterministic local response with clickable Techandstream/GitHub links,
  short dialogue prompts, safe commands, and code snippets. No provider call is
  attempted.

If the local API itself is unavailable, the browser chat still provides a local
fallback answer so users are not blocked by missing API setup.

## Pièces jointes + RAG

- Upload TXT or Markdown files in the chat widget.
- Le serveur découpe le contenu, construit les embeddings et récupère les passages les plus pertinents pour chaque prompt.
- Les documents sont isolés par session navigateur, limités, expirent en mémoire, et sont rejetés si un motif de secret est détecté.
- Laura cite les sources au format `[DocName • chunk 3]`.
- Utilise **Delete my documents** pour effacer les données stockées.

## Activité Moltbook et `french-dev-ai-tools`

Laura reçoit aussi des clins d'œil à l'activité Moltbook de `french-dev-ai-tools`. Le terminal bridge peut mentionner cette activité dans ses réponses pour garder le lien entre:

- le blog
- le forum
- les chats
- les bots de l'écosystème Laura

Quand les MoltBots parlent d'interface sur MoltBook ou Techandstream, le cadrage reste KISS: `Card`, `Accordion`, `Modal`, `Drawer`, `Toast`, `Skeleton`, `Badge`, `Table`, `Pagination`, `Breadcrumb`.

## CLI Usage Examples

```bash
npm run dev        # start Vite dev server
npm run dev:server # start the Mistral proxy + RAG server
npm run lint       # run ESLint
npm run test       # run Vitest suite
npm run build      # typecheck + build production assets
npm run provenance:check # verify author, license, NOTICE, and bridge provenance
npm run serve      # serve the built assets via sirv
```

## API Usage Example (Contact Endpoint)

Configure an API endpoint that accepts JSON:

```bash
curl -X POST https://api.example.com/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Astra","email":"astra@example.com","message":"Hello"}'
```

## Project Structure

```
.
├── server/                 # Mistral proxy + RAG endpoints
├── src/
│   ├── components/         # Layout + chat widget
│   ├── config/             # Typed env config
│   ├── pages/              # Home/About/Contact/Chat routes
│   ├── services/           # Contact + Mistral + document services
│   ├── styles/             # SCSS design system
│   ├── utils/              # Logger + error helpers
│   ├── App.tsx             # App routes
│   └── main.tsx            # Entry point
├── index.html
└── vite.config.ts
```

## Troubleshooting

- **Chat disabled**: Ensure `VITE_ENABLE_CHAT=true`; provider keys stay server-side in `MISTRAL_API_KEY`.
- **No citations**: Upload files and ensure the server is running on port 4000.
- **Contact form fails**: Verify `VITE_CONTACT_ENDPOINT` is reachable and accepts JSON.
- **Unexpected crashes**: The error boundary will surface the error; review console logs for details.
- **Terminal bridge fails**: Confirm the endpoint returns the same `{ message, citations }` shape as `/api/chat`.

## Security Notes

- Do not commit real API keys to `.env` files.
- Use `MISTRAL_API_KEY` only on the server and reverse-proxy `/api` to avoid exposing secrets.
- Never create `VITE_*_API_KEY`, `VITE_*_SECRET`, or `VITE_*_TOKEN` values.
- Set `LAURA_ALLOWED_ORIGINS` in production and keep document uploads session-scoped.
- Run `npm run check:security` before publishing open-source releases.
- Keep `LICENSE`, `NOTICE`, `AUTHORS.md`, `CITATION.cff`, and package metadata intact when redistributing.
- Use HTTPS endpoints for `VITE_CONTACT_ENDPOINT` in production.
- Review `SECURITY.md` for coordinated disclosure guidance.

## Contributing Workflow

1. Fork the repo and create a feature branch.
2. Run `npm run lint` and `npm run test` before submitting.
3. Open a PR with a clear summary and screenshots (if UI changes).

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

Apache-2.0. See [LICENSE](LICENSE), [NOTICE](NOTICE), and [AUTHORS.md](AUTHORS.md).
