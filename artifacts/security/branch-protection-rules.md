# Branch Protection Rules

Apply these rules to `main` and `develop` branches via GitHub repository settings.

## Required Status Checks
- `Lint, Test, Build` job from `Modernized CI/CD` workflow must pass.
- `SAST & Dependency Scanning` job from the same workflow must pass.
- Require branches to be up to date before merging.

## Review Requirements
- Minimum of **2 approvals** from code owners defined in `CODEOWNERS`.
- Dismiss stale approvals when new commits are pushed.
- Require review from security team (`@cosmic-dream/security`) for any changes touching `src/`, `artifacts/security/`, or infrastructure files.

## Commit Hygiene
- Enforce **signed commits** (GPG or SSH signatures).
- Block force pushes and deletions on protected branches.
- Require linear history to encourage small, incremental merges.

## Additional Settings
- Enable status check for `dependency-review` to catch vulnerable packages.
- Enable secret scanning and push protection.
- Restrict who can push to `main` to the release engineering group.
