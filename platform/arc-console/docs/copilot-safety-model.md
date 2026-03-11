# Copilot Safety Model

## Safety Objectives
- Keep copilot behavior advisory-only unless separate governed controls are approved.
- Prevent direct exposure of secrets or token material.
- Require authenticated operator sessions for all copilot routes.
- Preserve explainability with fact/inference separation and evidence references.

## Mandatory Controls
- Auth required:
  - `POST /api/copilot/query`
  - `GET /api/copilot/suggestions`
  - `GET /api/copilot/history`
- Response contract includes:
  - `confidence`
  - `action_mode`
  - `evidence_sources`
  - `warnings`
- Sensitive-query guard:
  - requests containing secret/token/password/private-key hints are blocked and returned as policy warnings.
- Observability events:
  - `COPILOT_QUERY`
  - `COPILOT_RESPONSE`
  - `COPILOT_WARNING`

## Data and Storage Policy
- Conversation history is local-only JSON storage.
- Default path: `data/copilot-conversations.json`
- History contains prompt + summarized response metadata only.
- Secret values are not logged or persisted by copilot modules.

## Failure and Degraded Mode
- Missing source modules/data produce warnings, not crashes.
- Slow source resolution is bounded by timeout (`COPILOT_CONTEXT_TIMEOUT_MS`).
- Low-context responses still return contract-complete payloads with reduced confidence.

## Action-Mode Semantics
- `informational`: descriptive output only.
- `advisory`: recommends governed next actions.
- `approval-required`: recommendations imply explicit operator approval before any execution through separate control paths.
