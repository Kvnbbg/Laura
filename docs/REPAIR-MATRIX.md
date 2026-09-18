# Laura — repair matrix

## Principle

Repair missing pieces at the boundary first. Do not rewrite functioning routes, services or UI.

| Area | Existing contract | Repair target | Verification |
|---|---|---|---|
| Health | `/api/health` | client health indicator | HTTP 200 |
| Chat | local fallback + provider mode | transport normalization | integration contract |
| Stream | SSE + DONE | parser resilience | stream contract |
| Documents | session header + limits | upload state component | rejection tests |
| RAG | citations | citation renderer | fixture |
| Matrix | trust envelope | trust badge | accepted/rejected cases |
| Security | origin/rate/body limits | regression guard | security contract |
| CLI | Go bridge | web bridge adapter | Go + HTTP contract |
| Plugins | explicit invocation | permission UI | static review |
| Errors | structured server messages | UI error mapping | status matrix |

## Error matrix

- 200: render result.
- 400: show actionable input error.
- 413: explain size/limit and preserve typed user input.
- 415: explain unsupported upload type.
- 429: show retry delay without silently retrying.
- 500/502: preserve local fallback where applicable.
- SSE interruption: mark incomplete and allow explicit retry.

## Missing-file rule

A missing optional integration file is not replaced with a fake implementation. First identify its consumer, contract and expected runtime. Then add the smallest compatible implementation and a regression check.
