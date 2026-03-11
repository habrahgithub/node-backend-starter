import { analyzeDependencyRisk } from "../intelligence/dependencyRiskAnalyzer.js";
import { analyzeRepositoryDrift } from "../intelligence/repoDriftDetector.js";

function guidanceSteps(item) {
  return [
    "Review repository drift evidence and dependency signals.",
    "Prepare a branch/dependency cleanup proposal.",
    "Validate proposal with governance constraints.",
    "Run operator-approved repo-audit workflow for confirmation.",
    "Log approved actions and rollback considerations."
  ];
}

export function getRepositoryCleanupAdvice({ forceRefresh = false } = {}) {
  const drift = analyzeRepositoryDrift({ forceRefresh });
  const dependencies = analyzeDependencyRisk({ forceRefresh });

  const dependencyByRepo = new Map();
  for (const row of dependencies.items || []) {
    if (!["high", "medium"].includes(row.risk_level)) {
      continue;
    }

    const existing = dependencyByRepo.get(row.repository) || [];
    existing.push(row);
    dependencyByRepo.set(row.repository, existing);
  }

  const items = (drift.items || []).map((item) => {
    const dependencySignals = dependencyByRepo.get(item.repository) || [];

    return {
      repository: item.repository,
      issue: item.drift_type,
      risk_level: item.risk_level,
      suggested_cleanup: item.recommended_action?.text || "Perform operator-reviewed governance cleanup.",
      dependency_signals: dependencySignals.slice(0, 3).map((dep) => `${dep.package}:${dep.risk_score}`).join(", ") || "none",
      guidance_steps: guidanceSteps(item),
      recommended_workflow: "repo-audit",
      confidence: item.confidence_score,
      evidence: item.evidence,
      operator_approval_required: true
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    mode: "guided_repo_governance",
    items,
    summary: {
      total: items.length,
      high: items.filter((item) => item.risk_level === "high").length,
      medium: items.filter((item) => item.risk_level === "medium").length
    }
  };
}
