import fs from "fs";
import path from "path";
import { env } from "../config/env.js";
import { detectGovernanceDrift } from "./driftDetector.js";
import { evaluateGovernancePolicies } from "./policyEvaluator.js";

function safeReadHistory() {
  const filePath = env.governanceComplianceHistoryPath;
  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWriteHistory(items) {
  const filePath = env.governanceComplianceHistoryPath;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(items, null, 2), "utf8");
}

function clampScore(value) {
  return Number(Math.max(0, Math.min(100, value)).toFixed(2));
}

function scoreFromCounts({ pass = 0, violation = 0, needsReview = 0 }, penaltyWeight = 14) {
  const total = pass + violation + needsReview;
  if (total === 0) {
    return 100;
  }

  const penalty = violation * penaltyWeight + needsReview * Math.max(4, Math.floor(penaltyWeight / 2));
  return clampScore(100 - penalty);
}

function driftPenalty(driftSummary) {
  return Number(driftSummary.high || 0) * 12 + Number(driftSummary.medium || 0) * 7 + Number(driftSummary.low || 0) * 3;
}

function detectTrend(previousScore, currentScore) {
  if (!Number.isFinite(previousScore)) {
    return "unknown";
  }

  if (currentScore >= previousScore + 2) {
    return "up";
  }
  if (currentScore <= previousScore - 2) {
    return "down";
  }
  return "stable";
}

export function computeGovernanceCompliance({ forceRefresh = false, persistHistory = true } = {}) {
  const evaluation = evaluateGovernancePolicies({ forceRefresh });
  const drift = detectGovernanceDrift({ forceRefresh });

  const nodePolicies = evaluation.items.filter((item) => item.evaluation_target.includes("fabric") || item.policy_id.includes("heartbeat"));
  const servicePolicies = evaluation.items.filter((item) => item.evaluation_target.includes("service"));
  const repoPolicies = evaluation.items.filter(
    (item) => item.evaluation_target.includes("repo") || item.evaluation_target.includes("depend")
  );

  const nodeScore = scoreFromCounts({
    pass: nodePolicies.filter((item) => item.status === "pass").length,
    violation: nodePolicies.filter((item) => item.status === "violation").length,
    needsReview: nodePolicies.filter((item) => item.status === "needs_review").length
  });

  const serviceScore = scoreFromCounts({
    pass: servicePolicies.filter((item) => item.status === "pass").length,
    violation: servicePolicies.filter((item) => item.status === "violation").length,
    needsReview: servicePolicies.filter((item) => item.status === "needs_review").length
  });

  const repoScore = scoreFromCounts({
    pass: repoPolicies.filter((item) => item.status === "pass").length,
    violation: repoPolicies.filter((item) => item.status === "violation").length,
    needsReview: repoPolicies.filter((item) => item.status === "needs_review").length
  });

  const baseOverall =
    evaluation.summary.total === 0
      ? 100
      : scoreFromCounts(
          {
            pass: evaluation.summary.pass,
            violation: evaluation.summary.violation,
            needsReview: evaluation.summary.needs_review
          },
          12
        );

  const overallScore = clampScore(baseOverall - driftPenalty(drift.summary));

  const history = safeReadHistory();
  const previousScore = history[0]?.overall_score;
  const trend = detectTrend(Number(previousScore), overallScore);

  const record = {
    at: new Date().toISOString(),
    overall_score: overallScore,
    node_score: nodeScore,
    service_score: serviceScore,
    repo_score: repoScore,
    trend
  };

  const nextHistory = [record, ...history].slice(0, 300);
  if (persistHistory) {
    safeWriteHistory(nextHistory);
  }

  return {
    generatedAt: new Date().toISOString(),
    mode: "advisory_read_only",
    overall_score: overallScore,
    node_score: nodeScore,
    service_score: serviceScore,
    repo_score: repoScore,
    trend,
    history: nextHistory.slice(0, 30),
    summary: {
      policy_violations: evaluation.summary.violation,
      policy_needs_review: evaluation.summary.needs_review,
      drift_findings: drift.summary.total
    }
  };
}
