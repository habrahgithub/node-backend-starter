# Intelligence Usage

## Operator Workflow
1. Authenticate in ARC Console.
2. Open `/intelligence` for aggregated risks and recommendations.
3. Drill down into:
   - `/service-trends`
   - `/repo-drift`
4. Validate confidence and evidence before deciding any action.
5. Use existing operator workflows for approved follow-up diagnostics.

## API Usage
- `GET /api/intelligence/service-trends`
- `GET /api/intelligence/repo-drift`
- `GET /api/intelligence/dependency-risk`
- `GET /api/intelligence/agent-activity`
- `GET /api/intelligence/insights`

All routes require authenticated session.

## Interpretation Guide
- `risk_level=high` and `confidence_score>=0.8`:
  - prioritize operator review
- `risk_level=medium`:
  - schedule follow-up workflow
- low confidence findings:
  - gather additional evidence before escalation

## Governance Guardrails
- Intelligence findings are advisory, not execution commands.
- Any remediation requires explicit operator approval.
- No intelligence endpoint mutates repos/services.

## Observability
Intelligence generation writes runtime events:
- `INTELLIGENCE_SUMMARY`
- `INTELLIGENCE_ALERT`

Review via:
- `GET /api/logs`
- `/logs` dashboard page
