import { getDependencyRisk, getRepositoryHealth, getStaleBranches } from "../automation/repoGovernor.js";

function confidenceFromEvidence(evidenceCount) {
  if (evidenceCount >= 4) {
    return 0.9;
  }

  if (evidenceCount === 3) {
    return 0.83;
  }

  if (evidenceCount === 2) {
    return 0.74;
  }

  return 0.64;
}

function addDrift(items, payload) {
  items.push({
    ...payload,
    confidence_score: Number(confidenceFromEvidence((payload.evidence || []).length).toFixed(2)),
    recommended_action: {
      text: payload.recommended_action,
      operator_approval_required: true
    }
  });
}

export function analyzeRepositoryDrift({ forceRefresh = false } = {}) {
  const repoHealth = getRepositoryHealth({ forceRefresh });
  const stale = getStaleBranches({ forceRefresh });
  const dependencyRisk = getDependencyRisk({ forceRefresh });

  const staleById = new Map((stale.items || []).map((item) => [item.id, item]));
  const dependencyById = new Map((dependencyRisk.items || []).map((item) => [item.id, item]));

  const items = [];

  for (const repo of repoHealth.items || []) {
    const staleItem = staleById.get(repo.id);
    const dependencyItem = dependencyById.get(repo.id);

    if (repo.status === "dirty" || repo.status === "unknown") {
      addDrift(items, {
        repository: repo.name,
        repository_id: repo.id,
        drift_type: "governance_state_drift",
        risk_level: repo.status === "unknown" ? "high" : "medium",
        evidence: [
          `repo_status=${repo.status}`,
          `dirty_modified=${repo.dirtyModified}`,
          `dirty_deleted=${repo.dirtyDeleted}`,
          `dirty_untracked=${repo.dirtyUntracked}`
        ],
        recommended_action: "Review repository state and reconcile unmanaged changes before policy execution."
      });
    }

    if (Number(repo.governanceScore || 0) < 70) {
      addDrift(items, {
        repository: repo.name,
        repository_id: repo.id,
        drift_type: "governance_policy_drift",
        risk_level: Number(repo.governanceScore || 0) < 50 ? "high" : "medium",
        evidence: [
          `governance_score=${repo.governanceScore}`,
          `rating=${repo.rating}`,
          `repo_type=${repo.repoType}`
        ],
        recommended_action: "Run repo-audit workflow and operator review for boundary/policy alignment."
      });
    }

    if ((staleItem?.staleCount || 0) > 0) {
      addDrift(items, {
        repository: repo.name,
        repository_id: repo.id,
        drift_type: "stale_branch_drift",
        risk_level: staleItem.staleCount >= 3 ? "high" : "medium",
        evidence: [
          `stale_count=${staleItem.staleCount}`,
          `stale_branches=${staleItem.staleBranches || "none"}`,
          `scanner_warning=${staleItem.warning || "none"}`
        ],
        recommended_action: "Request operator-approved stale-branch cleanup plan (advisory only in current phase)."
      });
    }

    if (["high", "needs_review"].includes(String(dependencyItem?.riskLevel || ""))) {
      addDrift(items, {
        repository: repo.name,
        repository_id: repo.id,
        drift_type: "dependency_divergence",
        risk_level: dependencyItem.riskLevel === "high" ? "high" : "medium",
        evidence: [
          `dependency_risk=${dependencyItem.riskLevel}`,
          `lockfile_present=${dependencyItem.lockfilePresent}`,
          `dependency_reason=${dependencyItem.reasons}`
        ],
        recommended_action: "Perform dependency review and produce operator-approved remediation backlog item."
      });
    }
  }

  const alerts = items
    .filter((item) => item.risk_level === "high")
    .map((item) => ({
      severity: "high",
      title: `Repository drift alert: ${item.repository}`,
      message: `${item.repository} detected with ${item.drift_type}.`,
      evidence: item.evidence,
      confidence_score: item.confidence_score
    }));

  return {
    generatedAt: new Date().toISOString(),
    mode: "advisory_read_only",
    items,
    alerts,
    summary: {
      total: items.length,
      high: items.filter((item) => item.risk_level === "high").length,
      medium: items.filter((item) => item.risk_level === "medium").length,
      repositoriesAnalyzed: (repoHealth.items || []).length
    }
  };
}
