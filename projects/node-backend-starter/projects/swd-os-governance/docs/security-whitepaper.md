# DocSmith Security Whitepaper (Public)

- Version: 1.0
- Date (GST, UTC+4): 2026-02-09 08:49
- Covered product: DocSmith SIF Generator (Chrome/Edge extension) v1.0.2
- Owner: Star Wealth Dynamics (SWD)
- Contact: support@starwealthdynamics.org

## 1. Executive Summary

DocSmith SIF Generator is a local-first tool for preparing UAE WPS Salary Information Files (SIF). The product is delivered as a browser extension and is designed to keep payroll data on the user's device. There are no accounts, no cloud sync, and no required server-side processing for core functionality.

This document describes the security and privacy posture of the current release, including what data is handled, where it is stored, which browser APIs are used, and what evidence can be produced for auditability.

## 2. Scope and Assumptions

In scope:
- DocSmith SIF Generator browser extension UI and bundled logic.
- Import flows (manual entry, Excel template import, optional SIF template import).
- Output flows (SIF file generation, validation-issues CSV, activity log JSON).

Out of scope:
- Customer endpoint security (device hardening, OS access control, backups).
- Bank transmission and bank-side processing of exported SIF files.
- Third-party security audit (not completed as of v1.0).
- Payment, licensing backend, or server-side data services (not present in v1.0).

Assumptions:
- Users install the extension from official browser stores (Chrome Web Store, Edge Add-ons).
- Users treat exported SIF files as sensitive and transfer them using approved internal channels.

## 3. Data Classification

The application handles payroll data that can include Personally Identifiable Information (PII) and financial data, including:
- Employee identifiers (e.g., MOL Person Code), bank routing numbers, IBANs.
- Salary values (fixed, variable, allowance breakdown when used).
- Employer MOL identifier and payroll period metadata.

Data sensitivity:
- High: employee identifiers, IBAN, salary figures.
- Medium: employer identifiers and payroll period details.

## 4. Architecture Overview

Key components:
- Extension UI: packaged static assets and React/Next.js client code.
- Validation and generation engine: in-browser logic for validating records and generating deterministic SIF output.
- Excel parsing: runs locally using a bundled SheetJS Community Edition build (vendored in the repository), with additional safety guards.
- Background/service worker: exists for extension routing; core processing occurs in the UI page.

No remote hosted code:
- All executable code is packaged inside the extension.
- Core workflows do not require network connectivity.

## 5. Data Flow (Input to Output)

High-level flow:

1. User provides input:
   - Manual entry (employee rows and employer metadata), or
   - Excel template upload for bulk rows (and optional EVP allowance breakdown), or
   - Optional SIF template upload for validation/import.
2. Client-side validation runs:
   - Field-level constraints (formats, lengths, checksums).
   - Cross-row checks (duplicates, totals, period alignment).
3. Output artifacts are produced locally:
   - SIF text file (`.sif`) for bank upload.
   - Validation issues CSV (for remediation).
   - Activity log JSON (audit trail of recent tool events).

No server-side step exists in this flow for core functionality.

## 6. Local Storage and Retention

DocSmith stores some data locally on the user's device for usability and auditability.

Persisted storage (browser profile):
- Drafts (IndexedDB):
  - Database: `docsmithDrafts`
  - Purpose: save and resume payroll drafts.
  - Retention: until the user deletes drafts or removes the extension/browser profile.
- Preferences (localStorage):
  - Keys: `wpsTheme`, `wpsLang`
  - Purpose: UI preference persistence.
- Diagnostics log (localStorage):
  - Key: `docsmith_watchdog`
  - Purpose: local audit trail for user-visible diagnostics (recent events + counters).
- License state (extension storage, best-effort):
  - Key(s): `docsmith_license_state`, `docsmith_license_key`
  - Purpose: locally store license mode when the storage API is available; otherwise the state is held in memory for the current session.

DocSmith does not write to arbitrary filesystem paths. Exported files are saved via standard browser download flows initiated by the user.

## 7. Network Access Policy

Core workflows are offline-first:
- No telemetry, analytics, or background uploads.
- No required outbound network requests for validation or SIF generation.

Permitted network behavior:
- Loading bundled static assets (extension package).
- Loading packaged routing code data via local fetch (e.g., `fetch("/data/routing-codes.json")` from within the extension origin).
- Opening external reference links only when the user clicks them (for example: public MOHRE pages).

## 8. Browser Permissions and Justification

Declared permissions:
- The current manifest declares no `permissions` and no `host_permissions`.

Extension features used (manifest keys):
- `action.default_popup`: provides a launcher UI (Open Builder, Import Template, Help).
- `side_panel.default_path`: optional UX; if side panel is unsupported or fails, the launcher falls back to opening a tab.
- `background.service_worker`: supports extension routing; core processing remains in the UI page.

Principle:
- Least privilege: the product should operate with minimal permissions required for local processing.

## 9. Threat Model Summary (v1.0)

Top threats:
- Malicious or malformed Excel uploads (macros, encrypted packages, external links, large input).
- Incorrect SIF output due to data entry errors.
- Local data exposure on shared or unmanaged devices.
- Supply chain risk (tampered distribution or dependency compromise).

Mitigations present in v1.0:
- Excel safety guards:
  - File size caps.
  - Reject encrypted workbooks, macro indicators, formulas, and external links.
  - Limit rows, columns, sheets, and cell lengths to control resource usage.
- Validation safeguards:
  - Strong format checks and cross-record consistency checks.
  - Duplicate detection (employee ID, IBAN, pay period).
  - Deterministic output formatting to reduce ambiguity.
- Distribution integrity:
  - Store-based installation for signed packages.
  - No remote hosted code in runtime execution.

Residual risks:
- A compromised endpoint can leak local data regardless of the application design.
- Store review is not a compliance audit; customers should apply their own controls.

## 10. Security Controls (What Exists Today)

- Local-first processing: payroll data is processed on-device.
- Least privilege: no host permissions; no broad browser permissions in v1.0.
- Deterministic outputs: reproducible SIF output given identical inputs.
- Auditability: downloadable validation-issues CSV and activity-log JSON.
- Safe parsing posture for Excel imports: explicit guard checks and caps.

## 11. Evidence and Auditability

DocSmith provides user-exportable artifacts that can be used as evidence:
- Validation issues CSV: lists row-level issues and remediation hints.
- Activity log JSON: captures a rolling local diagnostic log (events and counters).
- Generated SIF file: deterministic output for bank submission.

Operational evidence (internal):
- Release logs and assurance packs are maintained in SWD OS (Notion) and in the governance repository.

## 12. Update Policy

- Browser store updates provide the default distribution and update mechanism.
- Security-relevant changes should be documented in release notes and governance artifacts.

## 13. Vulnerability Disclosure

To report a security issue:
- Email: support@starwealthdynamics.org

Target response:
- Acknowledge within 3 business days.
- Provide triage status within 7 business days.

## 14. Change Log

- 2026-02-09: v1.0 published (supersedes earlier blank upload artifact).

## Appendix A: Deferred Connectors

Deferred connector planning is tracked in `docs/ROADMAP_CONNECTORS.md`. Connectors are out of scope for the current local-first build.
