# ARC Console Architecture

## Objective

ARC Control Console is the unified operator-facing control plane for platform governance.

## Runtime Model

Single unified server:

- Express API routes under `/api/*`
- Next.js dashboard pages handled by the same process for non-API routes

This enforces one operational entry point while keeping API and UI modules separated.

## Core Layers

- `server/index.js`: unified startup flow and request routing boundary
- `server/services/systemRegistry.js`: live inventory and registry caching
- `server/services/healthMonitor.js`: platform health aggregation
- `server/automation/*`: operator-triggered workflow and lifecycle simulation modules
- `server/intelligence/*`: advisory analytics and predictive governance insights
- `server/assistance/*`: copilot interpretation and guided operator recommendations
- `server/reliability/*`: self-healing advisory analysis and incident learning ledger
- `server/knowledge/*`: platform knowledge graph nodes, edges, queries, and snapshots
- `server/copilot/*`: conversational query routing, context assembly, reasoning, and local history
- `server/fabric/*`: distributed node registration, telemetry federation, query routing, and topology mapping
- `server/governance/*`: policy registry/evaluation, drift detection, compliance scoring, and violation reporting
- `server/controllers/*`: route-level response shaping
- `dashboard/pages/*`: operator surfaces using backend APIs

## Control Plane Responsibilities

- API gateway for operator telemetry and governance context
- service/repository/agent inventory
- health and warning rollups for platform decisions
- read-only automation and diagnostics simulations
- intelligence-driven risk detection and recommendation generation
- assistance-guided workflows and alert prioritization
- reliability incident patterning, playbooks, and recovery guidance
- graph-based system relationship modeling and impact tracing
- conversational operator diagnostics with evidence, confidence, and action-mode labels
- distributed node fleet visibility with federated telemetry and topology signals
- policy-aware governance evaluation with compliance posture and violation guidance
- consolidated operator dashboard surface

## Integration Constraints

- No autonomous destructive actions
- Intelligence outputs are advisory and require operator approval for follow-up actions
- Assistance outputs are advisory and require operator approval for any workflow execution
- Reliability outputs are advisory and require operator approval for remediation actions
- Knowledge graph outputs are derived/read-only and used for context reasoning
- Copilot outputs are advisory and cannot execute state changes from chat
- Fabric telemetry and distributed query outputs are read-only and advisory by default
- Governance outputs are advisory-first and operator approval is required for remediation actions
- External mutation endpoints remain disabled by default
- Vault/action wiring deferred to governed follow-up phases
