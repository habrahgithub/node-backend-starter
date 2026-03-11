# ARC Console Observability Baseline

## Scope
Phase 13 observability baseline for unified server operation with automation, intelligence, assistance, reliability, knowledge graph, copilot, distributed fabric, and governance logging.

## Implemented Signals

### Structured request logs
Captured for each request:
- `requestId`
- `method`
- `path`
- `statusCode`
- `durationMs`
- `authenticated` flag
- timestamp

Recorded in an in-memory event stream through `observability` service.

### Error event logging
Server and controller/runtime failures are captured as structured error events with:
- source
- message
- requestId/path when available
- details

### Warning event logging
Registry ingestion warnings (missing/malformed artifacts, fallbacks) are added to warning history.

### Auth audit events
Auth actions emit structured audit events:
- login success/failure/rate-limited
- session-missing checks
- logout

### Operator action audit events
Automation actions emit structured events with:
- operator
- action
- target
- result
- duration

### Intelligence findings events
Intelligence endpoints emit:
- `INTELLIGENCE_SUMMARY`
- `INTELLIGENCE_ALERT`

Fields include:
- domain
- confidence score
- evidence snippets

### Assistance interaction events
Assistance endpoints emit:
- `ASSISTANCE_RECOMMENDATION`
- `ASSISTANCE_ALERT`
- `ASSISTANCE_WORKFLOW_SUGGESTION`

Fields include:
- domain
- confidence score
- evidence snippets

### Reliability advisory events
Reliability endpoints emit:
- `RELIABILITY_INCIDENT_DETECTED`
- `RELIABILITY_PLAYBOOK_SUGGESTED`
- `RELIABILITY_TREND_SUMMARY`
- `RELIABILITY_LEARNING_RECORDED`

Fields include:
- domain
- confidence score
- evidence snippets

### Knowledge graph events
Knowledge endpoints emit:
- `KNOWLEDGE_GRAPH_BUILT`
- `KNOWLEDGE_GRAPH_QUERY`
- `KNOWLEDGE_GRAPH_SNAPSHOT`

Fields include:
- domain
- confidence score
- evidence snippets

### Copilot interaction events
Copilot endpoints emit:
- `COPILOT_QUERY`
- `COPILOT_RESPONSE`
- `COPILOT_WARNING`

Fields include:
- query domain/type
- confidence score
- evidence source names
- warning context when degraded data handling occurs

### Fabric orchestration events
Fabric endpoints emit:
- `FABRIC_NODE_REGISTERED`
- `FABRIC_NODE_HEARTBEAT`
- `FABRIC_NODE_OFFLINE`
- `FABRIC_QUERY_ROUTED`

Fields include:
- node identifier/domain
- confidence score
- lifecycle transition or query-routing evidence

### Governance policy events
Governance endpoints emit:
- `GOVERNANCE_POLICY_EVALUATED`
- `GOVERNANCE_VIOLATION_DETECTED`
- `GOVERNANCE_COMPLIANCE_UPDATED`

Fields include:
- policy/compliance domain
- confidence score
- severity-aligned evidence snippets

### Latency metrics
Route-level metrics are tracked per path:
- count
- average duration
- maximum duration
- last status code
- last duration

Health-specific latency is exposed in governance summary:
- `systemHealthSummary.healthLatency`

## Operator Endpoints
- `GET /api/logs`:
  - Returns merged control-plane + runtime events
  - Includes `observability.routeMetrics`
- `GET /api/governance/summary`:
  - Returns warning center and health latency widget data

## Persistent Audit Sink
- File sink: `logs/operator-actions.log`
- Format fields:
  - `timestamp`
  - `operator`
  - `action`
  - `target`
  - `result`
  - `duration`
- Applies to operator action attempts (including blocked outcomes).

## Retention Model
- In-memory event store
- capped at 1000 events (rolling window)
- reset on process restart

## Dashboards Using Observability
- `/logs` page:
  - recent events
  - route latency metrics
- `/` dashboard:
  - warning center
  - health latency summary

## Limitations
- No distributed tracing yet.
- No external metrics backend yet.

## Next Observability Steps
- Add persistent sink (file/OTLP/SIEM adapter) with redaction policy.
- Add percentile latency (p95/p99) and error-rate windows.
- Add alert thresholds for warning spikes and auth failures.
