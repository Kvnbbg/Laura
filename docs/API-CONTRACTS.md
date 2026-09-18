# Laura — API contracts

## Scope

This document is the integration boundary for the React client, terminal CLI, Node API and external bridge surfaces. It deliberately describes existing routes; it does not introduce a new API.

## Runtime routes

| Route | Method | Purpose | Dependency |
|---|---|---|---|
| `/api/health` | GET | liveness/model metadata | none |
| `/api/chat` | POST | normal chat + optional RAG | Mistral or deterministic local fallback |
| `/api/chat/stream` | POST | SSE chat | Mistral, Ollama, or deterministic fallback |
| `/api/documents` | GET | list session documents | in-memory store |
| `/api/documents` | POST | TXT/Markdown ingestion | embeddings when provider is enabled |
| `/api/documents` | DELETE | clear session documents | in-memory store |
| `/api/bridge/matrix-progress` | POST | public-safe progress bridge | deterministic validation |

## Shared request rules

- JSON endpoints use the server request-body limit.
- Browser origins are allowlisted.
- Document routes require `X-Laura-Session`.
- Chat messages require string `content`.
- Provider secrets remain server-side.
- Uploaded credentials/secrets are rejected rather than indexed.
- Matrix publishing remains manual-review-only.

## Chat response contract

The stable top-level fields are:

- `message.role`
- `message.content`
- `citations`
- `thinkingFeedback`
- `agentHints`
- `nextActions`
- `networkThoughts`
- `bridge`

Consumers should ignore unknown fields so the server can add metadata without breaking older clients.

## Stream contract

The stream is Server-Sent Events. Each content chunk uses:

`data: {"choices":[{"delta":{"content":"..."}}]}`

and terminates with:

`data: [DONE]`

The client must tolerate chunk boundaries that split JSON or text and must close the stream on completion.

## Document contract

The session header format is deliberately opaque to clients. Clients only need to generate a sufficiently random stable identifier and send it as `X-Laura-Session`.

Accepted uploads are text/Markdown. Executable extensions, empty files, oversized content and detected credentials are rejected.

## Matrix bridge contract

A trusted progress envelope requires:

- `matrixProgress.contract = "laura-bridge-progress-v1"`
- `bridgeSecurity.publicOrigin = "https://techandstream.com"`
- `bridgeSecurity.targetRepository = "french-dev-ai-tools"`
- `bridgeSecurity.writeMode = "manual-publish-only"`

The bridge is an integration surface, not an automatic publishing authority.

## Compatibility rules

1. Add fields before changing/removing fields.
2. Preserve HTTP status semantics.
3. Keep local fallback deterministic.
4. Never require an external provider for health or contract tests.
5. Treat unknown bridge metadata as untrusted.
