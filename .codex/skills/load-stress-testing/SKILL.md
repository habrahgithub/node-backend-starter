---
name: load-stress-testing
description: Run controlled load and stress tests to measure throughput, latency, and failure behavior under pressure. Use when the user asks for performance load tests, stress tests, capacity checks, or bottleneck analysis.
---

# Load Stress Testing

## Safety First

1. Run only against approved non-production targets unless the user explicitly confirms production testing.
2. Define max request rate and duration before running.
3. Stop immediately if error rates exceed agreed thresholds.

## Workflow

1. Establish baseline latency and error rate at low concurrency.
2. Increase load gradually in stages.
3. Capture p50/p95/p99 latency, throughput, and failure rates.
4. Identify saturation points and degraded endpoints.
5. Produce clear bottleneck summary and next actions.

## Tooling

- Use available tools such as `k6`, `autocannon`, or `wrk`.
- Prefer reproducible command lines with fixed parameters.

## Output Rules

- Include target, duration, concurrency/rate, and summary metrics.
- Distinguish capacity limits from transient environment noise.
- Recommend safe tuning steps with expected impact.

## Reference

- `references/load-test-template.md`
