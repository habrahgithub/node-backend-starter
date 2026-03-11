# Assistance Architecture

## Objective
Phase 8 adds an Operator Assistance Layer that interprets intelligence outputs into guided, operator-approved recommendations.

## Layer Model
- Automation Layer: executes safe simulations and workflows
- Intelligence Layer: produces analytical risk signals
- Assistance Layer: converts signals into operator guidance

## Assistance Modules
- `server/assistance/insightInterpreter.js`
  - translates platform insights into human guidance
- `server/assistance/diagnosticCopilot.js`
  - provides service diagnostic sequences
- `server/assistance/repoCleanupAdvisor.js`
  - recommends repository and dependency cleanup actions
- `server/assistance/workflowAdvisor.js`
  - maps risk signals to suggested workflows
- `server/assistance/operatorNotifier.js`
  - prioritizes urgent/attention alerts for operator review

## API Surface
Protected endpoints:
- `GET /api/assistance/insights`
- `GET /api/assistance/service-diagnostics`
- `GET /api/assistance/repo-advice`
- `GET /api/assistance/workflows`
- `GET /api/assistance/alerts`

## Safety Guarantees
- Advisory-only responses.
- No mutation paths in assistance modules.
- Every recommendation includes evidence and confidence.
- Workflow and remediation paths explicitly require operator approval.

## Observability Events
Assistance routes emit:
- `ASSISTANCE_RECOMMENDATION`
- `ASSISTANCE_ALERT`
- `ASSISTANCE_WORKFLOW_SUGGESTION`

Events are visible through `/api/logs` and the logs dashboard.
