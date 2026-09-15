# Cybersecurity Administration Tools — Laura

**Status:** Additive documentation and reference toolkit (no production mutation)
**Audience:** Maintainers, operators, and agent swarms interacting with Laura
**Alignment:** Extends existing `SECURITY.md`, `docs/SECURITY_GUARDRAILS.md`, and `artifacts/security/` plans.

## Purpose

This document catalogues practical cybersecurity administration tools and patterns suitable for the Laura project (terminal + web forge, MoltBot conversations, Railway deployments). Tools are selected for:

- Open-source or widely available options
- Compatibility with ANSSI-style hygiene already documented in the repository
- Non-disruptive administration (audit, inventory, dry-run, least-privilege)
- Support for both human operators and agent-map-swarm style automation

## Core Administration Categories

### 1. Secrets & Credential Administration
- **Primary plan:** already documented in `artifacts/security/secrets-management-plan.md` (HashiCorp Vault + OIDC + sops fallback).
- **Additional tools:**
  - `sops` + age for local encrypted `.env.local.enc`
  - GitHub Actions OIDC → short-lived tokens (no long-lived PATs in CI)
  - Pre-commit hooks rejecting `.env*` and common secret patterns
- **Admin actions:** rotate every 90 days, revoke on demand, audit every access.

### 2. Access Control & Identity Administration
- Branch protection rules (see `artifacts/security/branch-protection-rules.md`)
- CODEOWNERS enforcement
- Least-privilege GitHub teams mapped to Vault policies
- Session-scoped RAG isolation (already enforced in security guardrails)

### 3. Configuration & Compliance Administration
- `npm run check:security` as the canonical release gate
- Static analysis and dependency review in `.github/workflows/security.yml`
- Inventory of public vs private surfaces (MoltBot public-safe boundary)
- Regular review of terminal-plugin permissions (read-only by default)

### 4. Logging, Monitoring & Audit Administration
- Vault audit device → centralized sink (Grafana Loki recommended)
- CI security workflow results retained as artifacts
- No private terminal history or RAG uploads published as MoltBot content
- Structured logging that never includes secrets or local paths in public payloads

### 5. Incident Response & Hardening Administration
- Private vulnerability reporting path (GitHub private reporting preferred)
- Placeholder-only reproduction for reports
- Credential rotation checklist after any suspected exposure
- Deterministic local fallbacks when external AI providers are unavailable

## Recommended Toolchain (2026)

| Domain                    | Tool / Pattern                          | Role in Laura                          |
|---------------------------|-----------------------------------------|----------------------------------------|
| Secrets                   | HashiCorp Vault + OIDC + sops           | Central credential store               |
| IaC / Policy              | OpenTofu / Pulumi (dry-run)             | Infrastructure proposals only          |
| Static analysis           | Existing `check:security` + CI workflow | Release gate                           |
| Dependency hygiene        | Dependabot / Renovate + security.yml    | Continuous review                      |
| Audit trail               | Vault audit + CI artifacts              | Non-repudiation                        |
| Terminal plugins          | Read-only default + explicit confirm    | Safe plugin administration             |
| Agent swarms              | No-disturb loops (see french-dev-ai-tools) | Advisory analysis only              |

## Administration Playbooks (No-Disturb)

1. **Secret rotation playbook**
   - Generate new token in Vault
   - Update Railway / CI via OIDC short-lived injection
   - Revoke old token
   - Verify no plaintext remains in git history or logs

2. **Plugin permission review**
   - List all files under `terminal-plugins/`
   - Confirm each is read-only by default
   - Require explicit user confirmation for any write or shell action

3. **Public surface audit**
   - Verify MoltBot outputs contain only public registry / docs / user-provided text
   - Reject any payload that could contain credentials, private paths, or upload content

4. **Release security gate**
   ```bash
   npm run check:security
   npm run lint
   npm test -- --run
   npm run check:go
   ```

## Integration with Agent Swarms

These administration tools are designed to be consumable by agent-map-swarms under a strict **no-disturb** contract:

- Agents may inventory, analyse, and propose documentation or PR-style changes.
- Agents must never receive long-lived write credentials.
- All recommendations materialise as version-controlled files or reviewable PRs.

Cross-reference: `french-dev-ai-tools/docs/agent-map-swarms/` for the corresponding loop files.

## Success Criteria

- Zero long-lived secrets in the repository or CI environment variables.
- All administrative actions are auditable and reversible.
- Public MoltBot surface remains free of private data.
- Security release checks pass before any tag or production deploy.

---
*Additive cybersecurity administration toolkit for Laura. Aligns with existing SECURITY.md and guardrails.*
