# Secrets Management Plan

## Goals
- Centralize management of Railway deployment tokens and third-party API keys.
- Remove plaintext secrets from GitHub repository and developer machines.

## Tooling Selection
- Adopt **HashiCorp Vault Cloud** as the primary secrets manager.
- Use GitHub Actions OIDC federated credentials to obtain short-lived Vault tokens via JWT authentication.
- Provide a lightweight fallback for local development via `.env.local` files encrypted with `sops` + age.

## Implementation Steps
1. **Provision Vault Namespaces**
   - Create namespaces: `development`, `staging`, `production`.
   - Enable KV v2 secrets engine under `kv/frontend` path per namespace.

2. **Define Access Policies**
   - `frontend-ci` policy: read-only access to `kv/frontend/railway` and `kv/frontend/analytics` secrets.
   - `frontend-dev` policy: read/write in `development`, read-only in `staging`.
   - Map GitHub teams to Vault policies using Terraform infrastructure-as-code stored in `infra/vault` (new repo).

3. **Integrate with GitHub Actions**
   - Configure Vault GitHub auth method with repository `Kvnbbg/Laura` and workflow `Modernized CI/CD`.
   - Use `hashicorp/vault-action@v2` in the workflow to fetch `RAILWAY_API_TOKEN`, `RAILWAY_SERVICE_ID`, analytics keys, etc.
   - Inject secrets as environment variables scoped to deployment jobs only.

4. **Developer Tooling**
   - Provide npm script `npm run secrets:login` to open Vault CLI session via GitHub SSO.
   - Add pre-commit hook to prevent committing `.env*` files or plaintext tokens.
   - Document `sops` workflow for updating encrypted `.env.local.enc`.

5. **Auditing & Rotation**
   - Enable Vault audit device streaming to a centralized logging sink (Grafana Loki).
   - Rotate Railway tokens every 90 days using scheduled GitHub Action with Vault role `railway-rotator`.
   - Enforce automatic revocation of tokens when GitHub Action run completes.

## Success Criteria
- No long-lived secrets stored in GitHub or Railway environment variables.
- Ability to revoke compromised credentials within 5 minutes via Vault.
- Audit trails for all secret access, linked to GitHub user identity.
