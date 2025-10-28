# DORA Metrics Implementation Plan

## Metric Definitions
- **Deployment Frequency:** Count successful `release` job runs to `main` branch per week.
- **Lead Time for Changes:** Measure time from PR creation to production deployment event.
- **Change Failure Rate:** Ratio of incidents (failed deploys or hotfix rollbacks) to total deploys.
- **Mean Time to Restore (MTTR):** Duration from incident detection to resolution (new deploy or feature flag rollback).

## Data Collection
1. **GitHub Actions API**
   - Use scheduled workflow to query `actions/runs` for `Modernized CI/CD`.
   - Extract timestamps for workflow start/end, job outcomes, and artifacts.

2. **Railway Deployment Events**
   - Poll Railway GraphQL API for deployment results and failure reasons.
   - Store event payloads in DynamoDB table `laura-deploy-events` keyed by workflow run ID.

3. **Incident Tracking**
   - Integrate with PagerDuty Events API to log incidents triggered by observability alerts.
   - Tag incidents with `service:laura-frontend` for filtering.

## Automation Script
- Implement TypeScript CLI under `tools/dora-metrics` using `octokit` and `graphql-request` packages.
- Output metrics to JSON and push to `metrics/dora-history/YYYY-MM-DD.json` in a separate analytics repository.
- Publish weekly summary to Slack via webhook and update Grafana dashboard using `grafana-api`.

## Governance
- Assign Platform Engineering as maintainers of the DORA pipeline.
- Review metrics during bi-weekly engineering leadership sync.
- Use trends to adjust WIP limits, release cadence, and identify bottlenecks.
