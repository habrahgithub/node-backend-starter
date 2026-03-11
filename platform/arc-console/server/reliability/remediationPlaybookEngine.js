import { detectIncidentPatterns } from "./incidentPatternDetector.js";

function playbookTemplate(patternType) {
  if (patternType === "recurring_diagnostics_failure") {
    return {
      title: "Recurring Diagnostics Failure Playbook",
      steps: [
        "Run service diagnostics simulation and collect output.",
        "Review dependency and repository drift intelligence for the service.",
        "Run platform-health-check workflow (operator-approved).",
        "Document unresolved blockers in the reliability learning ledger."
      ],
      prerequisites: [
        "Authenticated operator session",
        "Latest intelligence data available",
        "Service diagnostics simulation completed"
      ],
      rollback: [
        "No runtime mutation performed; rollback equals no-op.",
        "If any operator-run action starts, capture checkpoint before change."
      ]
    };
  }

  if (patternType === "warning_cluster" || patternType === "incident_cluster") {
    return {
      title: "Warning Cluster Stabilization Playbook",
      steps: [
        "Group warning signals by service and timestamp window.",
        "Validate whether warnings map to one dependency or workflow path.",
        "Run repo-audit and platform-health-check workflows in sequence.",
        "Create operator-approved remediation ticket for the top risk source."
      ],
      prerequisites: ["Authenticated operator session", "Recent logs available", "Workflow approvals prepared"],
      rollback: [
        "Advisory-only steps have no direct rollback.",
        "If operator executes a manual fix, ensure rollback path is documented before applying."
      ]
    };
  }

  if (patternType === "stability_drift") {
    return {
      title: "Service Stability Drift Playbook",
      steps: [
        "Re-run service trend and reliability trend analysis with refresh=true.",
        "Compare current stability score against prior warning clusters.",
        "Execute diagnostic copilot sequence and capture findings.",
        "Escalate to governed remediation proposal if drift persists."
      ],
      prerequisites: ["Authenticated operator session", "Trend analysis available"],
      rollback: ["Analysis-only actions do not mutate state.", "Store findings in reliability ledger for traceability."]
    };
  }

  return {
    title: "Reliability Watch Playbook",
    steps: [
      "Monitor service and incident patterns for recurrence.",
      "Keep operator alerts active and review daily.",
      "Promote to focused playbook when recurrence count increases."
    ],
    prerequisites: ["Authenticated operator session"],
    rollback: ["No state changes performed."]
  };
}

function mapIncidentToPlaybook(incident) {
  const template = playbookTemplate(incident.pattern_type);

  return {
    incident_id: incident.incident_id,
    service: incident.service,
    playbook_title: template.title,
    recommended_steps: template.steps,
    prerequisites: template.prerequisites,
    rollback_checks: template.rollback,
    approval_required: true,
    confidence: Number(Math.min(0.98, Number(incident.confidence || 0.7) + 0.05).toFixed(2)),
    evidence: incident.evidence
  };
}

export function getRemediationPlaybooks({ forceRefresh = false } = {}) {
  const incidents = detectIncidentPatterns({ forceRefresh });
  const items = (incidents.items || []).map(mapIncidentToPlaybook);

  return {
    generatedAt: new Date().toISOString(),
    mode: "advisory_playbooks",
    items,
    summary: {
      total: items.length,
      approvalRequired: items.filter((item) => item.approval_required).length
    }
  };
}

export function getRemediationPlaybookByIncident(incidentId, { forceRefresh = false } = {}) {
  const all = getRemediationPlaybooks({ forceRefresh });
  return (all.items || []).find((item) => item.incident_id === incidentId) || null;
}
