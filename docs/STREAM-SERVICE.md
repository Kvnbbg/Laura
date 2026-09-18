# Laura — SSE stream service

`src/services/streamService.ts` restores the frontend half of the documented `/api/chat/stream` contract.

## Contract

- `POST /api/chat/stream`
- JSON body: `{ "messages": [...] }`
- session header is forwarded through the existing document-session helper
- SSE payloads are read from `data:` lines
- OpenAI/Mistral-compatible delta: `choices[0].delta.content`
- `data: [DONE]` terminates the stream
- malformed SSE JSON is ignored rather than rendered as assistant text
- timeout is bounded by `chatTimeoutMs`

## Safety

The service does not expose provider credentials, does not execute streamed content, and does not bypass the existing document-session boundary.

## Integration rule

`ChatWidget` may adopt this transport incrementally. The existing `/api/chat` path remains the stable fallback and is not removed by this component.
