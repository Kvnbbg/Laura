# Security Policy

Laura is open source, but provider credentials, user uploads, private prompts,
terminal logs, and deployment details are not public artifacts.

## Supported Versions

Security fixes target the `main` branch and the latest tagged release. Older
experimental snapshots are not supported unless a maintainer explicitly marks
them as supported.

## Reporting A Vulnerability

Use GitHub private vulnerability reporting if it is enabled on the repository.
If private reporting is not available, open a minimal public issue that says a
security report is available and wait for maintainer contact. Do not publish
working exploits, live credentials, private uploads, or screenshots containing
secrets in a public issue.

Include:

- affected commit, tag, or deployment target,
- the component involved (`server`, `src`, `cmd/laura`, `terminal-plugins`, or
  docs/public assets),
- impact and reproduction steps using placeholders,
- whether any secret, upload, or user data may have been exposed.

## Maintainer Response

The maintainer should acknowledge valid reports, reproduce with placeholders,
patch in a private branch when needed, rotate any exposed credentials, and only
publish details after a fix is available.

## In Scope

- Server-side provider key handling.
- Browser bundle leaks.
- RAG upload isolation and deletion.
- Public bridge payloads for OpenClaw, french-dev-ai-tools, and Techandstream.
- Terminal plugin behavior that could expose local files, credentials, or raw
  logs.

## Out Of Scope

- Generic dependency advisories without a Laura-specific exploit path.
- Social engineering, spam, or denial-of-service against unrelated third-party
  services.
- Claims that require private production access without maintainer approval.

## Release Checks

Run these before publishing:

```bash
npm run check:security
npm run lint
npm test -- --run
npm run check:go
```
