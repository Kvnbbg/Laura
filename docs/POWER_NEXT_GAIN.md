# Laura — Power / Energy / Time Contract

## Objective
Keep the web UI, Node bridge, RAG path, and Go CLI on one verified contract.

## Data → code contract
- Web chat uses `/api/chat` and may stream through `/api/chat/stream`.
- CLI bridge emits reviewed public metadata only.
- RAG documents remain session-scoped and must never expose provider secrets.
- Provider credentials stay server-side; `VITE_*` values are public.

## Required verification
1. `npm ci`
2. `npm run lint`
3. `npm test -- --run`
4. `npm run build`
5. `go test ./...`
6. provenance/security files remain present.

## Next gain
Prefer repairing a failing contract or missing file over adding another feature.
