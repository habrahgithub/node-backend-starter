# Decisions

## 2026-03-09 — Phase 4 Local Auth Boundary
- Decision: Protect dashboard and non-auth API routes with local operator session authentication.
- Rationale: Prevent unauthenticated access before introducing any control actions.
- Scope: Local runtime only; no external identity provider integration yet.

## 2026-03-09 — Degraded-Mode Warning Model
- Decision: Keep service alive under missing/malformed governance artifacts and expose warnings instead of crashing.
- Rationale: Governance workflows require inspectable fallback behavior.
- Scope: Read-only views only; fallback data is non-authoritative.

## 2026-03-09 — In-Memory Observability Baseline
- Decision: Capture structured request/error/warning events and route latency in memory.
- Rationale: Provide operator-visible diagnostics without adding external infrastructure.
- Scope: Process-lifetime retention only; persistent sinks are deferred.

## 2026-03-09 — Phase 5 CI Quality Gate Baseline
- Decision: Add lint/test/build gates in local verify workflow and CI workflow.
- Rationale: Close development-discipline gap before production readiness claims.
- Scope: Branch-protection enforcement remains external governance configuration.

## 2026-03-09 — Phase 5 Integration Controls Are Read-Only
- Decision: Add refresh/adapter endpoints with no external mutation capability.
- Rationale: Increase visibility and integration readiness without violating governance guardrails.
- Scope: Write-capable actions remain disabled pending Prime approval.

## 2026-03-09 — Phase 6 Operator-Mediated Automation
- Decision: Add automation modules for agents, services, repositories, and workflows with strict operator-triggered execution.
- Rationale: Expand control-plane utility while preserving safety, approval, and audit requirements.
- Scope: Service lifecycle actions remain simulation-only; no destructive autonomous behavior is allowed.

## 2026-03-09 — Persistent Operator Action Log
- Decision: Persist operator action records to `logs/operator-actions.log` in addition to in-memory observability events.
- Rationale: Provide durable audit evidence for automation attempts and outcomes.
- Scope: Logging includes timestamp/operator/action/target/result/duration only; no secret payload values are written.

## 2026-03-09 — Phase 7 Intelligence Layer Is Advisory-Only
- Decision: Add platform intelligence analyzers as read-only advisory modules.
- Rationale: Enable predictive governance insights without introducing autonomous infrastructure mutation risk.
- Scope: Intelligence outputs provide evidence/confidence and recommendations requiring explicit operator approval.

## 2026-03-09 — Intelligence Observability Event Types
- Decision: Emit `INTELLIGENCE_SUMMARY` and `INTELLIGENCE_ALERT` events into observability stream.
- Rationale: Make analytical findings auditable and operator-visible from the unified logs surface.
- Scope: Events include domain, confidence, and evidence snippets; they do not execute control actions.

## 2026-03-09 — Phase 8 Assistance Layer Is Guidance-Only
- Decision: Introduce assistance modules that interpret intelligence signals and provide guided recommendations.
- Rationale: Improve operator decision speed while preserving governance and explicit approval control.
- Scope: Assistance outputs are advisory only and cannot trigger autonomous mutations.

## 2026-03-09 — Assistance Observability Event Types
- Decision: Emit `ASSISTANCE_RECOMMENDATION`, `ASSISTANCE_ALERT`, and `ASSISTANCE_WORKFLOW_SUGGESTION`.
- Rationale: Ensure copilot interactions are auditable and transparent for governance review.
- Scope: Events capture confidence and evidence context only; execution remains operator-approved.

## 2026-03-09 — Phase 9 Reliability Advisory Is Non-Autonomous
- Decision: Add reliability modules for incident patterning, playbooks, trends, recovery advice, and local learning ledger.
- Rationale: Improve recovery and prevention guidance while preserving strict operator control.
- Scope: Recommendations are advisory-only; no automatic fixes, restarts, or repo mutations are allowed.

## 2026-03-09 — Reliability Event and Ledger Policy
- Decision: Emit reliability-specific observability events and keep learning history local to ARC Console.
- Rationale: Preserve auditability and local governance context without external leakage.
- Scope: `POST /api/reliability/learning/record` is authenticated, operator-triggered, payload-validated, and audit-logged.

## 2026-03-09 — Phase 10 Knowledge Graph Is Derived and Read-Only
- Decision: Introduce knowledge graph modules for node/relationship modeling, graph queries, and snapshots.
- Rationale: Enable cross-system reasoning and impact tracing from existing platform signals without altering source systems.
- Scope: Graph data is derived from current ARC modules and exposed as read-only API/dashboard context.

## 2026-03-09 — Knowledge Graph Event Types
- Decision: Emit `KNOWLEDGE_GRAPH_BUILT`, `KNOWLEDGE_GRAPH_QUERY`, and `KNOWLEDGE_GRAPH_SNAPSHOT`.
- Rationale: Maintain observability and auditability for graph generation and query usage.
- Scope: Events include lightweight confidence and evidence metadata suitable for operator dashboards.

## 2026-03-09 — Phase 11 Copilot Is Advisory-Only
- Decision: Add a conversational copilot layer that answers operator queries with evidence, confidence, and action-mode labels.
- Rationale: Improve operator productivity and cross-layer reasoning without bypassing governance safeguards.
- Scope: Copilot responses remain advisory; no state-changing execution path is enabled through chat.

## 2026-03-09 — Copilot Interaction and History Policy
- Decision: Emit `COPILOT_QUERY`, `COPILOT_RESPONSE`, and `COPILOT_WARNING` events and retain local copilot history.
- Rationale: Preserve auditability and operator traceability for conversational guidance.
- Scope: Local store retains prompt plus summarized response metadata only; secret-like prompts are blocked by policy safeguards.

## 2026-03-09 — Phase 12 Distributed Fabric Is Telemetry-First
- Decision: Introduce distributed node registration, heartbeat monitoring, telemetry aggregation, query routing, and topology mapping as read-only-by-default capabilities.
- Rationale: Expand ARC from single-node visibility to federated multi-node control context without introducing unauthorized remote execution risk.
- Scope: Fabric routes remain advisory/telemetry-focused and do not mutate remote systems.

## 2026-03-09 — Fabric Node Authentication and Event Policy
- Decision: Require registration token validation, duplicate node prevention, node-token checks for heartbeat/telemetry posts, and emit fabric observability events.
- Rationale: Protect distributed control boundaries and keep node lifecycle transitions auditable.
- Scope: Emit `FABRIC_NODE_REGISTERED`, `FABRIC_NODE_HEARTBEAT`, `FABRIC_NODE_OFFLINE`, and `FABRIC_QUERY_ROUTED`.

## 2026-03-09 — Phase 13 Governance Engine Is Advisory-First
- Decision: Introduce policy registry, evaluator, drift detector, compliance scorer, and violation reporter as advisory governance controls.
- Rationale: Improve distributed platform compliance visibility without enabling autonomous enforcement.
- Scope: Governance findings provide evidence-backed guidance and operator-approval-required remediation recommendations.

## 2026-03-09 — Governance Event and Policy Config Model
- Decision: Emit governance observability events and support configurable policy thresholds via env and optional policy file.
- Rationale: Keep governance posture auditable and tunable across evolving platform topology.
- Scope: Emit `GOVERNANCE_POLICY_EVALUATED`, `GOVERNANCE_VIOLATION_DETECTED`, and `GOVERNANCE_COMPLIANCE_UPDATED`; policy overrides remain local to ARC.
