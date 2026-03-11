# Copilot Architecture

## Objective
Phase 11 introduces a conversational operator copilot that synthesizes ARC governance, automation, intelligence, assistance, reliability, and knowledge-graph signals into evidence-backed responses.

## Module Topology
- `server/copilot/copilotController.js`
  - authenticated query entrypoint
  - suggestions and history endpoints
  - observability emission for query/response/warnings
- `server/copilot/queryRouter.js`
  - natural-language query classification
  - source selection by query type
- `server/copilot/contextAssembler.js`
  - bounded context loading from ARC layers
  - timeout and partial-failure tolerance
- `server/copilot/reasoningEngine.js`
  - answer synthesis
  - fact/inference/recommendation separation
  - confidence and action-mode labeling
- `server/copilot/responseFormatter.js`
  - contract normalization for concise/expanded modes
- `server/copilot/conversationStore.js`
  - local interaction history retention

## API Surface
Protected endpoints:
- `POST /api/copilot/query`
- `GET /api/copilot/suggestions`
- `GET /api/copilot/history`

## Dashboard Surface
- `/copilot`
  - query input
  - suggestion chips
  - evidence and confidence panels
  - recommendation and warning panels
- `/copilot-history`
  - recent local interaction history

## Design Guarantees
- Advisory only by default.
- No hidden execution path from copilot query responses.
- Responses include evidence sources, confidence, and action mode.
- Partial-source failures degrade to warnings instead of process errors.
