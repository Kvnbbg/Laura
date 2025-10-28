# Observability & Telemetry Strategy

## Objectives
- Provide actionable telemetry across the React frontend, Railway deployment, and CI/CD pipeline.
- Align logging, metrics, and tracing with OpenTelemetry best practices.
- Enable fast detection of regressions via synthetic monitoring.

## Frontend Instrumentation
- Integrate **OpenTelemetry JS SDK** with the Vite build to capture:
  - User navigation spans via `@opentelemetry/instrumentation-document-load` and `@opentelemetry/instrumentation-fetch`.
  - Custom spans around expensive React effects (e.g., 3D animations) using the `@opentelemetry/api` tracer.
- Export traces to an OTLP collector (e.g., Grafana Tempo) via the OTLP HTTP exporter with sampling tuned to 10% during beta and 1% in production.
- Use structured console logging (JSON) gated behind `import.meta.env.MODE` to avoid noisy production logs while retaining debuggability in CI previews.

## Metrics
- Add **Web Vitals** instrumentation through `web-vitals` package and push metrics to OpenTelemetry as histogram metrics for TTFB, LCP, FID, and CLS.
- Capture deployment metrics from GitHub Actions using workflow run outputs and publish to Prometheus via the `prometheus-pushgateway` GitHub Action.
- Emit custom metrics for:
  - Build durations (`ci.build.seconds`).
  - Test coverage (`ci.test.coverage`), pulled from Vitest coverage summary.
  - Railway deployment latency using the Railway API.

## Logging
- Configure Vite to include source maps in production builds and pipe logs through **pino** for structured JSON when running on Railway.
- Centralize server logs by forwarding Railway service logs to a LogDNA or Grafana Loki sink.
- Define logging levels:
  - `debug`: Development mode only.
  - `info`: Deployment notifications, feature flags toggled.
  - `warn`: Recoverable errors (API retries, animation fallbacks).
  - `error`: Unhandled promise rejections, runtime crashes.

## Alerting & Dashboards
- Create Grafana dashboards for Web Vitals, CI pipeline duration, and deployment success rate.
- Configure alerting rules:
  - LCP > 4s for 5 minutes -> PagerDuty low severity.
  - CI median duration increases by 50% week-over-week -> Slack notification.
  - Three consecutive Railway deployment failures -> PagerDuty high severity.

## Synthetic Monitoring
- Add Playwright-based smoke tests executed nightly via GitHub Actions scheduled workflow to validate navigation, key animations, and contact form submissions.
- Record results to GitHub Action artifacts and push status metrics to Grafana.

## Data Retention & Governance
- Retain traces for 7 days in staging and 30 days in production.
- Metrics stored for 13 months to support DORA trend analysis.
- Access controls managed via GitHub SSO groups mirrored into Grafana and logging platform.
