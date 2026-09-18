# Laura — component integration map

This is the wiring plan for the existing application. Components are grouped by responsibility so missing connections can be repaired without replacing working UI.

## UI layer

| Component area | Connect to | Contract |
|---|---|---|
| App shell/navigation | React Router | route ownership only |
| Home surface | local state/services | no provider secret |
| About surface | static content | no runtime dependency |
| Contact surface | contact service | timeout + error state |
| Chat launcher | chat state | open/close + session continuity |
| Chat full page | chat service | `/api/chat` |
| Streaming renderer | stream service | SSE delta + DONE |
| Attachment picker | document service | TXT/Markdown only |
| Citation list | chat response | `citations[]` |
| Error boundary | logger/fallback UI | never expose secrets |
| Loading skeleton | async surfaces | visual-only state |
| Toast/notice | mutation results | concise public-safe message |

## Service layer

| Service | Backend |
|---|---|
| Chat service | `POST /api/chat` |
| Stream service | `POST /api/chat/stream` |
| Document service | `GET/POST/DELETE /api/documents` |
| Contact service | configured contact endpoint |
| Bridge adapter | `POST /api/bridge/matrix-progress` |
| Health probe | `GET /api/health` |

## Terminal layer

- Go CLI → chat endpoint
- Go CLI → stream endpoint
- Go bridge → Matrix progress endpoint
- terminal plugins → explicit user-invoked actions
- local Ollama → stream fallback

## Integration components to wire next

1. **HealthIndicator** — disable provider-dependent controls when API is unavailable.
2. **ChatTransport** — one transport abstraction for normal + stream modes.
3. **DocumentSessionBadge** — expose session state without exposing the session ID.
4. **CitationPanel** — render RAG provenance independently from message text.
5. **StreamStatus** — connecting/streaming/completed/error.
6. **BridgeTrustBadge** — display trusted/manual-review state only.
7. **ProviderModeBadge** — Mistral/Ollama/local fallback.
8. **UploadGuardMessage** — distinguish type/size/secret rejection.
9. **RetryAction** — retry only idempotent requests.
10. **ErrorBoundaryPanel** — recover the UI without reloading the entire app.
11. **TerminalConnectionIndicator** — show API reachability.
12. **PluginPermissionPanel** — keep plugin execution explicitly user initiated.

## Wiring rule

A component should depend on a typed service contract, not directly on `fetch`. This keeps provider changes and endpoint changes localized.

## Non-goals

Do not add a global state framework merely to connect these components. React local state plus small services is sufficient until measured complexity proves otherwise.
