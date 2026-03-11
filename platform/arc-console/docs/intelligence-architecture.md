# Intelligence Architecture

## Objective
Phase 7 adds a read-only intelligence layer that turns platform telemetry into advisory risk and trend signals.

## Architecture Stack
- Control Plane: unified Express + Next.js server
- Automation Layer: operator-triggered workflows and simulation controls
- Intelligence Layer: analytics modules under `server/intelligence/`

## Intelligence Modules
- `serviceTrendAnalyzer.js`
  - derives service health trend, failure count, stability score
- `repoDriftDetector.js`
  - detects governance/repository drift with evidence
- `dependencyRiskAnalyzer.js`
  - scores dependency risk from declared versions and repo state
- `agentActivityAnalyzer.js`
  - tracks agent task frequency, success rates, and stalled trends
- `platformInsightsEngine.js`
  - aggregates all intelligence sources into top risks and recommendations

## Endpoint Surface
Protected intelligence routes:
- `GET /api/intelligence/service-trends`
- `GET /api/intelligence/repo-drift`
- `GET /api/intelligence/dependency-risk`
- `GET /api/intelligence/agent-activity`
- `GET /api/intelligence/insights`

## Safety Guarantees
- Read-only execution only.
- No service/repo mutation paths in intelligence modules.
- Recommendations are advisory and marked operator-approval-required.
- Confidence score and evidence are attached to each finding.

## Observability Integration
Intelligence routes emit:
- `INTELLIGENCE_SUMMARY`
- `INTELLIGENCE_ALERT`

Events are recorded in runtime observability stream (`source: intelligence`) for operator review.
