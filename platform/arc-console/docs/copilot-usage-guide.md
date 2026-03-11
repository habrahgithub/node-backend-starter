# Copilot Usage Guide

## Purpose
Use copilot to ask natural-language platform questions and receive evidence-backed recommendations without direct mutation.

## Endpoints
- `POST /api/copilot/query`
- `GET /api/copilot/suggestions`
- `GET /api/copilot/history`

## Query Request
`POST /api/copilot/query`

```json
{
  "query": "What services are currently unstable?",
  "mode": "concise"
}
```

`mode` options:
- `concise`
- `expanded`

## Response Shape
```json
{
  "query_type": "service_diagnostics",
  "answer": "...",
  "facts": [],
  "inferences": [],
  "recommended_actions": [],
  "confidence": 0.78,
  "action_mode": "approval-required",
  "evidence_sources": [],
  "warnings": [],
  "timestamp": "..."
}
```

## Dashboard Workflow
1. Open `/copilot`.
2. Pick a suggestion or enter a custom query.
3. Run in `concise` or `expanded` mode.
4. Review facts, inferences, recommendations, evidence, confidence, and warnings.
5. If needed, open `/copilot-history` to review recent interactions.

## Operational Notes
- Copilot remains advisory only.
- Recommendations may reference approval-required actions but do not execute them.
- If data sources are missing, responses include warnings and lower confidence.
