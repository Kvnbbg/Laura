# Laura - Cosmic Dream React App

Laura is a TypeScript + React single-page app that showcases a cosmic-inspired UI for an AI companion brand. It is optimized for fast iteration with Vite, SCSS styling, and modern routing. This version includes an embedded Mistral AI chat widget with attachments + RAG.

## Product Scope

- **Audience**: Designers and developers who want a polished, themed front-end.
- **Core flows**: Home overview, About narrative, Contact form submission, and Mistral chat.
- **Runtime**: Static SPA plus a lightweight Node API proxy for Mistral + document retrieval.

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

## Running Locally

Start the API proxy (port 4000) and the Vite dev server (port 5173):

```bash
npm run dev:server
npm run dev
```

Open http://localhost:5173

## Production Build

```bash
npm run build
npm run serve
```

The static site will be served on port 3000. You must run the API server separately (and reverse-proxy `/api` to it) when you need chat + RAG in production.

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

If `VITE_ENABLE_CHAT=true` but `VITE_MISTRAL_API_KEY` is missing or the model is invalid, the UI will show a friendly error and keep chat disabled.

## Attachments + RAG

- Upload TXT or Markdown files in the chat widget.
- The server chunks content, builds embeddings, and retrieves top matches for each user prompt.
- Laura will cite sources in the format `[DocName • chunk 3]`.
- Use **Delete my documents** to clear stored data.

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
