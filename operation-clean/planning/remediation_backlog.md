# Remediation Backlog

## Critical

- None identified in current scoped pass.

## High

- ID: OC-001
  Title: Resolve starter duplication
  Project: projects/node-backend-starter*
  Severity: High
  Problem: Two starter variants may split maintenance effort
  Evidence: Multiple starter projects present
  Proposed remediation: Decide canonical starter and archive or differentiate the other
  Blocking dependencies: NEEDS_REVIEW
  Requires Prime approval: yes

- ID: OC-002
  Title: Review archived project retention
  Project: projects/_archive
  Severity: High
  Problem: Archived projects still visible in active workspace
  Evidence: Archive manifests still classified
  Proposed remediation: Confirm retention policy and cold-storage boundary
  Blocking dependencies: NEEDS_REVIEW
  Requires Prime approval: yes

## Medium

- ID: OC-003
  Title: Improve missing test coverage
  Project: multiple
  Severity: Medium
  Problem: Several projects show no clear automated tests
  Evidence: Manifest and folder scan found no tests
  Proposed remediation: Add minimal smoke/unit coverage per active project
  Blocking dependencies: NEEDS_REVIEW
  Requires Prime approval: no

- ID: OC-004
  Title: Normalize naming conventions
  Project: multiple
  Severity: Medium
  Problem: Inconsistent separators/version suffixes in names
  Evidence: Naming normalization report
  Proposed remediation: Adopt lowercase-hyphenated names in future move plan
  Blocking dependencies: NEEDS_REVIEW
  Requires Prime approval: yes

## Low

- ID: OC-005
  Title: Document service ownership
  Project: multiple
  Severity: Low
  Problem: README coverage is incomplete
  Evidence: Docs signals absent/partial for some projects
  Proposed remediation: Add owner/purpose/runbook section per active project
  Blocking dependencies: NEEDS_REVIEW
  Requires Prime approval: no

