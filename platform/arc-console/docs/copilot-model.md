# Copilot Model

## Inputs
The copilot consumes Phase 7 intelligence endpoints:
- `/api/intelligence/insights`
- `/api/intelligence/service-trends`
- `/api/intelligence/repo-drift`
- `/api/intelligence/dependency-risk`
- `/api/intelligence/agent-activity`

## Output Contract
Each assistance recommendation includes:
- guidance text
- confidence score
- evidence list
- operator approval required flag

## Recommendation Types
- Insight interpretation
- Diagnostic guidance
- Repository cleanup advice
- Workflow recommendation
- Operator alert prioritization

## Confidence Strategy
Confidence is inherited from intelligence findings and adjusted by:
- evidence density
- signal consistency
- workflow availability mapping

## Guardrails
- advisory only
- no destructive autonomy
- explicit approval requirement
- observability event emission for every assistance interaction
