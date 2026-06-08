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

## Prerequisites

- Node.js 18+ (see `.nvmrc`)
- npm 9+ (or compatible)

## Installation

```bash
npm install
```

Si tu veux aussi le moteur terminal et le pont, installe Go 1.22+ puis lance-le directement:

```bash
go run laura_quest_main.go
go build -o laura laura_quest_main.go
./laura
```

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

## Laura Quest CLI

Commande de prod:

```bash
go run ./cmd/laura
```

Binaire local:

```bash
go build -o bin/laura ./cmd/laura
./bin/laura
```

Installation locale:

```bash
go build -o ~/.local/bin/laura ./cmd/laura
laura
```

Ou via `go install`:

```bash
go install github.com/Kvnbbg/Laura/cmd/laura@latest
```

Flags disponibles:

```bash
laura --world css
laura --stats
laura --reset
laura --no-color
laura --version
laura --help
```

## Pont terminal

Laura inclut aussi un mode compagnon en terminal. Il réutilise le même format de payload que la web app et peut pointer vers n'importe quel backend compatible.

```bash
go run laura_quest_main.go
go run laura_quest_main.go chat
```

Commande locale optionnelle:

```bash
mkdir -p ~/.local/bin
go build -o ~/.local/bin/laura laura_quest_main.go
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
| `VITE_ENABLE_CHAT` | Yes (for chat) | Feature flag for chat widget (`true`/`false`) |
| `VITE_MISTRAL_API_KEY` | Yes (for chat) | Required when chat is enabled (client validation) |
| `VITE_MISTRAL_MODEL` | No | `mistral-small` (default), `mistral-medium`, or `mistral-large` |
| `VITE_CHAT_ENDPOINT` | No | Override the chat API endpoint (default `/api/chat`) |
| `VITE_CHAT_TIMEOUT_MS` | No | Timeout (ms) for chat requests |
| `MISTRAL_API_KEY` | Yes (server) | Server-side Mistral API key (preferred) |
| `MISTRAL_MODEL` | No (server) | Server-side chat model override |

Si `VITE_ENABLE_CHAT=true` mais que `VITE_MISTRAL_API_KEY` manque ou que le modèle est invalide, l'interface affiche une erreur claire et laisse le chat désactivé.

## Pièces jointes + RAG

- Upload TXT or Markdown files in the chat widget.
- Le serveur découpe le contenu, construit les embeddings et récupère les passages les plus pertinents pour chaque prompt.
- Laura cite les sources au format `[DocName • chunk 3]`.
- Utilise **Delete my documents** pour effacer les données stockées.

## Activité Moltbook et `french-dev-ai-tools`

Laura reçoit aussi des clins d'œil à l'activité Moltbook de `french-dev-ai-tools`. Le terminal bridge peut mentionner cette activité dans ses réponses pour garder le lien entre:

- le blog
- le forum
- les chats
- les bots de l'écosystème Laura

## CLI Usage Examples

```bash
npm run dev        # start Vite dev server
npm run dev:server # start the Mistral proxy + RAG server
npm run lint       # run ESLint
npm run test       # run Vitest suite
npm run build      # typecheck + build production assets
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

- **Chat disabled**: Ensure `VITE_ENABLE_CHAT=true` and `VITE_MISTRAL_API_KEY` are set.
- **No citations**: Upload files and ensure the server is running on port 4000.
- **Contact form fails**: Verify `VITE_CONTACT_ENDPOINT` is reachable and accepts JSON.
- **Unexpected crashes**: The error boundary will surface the error; review console logs for details.
- **Terminal bridge fails**: Confirm the endpoint returns the same `{ message, citations }` shape as `/api/chat`.

## Security Notes

- Do not commit real API keys to `.env` files.
- Prefer `MISTRAL_API_KEY` on the server and reverse-proxy `/api` to avoid exposing secrets.
- Use HTTPS endpoints for `VITE_CONTACT_ENDPOINT` in production.
- Review `SECURITY.md` for coordinated disclosure guidance.

## Contributing Workflow

1. Fork the repo and create a feature branch.
2. Run `npm run lint` and `npm run test` before submitting.
3. Open a PR with a clear summary and screenshots (if UI changes).

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

Apache-2.0. See [LICENSE](LICENSE).
