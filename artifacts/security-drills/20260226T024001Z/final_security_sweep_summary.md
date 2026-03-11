# Final Security Sweep Summary
generated_at_utc: 2026-02-26T02:41:33.877Z
gateway_url: https://gateway-sandbox-production.up.railway.app
licensing_url: https://licensing-sandbox-production.up.railway.app
release_status: RED

## Drill Files
- drill_results_malformed.txt
- drill_results_replay.txt
- drill_results_concurrency.txt
- drill_results_rate_limit.txt

## Verdict
- FAIL:
- Malformed drill failed: statuses=400,400,403
- Replay drill failed: statuses=403,403 delta=0
- Issue flood drill failed: 429=40 db_delta=39 success_2xx=38
