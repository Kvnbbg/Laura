# Laura — release checklist

## Web

- [ ] Node version matches `.nvmrc`.
- [ ] `npm run lint`
- [ ] `npm run test -- --run`
- [ ] `npm run build`
- [ ] `npm run security:scan`
- [ ] `npm run test:server-security`
- [ ] `npm run test:server-integration`

## Go

- [ ] `go vet ./cmd/laura ./internal/...`
- [ ] `go test ./cmd/laura ./internal/...`
- [ ] `go build -trimpath -ldflags="-s -w" -o /tmp/laura ./cmd/laura`

## Runtime

- [ ] Health endpoint responds.
- [ ] Local fallback works without provider credentials.
- [ ] Stream emits SSE and `[DONE]`.
- [ ] Document session is required.
- [ ] Secret-containing uploads are rejected.
- [ ] Matrix bridge rejects untrusted envelopes.
- [ ] Matrix publication remains manual-review-only.

## Security

- [ ] No provider secret appears in `VITE_*`.
- [ ] No generated artifact contains credentials.
- [ ] Origin allowlist remains explicit.
- [ ] Upload limits remain bounded.
- [ ] Rate limiting remains enabled.

## Documentation

- [ ] API contracts match server behavior.
- [ ] Component map identifies every new integration.
- [ ] Repair matrix records intentionally deferred work.
- [ ] README commands remain executable.
