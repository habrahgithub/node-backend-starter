# Automation Architecture

## Objective
Phase 6 introduces operator-mediated automation in ARC Console while preserving governance controls.

## Design Principles
- Operator-triggered only: no autonomous destructive behavior.
- Read-only by default for external integrations and repository interactions.
- Safe-mode simulation for lifecycle actions that could mutate services.
- Mandatory audit trail for every operator-triggered action path.

## Module Topology
- `server/automation/agentOrchestrator.js`
  - agent state view
  - safe task trigger simulation
- `server/automation/serviceController.js`
  - service metrics
  - diagnostics simulation with confirmation token
  - restart simulation in SAFE MODE only
- `server/automation/repoGovernor.js`
  - repository governance score
  - stale branch scan signals
  - dependency risk signals
- `server/automation/operatorWorkflow.js`
  - predefined workflow catalog
  - prerequisite checks
  - safe read-only workflow runs

## Route Surface
Protected routes (auth required):
- `GET /api/agents/state`
- `POST /api/agents/run`
- `GET /api/services/metrics`
- `POST /api/services/diagnostics`
- `POST /api/services/restart`
- `GET /api/repos/health`
- `GET /api/repos/stale-branches`
- `GET /api/repos/dependency-risk`
- `GET /api/workflows`
- `POST /api/workflows/run`

## Safety Controls
- `ARC_SERVICE_CONFIRMATION_TOKEN` required for diagnostics/restart.
- `ARC_WORKFLOW_CONFIRMATION_TOKEN` required for workflow execution.
- `POST /api/services/restart` enforces simulation-only behavior.
- No external repository mutation is performed by automation modules.

## Audit and Observability
- Operator actions are recorded in runtime observability events (`source: operator-action`).
- Durable operator action entries are appended to:
  - `logs/operator-actions.log`
- Log line format fields:
  - `timestamp`, `operator`, `action`, `target`, `result`, `duration`

## Dashboard Surfaces
- `/automation`
- `/workflows`
- `/repo-health`

These pages are read-only status and history views wired to authenticated backend routes.
