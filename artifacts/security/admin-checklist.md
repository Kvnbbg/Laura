# Cybersecurity Administration Checklist — Laura

Quick operational checklist derived from `cybersecurity-administration-tools.md`.

## Daily / Pre-Commit
- [ ] No `.env*` or plaintext secrets staged
- [ ] Terminal plugins remain read-only by default
- [ ] Public MoltBot content contains only approved public signals

## Weekly / Pre-Release
- [ ] `npm run check:security` passes
- [ ] Dependency and CI security workflow green
- [ ] Vault / OIDC token health verified (no expired long-lived credentials)

## Quarterly
- [ ] Secret rotation (Railway, provider keys) executed via Vault
- [ ] Branch-protection and CODEOWNERS review
- [ ] RAG isolation and session-scoped retrieval re-validated
- [ ] Incident-response contact path still functional

## After Any Suspected Exposure
- [ ] Rotate affected credentials immediately
- [ ] Revoke old tokens
- [ ] Audit logs for access patterns
- [ ] Confirm no private data reached public surfaces

---
*Non-disruptive checklist. Use with the full tools document.*
