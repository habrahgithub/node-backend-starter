# Risk Assessment Report

## R001
- severity: MEDIUM
- location: projects/_archive
- issue: Archived packages remain in workspace scope
- evidence: Archived package manifests detected and retained for reference
- recommendation: Keep archived items segregated and review for long-term retention

## R002
- severity: MEDIUM
- location: projects/node-backend-starter*
- issue: Potential duplicated starter lineage
- evidence: Multiple starter variants detected: projects/node-backend-starter/package.json, projects/node-backend-starter-v2/package.json
- recommendation: Compare ownership and decide consolidate vs retain

## R003
- severity: MEDIUM
- location: multiple projects
- issue: Missing or unclear automated test coverage
- evidence: No clear tests for: vault/dashboard/package.json
- recommendation: Standardize test expectations per project type

## R004
- severity: LOW
- location: multiple projects
- issue: Missing or partial project documentation
- evidence: No README/docs for: projects/swd-finstack/mcp/server/package.json
- recommendation: Add minimal service/application readmes

## R005
- severity: LOW
- location: workspace root
- issue: Infrastructure maturity gaps
- evidence: No root-level Docker or CI workflow detected; No Terraform detected in scoped workspace scan
- recommendation: Add CI/containerization only where justified by deployment needs

