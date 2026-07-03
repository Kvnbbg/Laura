# Authorship And Provenance

Laura is open source under Apache-2.0. That means people can use, study, fork,
modify, and redistribute the code when they follow the license. It does not
mean they can strip attribution, remove the NOTICE file from redistributions,
or present modified work as an official Kevin Marville / Techandstream release.

## Provenance Signals

- `LICENSE` is Apache-2.0.
- `NOTICE` identifies the original Laura work and must be retained in covered
  redistributions.
- `AUTHORS.md` names the original author and maintainer.
- `CITATION.cff` gives tools and researchers a structured citation.
- `.github/CODEOWNERS` keeps repository review ownership explicit.
- `package.json` exposes `author`, `license`, `repository`, `homepage`, and
  `bugs` metadata to npm and scanners.
- The Go CLI and public bridge payload include the source repository and
  author notice.

## What To Do If Attribution Is Removed

1. Save the URL, commit hash, package version, or release artifact.
2. Compare it with this repository using `git log`, release tags, or package
   metadata.
3. Ask the distributor to restore `LICENSE`, `NOTICE`, and attribution.
4. Use the platform's copyright or license-compliance process if the distributor
   refuses.

This document is operational guidance, not legal advice.

## Maintainer Check

Run this before release:

```bash
npm run provenance:check
```
