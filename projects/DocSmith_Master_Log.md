# DocSmith Payroll / SIF Extension - Master Log

Created: 2026-02-18  
Source repo: `/home/habib/workspace/projects/swd-docsmith-sif-extension`  
Scope: As-built product snapshot across UX, architecture, security, compliance, legal, commercial, branding, and delivery.

---

## 0) One-liner + positioning
- Product name: DocSmith SIF Generator / DocSmith Payroll
- Primary promise: Generate UAE WPS SIF files locally with strict validation and controlled Excel import.
- Target user persona: Payroll accountant, HR/payroll officer, SME operations/finance owner.
- Primary differentiator: Local-first processing, strict template contract, validation-driven export flow.

## 1) Current status (as-built reality)
### Implemented
- Start/Import/Build guided workflow in one React app (`app/page.jsx`)
- Strict Excel contract import (`MonthlyPayroll` + `Master`) with exact header enforcement (`src/lib/excelImport.js`)
- Row/global validation (`src/lib/validation.js`)
- SIF generation (`EDR`, optional `EVP`, `SCR`) (`src/lib/sifGenerator.js`)
- Draft save/resume via IndexedDB (`src/lib/draftStore.js`)
- JSON session export/import in-app (`app/page.jsx`)
- Routing dataset lookup + IBAN/routing helper warnings (`src/domain/routing/*`)
- License + checkout + claim redemption flows (`src/lib/licenseApi.js`)
- EN/AR localization with RTL support (`src/lib/i18n/*`, `app/page.module.css`)
- Chrome and Edge extension builds via Vite

### Partial / inconsistent
- Release checklist permission section still reflects older permission model
- Popup files remain in repo though action flow is now service-worker driven for side panel activation
- UI tier copy shows Free/Pro/Business counts, but client-side gate is effectively free-vs-licensed

### Version / release data
- Package version: `1.0.2` (`package.json`)
- Extension manifests: `1.0.2`
- Changelog references:
  - `v1.0.0-rc1 (2026-01-27)`
  - Phase 2 completion (2026-01-28)

## 2) UI / UX (surfaces + flow)
### Surfaces
- Extension app page (`chrome/extension/index.html`, `edge/extension/index.html`)
- Side panel configured and opened per active tab
- Action click opens side panel on the active browser tab

### User monthly flow (as experienced)
1. Click extension icon
2. Go to Import tab
3. Download/upload official `.xlsx` template
4. Review import summary + issue CSV
5. Go to Build tab
6. Complete employer + employee fields
7. Validate and download SIF
8. Fix issues and repeat until export succeeds

### Editing model
- Hybrid: import from Excel and edit rows directly in Build tab

### Error UX
- Row/global issue list + downloadable issue CSV
- Import guards with specific failure reasons and fix guidance

### Accessibility / localization
- Keyboard shortcuts + modal focus controls
- EN/AR language toggle + RTL support
- Desktop-first interaction model

## 3) Data model + storage
### Storage locations
- IndexedDB: drafts (`docsmithDrafts`)
- `chrome.storage.local`: license/install metadata
- `localStorage`: language/theme/watchdog log

### Entities
- Employer metadata
- Employee rows (fixed/variable + routing/IBAN + leave + EVP fields)
- Draft/session payloads
- License entitlement metadata
- Local watchdog events

### Multi-company handling
- Draft persistence is now scoped by `companyId` (default company stub currently active in UI)

### Backup/restore
- JSON export/import for sessions and drafts

## 4) Security & privacy
### Network calls
- Local static fetch for routing dataset
- External calls only for licensing/checkout/claim flows:
  - `https://licensing.docsmith.tools/*`
  - `https://buy.docsmith.tools/*`

### At-rest security
- No app-level encryption for drafts/storage

### Session controls
- No explicit lock/auto-lock timer

### Audit trail
- Local watchdog event log (not tamper-evident)

### Privacy posture in copy
- Explicit local-processing/no payroll upload messaging in UI text

## 5) Architecture (MV3)
### Manifest / permissions
- `manifest_version: 3`
- `permissions`: `storage`, `sidePanel`
- `host_permissions`: licensing and buy domains only

### Component responsibilities
- Service worker: action click orchestration (open side panel on current tab)
- UI app: workflow, validations, data editing, export
- Worker (`sif.worker.js`): validate/build execution, with main-thread fallback
- No content scripts
- No offscreen document

### Performance guardrails
- XLSX limits enforced (size, sheets, rows, columns, cell length)
- Rejection of encrypted/macro/external-link/hidden/merged workbook patterns

## 6) Validation & UAE WPS compliance behavior
### Input validation
- Employer MOL format
- Salary month MMYYYY
- Pay period validity/alignment
- Employer routing 9 digits
- Employee MOL person code 14 digits
- IBAN (AE + checksum and structure)
- Routing 9 digits
- Fixed/variable non-negative numeric checks
- Leave day bounds
- Duplicate checks (employee, IBAN, period patterns)

### Output validation
- SIF record structure checks for EDR/EVP/SCR
- Record field counts/types/order checks
- Totals consistency checks

### Fail policy
- Fail-closed for blocking errors before SIF build/export
- Warnings can be shown but export requires no blocking issues

## 7) Frontend / backend / licensing
- Backend scope: licensing + checkout APIs only (no payroll processing backend)
- Entitlement lifecycle: activation, offline token refresh, claim code redemption
- Checkout flow: session creation + fallback manual buy portal
- Support channel references: `support@starwealthdynamics.org`

## 8) Commercial model (as represented in code)
### Tier labels in UI copy
- FREE (10 employees)
- PRO (30 employees)
- BUSINESS (100 employees)

### Runtime gating in client code
- Free limit: 10 rows
- Licensed mode: unlimited client-side export gate

### Gap
- Tier messaging and hard enforcement are not fully aligned in client logic

## 9) Legal + store-readiness
- Chrome release checklist exists (`docs/chrome-release-checklist.md`)
- Checklist includes privacy/data-practice guidance
- Privacy/terms public page links are referenced as required process items, but final URLs are not centralized in this repo snapshot
- Company reference appears in footer copy (Star Wealth Dynamics LLC / SHAMS)

## 10) Brand & messaging
- Tone: trust/compliance/audit-forward
- Product claims emphasize local-first processing and privacy
- Brand assets in `public/brand/*`
- Visual system in `app/page.module.css` (light/dark + trust palette)

## 11) Gap analysis
### UX
- Residual popup artifacts create maintenance ambiguity after side-panel-first action behavior
- Multi-company operations model is not explicit

### Tech
- Release checklist permission section out of sync with manifest
- Tier enforcement logic mismatch vs visible pricing language

### Security
- No local encryption layer for stored payroll drafts/sessions
- No idle auto-lock/session-lock control

### Compliance
- Strong rule engine present, but no formal compliance traceability matrix in repo docs

### Legal
- Privacy/Terms implementation linkage needs explicit, verifiable repo-level source of truth

### Commercial
- Packaging/tier enforcement needs hard alignment

## 12) Prioritized roadmap (Phase 1-4)
### Phase 1 (1-2 weeks)
- Align release docs with current MV3 permissions and side-panel behavior
- Remove/deprecate popup artifacts and stale references
- Publish architecture note in docs

### Phase 2 (2-4 weeks)
- Enforce tier limits consistently (FREE/PRO/BUSINESS) based on entitlement
- Wire final legal policy links into app/store process
- Add retention controls for drafts/logs

### Phase 3 (3-5 weeks)
- Optional encrypted local vault for sensitive artifacts
- Session auto-lock and unlock UX
- Signed/auditable event export improvements

### Phase 4 (4-8 weeks)
- Multi-company workspace model
- Compliance evidence pack workflow
- Store/GTM packaging hardening with launch metrics instrumentation

---

## Appendix A - Key references
- `chrome/extension/public/manifest.json`
- `edge/extension/public/manifest.json`
- `chrome/extension/public/service_worker.js`
- `edge/extension/public/service_worker.js`
- `app/page.jsx`
- `src/lib/excelImport.js`
- `src/lib/xlsxGuards.js`
- `src/lib/validation.js`
- `src/lib/sifGenerator.js`
- `src/lib/sifValidator.js`
- `src/lib/licenseApi.js`
- `src/lib/licenseStore.js`
- `src/lib/draftStore.js`
- `docs/chrome-release-checklist.md`
- `CHANGELOG.md`
