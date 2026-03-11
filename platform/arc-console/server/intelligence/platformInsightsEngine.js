import { analyzeAgentActivity } from "./agentActivityAnalyzer.js";
import { analyzeDependencyRisk } from "./dependencyRiskAnalyzer.js";
import { analyzeRepositoryDrift } from "./repoDriftDetector.js";
import { analyzeServiceTrends } from "./serviceTrendAnalyzer.js";
import { computeGovernanceCompliance } from "../governance/complianceScorer.js";
import { getGovernanceViolations } from "../governance/violationReporter.js";

function averageConfidence(items) {
  if (!items || items.length === 0) {
    return 0;
  }

  return Number((items.reduce((total, item) => total + Number(item.confidence_score || 0), 0) / items.length).toFixed(2));
}

function riskWeight(level) {
  if (level === "critical") {
    return 4;
  }
  if (level === "high") {
    return 3;
  }
  if (level === "medium") {
    return 2;
  }
  return 1;
}

function rankedTopRisks(serviceTrends, repoDrift, dependencyRisk, agentActivity, governanceViolations) {
  const rows = [];

  for (const item of serviceTrends.items || []) {
    if (item.stability_score >= 70) {
      continue;
    }

    const riskLevel = item.stability_score < 45 ? "high" : "medium";
    rows.push({
      domain: "services",
      subject: item.service,
      risk_level: riskLevel,
      confidence_score: item.confidence_score,
      evidence: item.evidence,
      recommendation: item.recommended_action?.text,
      operator_approval_required: true
    });
  }

  for (const item of repoDrift.items || []) {
    rows.push({
      domain: "repositories",
      subject: item.repository,
      risk_level: item.risk_level,
      confidence_score: item.confidence_score,
      evidence: item.evidence,
      recommendation: item.recommended_action?.text,
      operator_approval_required: true
    });
  }

  for (const item of dependencyRisk.items || []) {
    if (item.risk_level === "low") {
      continue;
    }

    rows.push({
      domain: "dependencies",
      subject: `${item.repository}:${item.package}`,
      risk_level: item.risk_level,
      confidence_score: item.confidence_score,
      evidence: item.evidence,
      recommendation: "Schedule operator-approved dependency review and upgrade plan.",
      operator_approval_required: true
    });
  }

  for (const item of agentActivity.items || []) {
    if (!["stalled", "unstable"].includes(item.activity_trend)) {
      continue;
    }

    rows.push({
      domain: "agents",
      subject: item.agent,
      risk_level: item.success_rate < 50 ? "high" : "medium",
      confidence_score: item.confidence_score,
      evidence: item.evidence,
      recommendation: item.recommended_action?.text,
      operator_approval_required: true
    });
  }

  for (const item of governanceViolations.items || []) {
    rows.push({
      domain: "governance",
      subject: `${item.component}:${item.policy}`,
      risk_level: item.severity,
      confidence_score: item.confidence,
      evidence: item.evidence,
      recommendation: item.recommended_action,
      operator_approval_required: true
    });
  }

  rows.sort((a, b) => {
    const weightDiff = riskWeight(b.risk_level) - riskWeight(a.risk_level);
    if (weightDiff !== 0) {
      return weightDiff;
    }

    return Number(b.confidence_score || 0) - Number(a.confidence_score || 0);
  });

  return rows.slice(0, 20);
}

function buildRecommendedActions(topRisks) {
  const actions = [];
  const byDomain = new Map();

  for (const risk of topRisks) {
    if (!byDomain.has(risk.domain)) {
      byDomain.set(risk.domain, risk);
    }
  }

  for (const [domain, risk] of byDomain.entries()) {
    actions.push({
      domain,
      action: risk.recommendation || "Run operator review workflow.",
      target: risk.subject,
      operator_approval_required: true,
      evidence: risk.evidence,
      confidence_score: risk.confidence_score
    });
  }

  return actions;
}

export function generatePlatformInsights({ forceRefresh = false } = {}) {
  const serviceTrends = analyzeServiceTrends({ forceRefresh });
  const repoDrift = analyzeRepositoryDrift({ forceRefresh });
  const dependencyRisk = analyzeDependencyRisk({ forceRefresh });
  const agentActivity = analyzeAgentActivity({ forceRefresh });
  const governanceViolations = getGovernanceViolations({ forceRefresh });
  const governanceCompliance = computeGovernanceCompliance({
    forceRefresh,
    persistHistory: false
  });

  const topRisks = rankedTopRisks(serviceTrends, repoDrift, dependencyRisk, agentActivity, governanceViolations);
  const recommendedActions = buildRecommendedActions(topRisks);

  return {
    generatedAt: new Date().toISOString(),
    mode: "advisory_read_only",
    top_risks: topRisks,
    recommended_actions: recommendedActions,
    confidence_scores: {
      services: averageConfidence(serviceTrends.items),
      repositories: averageConfidence(repoDrift.items),
      dependencies: averageConfidence(dependencyRisk.items),
      agents: averageConfidence(agentActivity.items),
      governance: averageConfidence(governanceViolations.items),
      overall: averageConfidence(topRisks)
    },
    evidence_links: [
      "/api/intelligence/service-trends",
      "/api/intelligence/repo-drift",
      "/api/intelligence/dependency-risk",
      "/api/intelligence/agent-activity",
      "/api/governance/summary",
      "/api/governance/violations",
      "/api/governance/compliance"
    ],
    summaries: {
      service_trends: serviceTrends.summary,
      repo_drift: repoDrift.summary,
      dependency_risk: dependencyRisk.summary,
      agent_activity: agentActivity.summary,
      governance_violations: governanceViolations.summary,
      governance_compliance: governanceCompliance.summary
    }
  };
}
