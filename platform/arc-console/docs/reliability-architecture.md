# Reliability Architecture

## Objective
Phase 9 introduces a Self-Healing Advisory Framework that detects recurring failures and generates safe remediation guidance.

## Reliability Modules
- `server/reliability/incidentPatternDetector.js`
  - recurring failure signatures and incident clusters
- `server/reliability/remediationPlaybookEngine.js`
  - incident-to-playbook mapping with prerequisites and rollback checks
- `server/reliability/reliabilityTrendAnalyzer.js`
  - reliability scores and chronic instability trends
- `server/reliability/serviceRecoveryAdvisor.js`
  - safe recovery recommendations with action modes
- `server/reliability/incidentLearningLedger.js`
  - local incident lessons and prevention history

## API Surface
Protected reliability endpoints:
- `GET /api/reliability/incidents`
- `GET /api/reliability/playbooks`
- `GET /api/reliability/playbooks/:incidentId`
- `GET /api/reliability/trends`
- `GET /api/reliability/recovery-advice`
- `GET /api/reliability/learning`
- `POST /api/reliability/learning/record`

## Safety Guarantees
- Advisory only; no automatic remediation execution.
- Every recommendation includes evidence and confidence.
- Every playbook is approval-required.
- Learning ledger writes are authenticated and operator-triggered.

## Local Learning Storage
- Default path: `data/incident-learning-ledger.json`
- Behavior: local-only JSON ledger, bounded history retention.
- Graceful handling for missing or malformed ledger file.

## Observability Events
Reliability layer emits:
- `RELIABILITY_INCIDENT_DETECTED`
- `RELIABILITY_PLAYBOOK_SUGGESTED`
- `RELIABILITY_TREND_SUMMARY`
- `RELIABILITY_LEARNING_RECORDED`
