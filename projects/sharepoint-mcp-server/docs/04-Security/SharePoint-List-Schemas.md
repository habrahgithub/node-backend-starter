# SharePoint List Schemas (V1 Canonical)

This defines the exact baseline schema for SWD OS rollout.

## 1. MCP Audit Log (required)

List name: `MCP Audit Log`

Columns (internal names should match exactly):
- `Title` (Single line of text) default: `DocSmith Connect Audit`
- `timestamp_gst` (Date and time, required)
- `actor_role` (Choice, required): `Axis`, `Forge`, `Prime`, `System`
- `tool` (Single line of text, required)
- `target` (Single line of text, required)
- `correlation_id` (Single line of text, required)
- `request_hash` (Single line of text, required)
- `result` (Choice, required): `OK`, `ERROR`
- `error` (Multiple lines of text, optional)

Indexes:
- `timestamp_gst`
- `correlation_id`
- `result`
- `tool`

## 2. Execution Inbox (required)

List name: `Execution Inbox`

Columns:
- `Title` (Single line of text, required) map to email subject summary
- `Subject` (Single line of text, required)
- `From` (Single line of text, required)
- `ReceivedAt` (Date and time, required)
- `WebLink` (Hyperlink, required)
- `MessageId` (Single line of text, required, unique intent)
- `Status` (Choice, required): `New`, `Triaged`, `WO Created`, `Ignored`
- `CorrelationId` (Single line of text, optional)

Indexes:
- `ReceivedAt`
- `MessageId`
- `Status`

V1 data minimization rule:
- Do not store body or attachments in this list.

## 3. Work Orders (required)

List name: `Work Orders`

Columns:
- `Title` (Single line of text, required)
- `WOId` (Single line of text, required)
- `Status` (Choice, required): `Open`, `In Progress`, `Blocked`, `Done`, `Cancelled`
- `Priority` (Choice, required): `P1`, `P2`, `P3`, `P4`
- `Owner` (Person or group, optional)
- `RequestedAt` (Date and time, required)
- `DueDate` (Date and time, optional)
- `SourceMessageId` (Single line of text, optional)
- `CorrelationId` (Single line of text, required)
- `EvidenceFolderLink` (Hyperlink, optional)
- `Notes` (Multiple lines of text, optional)

Indexes:
- `WOId`
- `Status`
- `CorrelationId`

## 4. Decision Log (required)

List name: `Decision Log`

Columns:
- `Title` (Single line of text, required)
- `DecisionId` (Single line of text, required)
- `DecisionDate` (Date and time, required)
- `DecisionOwner` (Person or group, required)
- `Outcome` (Choice, required): `Approved`, `Rejected`, `Deferred`
- `Rationale` (Multiple lines of text, required)
- `RelatedWOId` (Single line of text, optional)
- `CorrelationId` (Single line of text, required)

Indexes:
- `DecisionId`
- `DecisionDate`
- `CorrelationId`

## 5. Risk Register (required)

List name: `Risk Register`

Columns:
- `Title` (Single line of text, required)
- `RiskId` (Single line of text, required)
- `RiskLevel` (Choice, required): `Low`, `Medium`, `High`, `Critical`
- `Status` (Choice, required): `Open`, `Mitigating`, `Closed`, `Accepted`
- `Owner` (Person or group, optional)
- `MitigationPlan` (Multiple lines of text, required)
- `ReviewDate` (Date and time, optional)
- `CorrelationId` (Single line of text, optional)

Indexes:
- `RiskId`
- `RiskLevel`
- `Status`

## 6. Release Log (required)

List name: `Release Log`

Columns:
- `Title` (Single line of text, required)
- `ReleaseId` (Single line of text, required)
- `ReleaseDate` (Date and time, required)
- `ChangeSummary` (Multiple lines of text, required)
- `ApprovedBy` (Person or group, required)
- `RelatedDecisionId` (Single line of text, optional)
- `CorrelationId` (Single line of text, optional)

Indexes:
- `ReleaseId`
- `ReleaseDate`

## 7. Governance Docs library mapping

Document library name: `Governance Docs`

Required metadata fields (library columns):
- `Title` (Single line of text)
- `DocType` (Choice): `Evidence`, `Policy`, `Report`, `Work Product`
- `CorrelationId` (Single line of text)
- `RelatedWOId` (Single line of text)

