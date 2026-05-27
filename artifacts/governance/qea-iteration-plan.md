# QEA Iteration Plan: MVP → Hardening → Scale

This document translates the validated “simple base, progressive complexity” approach into an executable modernization loop focused on user-cycle fluidity.

## Operating Principle

- Start from the smallest stable slice.
- Increase complexity only after objective technical validation.
- Optimize for smooth user loops (time-to-value, perceived latency, task completion).
- Re-calibrate daily using derived metrics.

## Program Cadence

- **Sprint rhythm**: 1-week execution, daily checkpoint.
- **Daily cycle**: Observe → Diagnose → Adjust → Verify.
- **Gate policy**: No progression if quality, security, or reliability gates fail.

---

## Level 1 — MVP Stabilization (Ground State)

### Objective

Establish a reliable baseline of core flows with measurable UX and operational health.

### Scope

- Critical flows: navigation, contact submission, chat interaction.
- Baseline observability: frontend errors, API latency, request success/failure.
- Basic security hygiene: secret handling, dependency audit, minimal hardening checks.

### KPIs (Go/No-Go)

- Availability of core API path: **>= 99.0%** (daily).
- p95 client-visible action latency (core flows): **<= 1500 ms**.
- Contact/chat request success rate: **>= 98%**.
- Frontend uncaught error rate: **< 0.5% sessions**.
- Critical vulnerabilities open: **0**.

### Deliverables

- KPI dashboard definition and owners.
- Alert thresholds for core regressions.
- Baseline incident runbook for top 3 failure modes.

### Exit Criteria

All Level 1 KPIs sustained for 5 consecutive business days.

---

## Level 2 — Hardening & Performance Optimization

### Objective

Reduce risk and improve responsiveness under normal and burst usage.

### Scope

- Reliability hardening: retries, timeout strategy, error boundaries, graceful fallbacks.
- Performance optimization: bundle strategy, caching posture, API hot-path profiling.
- Security reinforcement: branch protections, secrets rotation workflow, dependency governance.

### KPIs (Go/No-Go)

- p95 core interaction latency improvement vs Level 1 baseline: **>= 25%**.
- p99 API timeout rate: **<= 1%**.
- Change failure rate (deployment): **< 10%**.
- Mean time to restore (MTTR): **< 60 minutes**.
- High-severity vulnerabilities open for >7 days: **0**.

### Deliverables

- Hardened timeout/retry matrix by endpoint class.
- Dependency update policy + weekly enforcement job.
- Performance budget with automated CI check.

### Exit Criteria

KPIs met for 2 release cycles with no Sev-1 incident.

---

## Level 3 — Scale, Intelligence, and Product Expansion

### Objective

Support growth while preserving UX fluidity, safety, and engineering velocity.

### Scope

- Capacity strategy: horizontal scaling assumptions and traffic envelopes.
- Quality-at-speed: canary/gradual rollout and auto-rollback triggers.
- Product intelligence loop: experiment framework with user-centric outcome tracking.

### KPIs (Go/No-Go)

- Weekly active user growth supported with no latency regression at p95 > 10%.
- Deployment frequency: **>= 3/week** without reliability KPI degradation.
- Experiment velocity: **>= 2 validated experiments/month**.
- User task completion uplift on targeted flows: **>= 15%**.

### Deliverables

- Scale playbook with SLO and error budget policy.
- Progressive delivery policy (canary + rollback guardrails).
- Experiment registry linking product hypotheses to technical levers.

### Exit Criteria

Three consecutive months of KPI compliance with sustainable team velocity.

---

## Derived Metrics Layer (Daily Adjustment Engine)

Derived metrics convert raw telemetry into decisions:

- **Cycle Fluidity Index (CFI)** = weighted score of task completion, p95 latency, and error-free sessions.
- **Reliability Pressure Score (RPS)** = incident count, timeout rate, and alert noise composite.
- **Security Drift Index (SDI)** = unresolved vulnerability age + secrets rotation freshness.
- **Delivery Stability Index (DSI)** = deployment frequency × (1 - change failure rate).

### Daily Decision Rules

- If **CFI drops > 10% day-over-day**, freeze feature expansion and prioritize UX/latency recovery.
- If **RPS exceeds threshold for 2 days**, trigger hardening mini-sprint.
- If **SDI breaches policy**, enforce release gate until security debt is reduced.
- If **DSI declines while demand increases**, prioritize platform and CI/CD reliability work.

---

## Ownership Matrix

- **Product Owner**: defines user outcomes and acceptance thresholds.
- **Engineering Lead**: owns technical gates and roadmap sequencing.
- **SRE/Platform**: owns observability, SLOs, incident readiness.
- **Security Lead**: owns vulnerability/SBOM/secrets governance.

## First 10-Day Activation Checklist

1. Confirm 3 critical user journeys and instrumentation coverage.
2. Lock Level 1 KPI thresholds and dashboard implementation.
3. Add CI checks for lint/test/build + dependency audit.
4. Define alert routing and on-call escalation rules.
5. Publish risk register with top interdependency bottlenecks.
6. Run one synthetic load pulse and one incident simulation.
7. Review daily derived metrics and apply at least one tuning action.

