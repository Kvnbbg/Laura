# Laura - Cosmic Dream React App

Laura is a TypeScript + React single-page app that showcases a cosmic-inspired UI for an AI companion brand. It is optimized for fast iteration with Vite, SCSS styling, and modern routing.

## Product Scope

- **Audience**: Designers and developers who want a polished, themed front-end.
- **Core flows**: Home overview, About narrative, and Contact form submission.
- **Runtime**: Static SPA (deployable on any static host).

## Features

- React 18 + TypeScript with strict checks
- Vite for fast dev/build pipelines
- SCSS-based design system (`src/styles/`)
- Client-side routing with React Router
- Contact form with configurable delivery endpoint
- Error boundary + structured logging for safer UX

## Prerequisites

- Node.js 18+ (see `.nvmrc`)
- npm 9+ (or compatible)

## Installation

```bash
npm install
```

## Running Locally

```bash
npm run dev
```

Open http://localhost:5173

## Production Build

```bash
npm run build
npm run preview
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

If `VITE_CONTACT_ENDPOINT` is not set, the contact form runs in local-only simulation mode.

## CLI Usage Examples

```bash
npm run dev      # start Vite dev server
npm run lint     # run ESLint
npm run test     # run Vitest suite
npm run build    # typecheck + build production assets
npm run serve    # serve the built assets via sirv
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
├── .github/workflows/ci.yml   # CI pipeline
├── src/
│   ├── components/            # Layout + error boundary
│   ├── config/                # Typed env config
│   ├── pages/                 # Home/About/Contact/NotFound routes
│   ├── services/              # Contact form service
│   ├── styles/                # SCSS design system
│   ├── utils/                 # Logger + error helpers
│   ├── App.tsx                # App routes
│   └── main.tsx               # Entry point
├── index.html
└── vite.config.ts
```

## Troubleshooting

- **Blank page**: Ensure `npm run dev` is running and check the console for errors.
- **Contact form fails**: Verify `VITE_CONTACT_ENDPOINT` is reachable and accepts JSON.
- **Unexpected crashes**: The error boundary will surface the error; review console logs for details.

## Security Notes

- Do not commit real API keys to `.env` files.
- Use HTTPS endpoints for `VITE_CONTACT_ENDPOINT` in production.
- Review `SECURITY.md` for coordinated disclosure guidance.

## Contributing Workflow

1. Fork the repo and create a feature branch.
2. Run `npm run lint` and `npm run test` before submitting.
3. Open a PR with a clear summary and screenshots (if UI changes).

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

Apache-2.0. See [LICENSE](LICENSE).
