import { env } from "../config/env.js";
import { getAssistedInsights } from "../assistance/insightInterpreter.js";
import { getRepositoryCleanupAdvice } from "../assistance/repoCleanupAdvisor.js";
import { getServiceDiagnosticGuidance } from "../assistance/diagnosticCopilot.js";
import { getWorkflowGuidance } from "../assistance/workflowAdvisor.js";
import { analyzeDependencyRisk } from "../intelligence/dependencyRiskAnalyzer.js";
import { generatePlatformInsights } from "../intelligence/platformInsightsEngine.js";
import { analyzeRepositoryDrift } from "../intelligence/repoDriftDetector.js";
import { analyzeServiceTrends } from "../intelligence/serviceTrendAnalyzer.js";
import { buildKnowledgeGraph } from "../knowledge/graphBuilder.js";
import { getKnowledgeNodes } from "../knowledge/nodeRegistry.js";
import { mapKnowledgeRelationships } from "../knowledge/relationshipMapper.js";
import { computeGovernanceCompliance } from "../governance/complianceScorer.js";
import { detectGovernanceDrift } from "../governance/driftDetector.js";
import { evaluateGovernancePolicies } from "../governance/policyEvaluator.js";
import { getGovernancePolicies } from "../governance/policyRegistry.js";
import { getGovernanceViolations } from "../governance/violationReporter.js";
import { getPlatformHealth } from "../services/healthMonitor.js";
import { getSystemRegistry } from "../services/systemRegistry.js";
import { detectIncidentPatterns } from "../reliability/incidentPatternDetector.js";
import { getRemediationPlaybooks } from "../reliability/remediationPlaybookEngine.js";
import { analyzeReliabilityTrends } from "../reliability/reliabilityTrendAnalyzer.js";
import { getServiceRecoveryAdvice } from "../reliability/serviceRecoveryAdvisor.js";

const LOADERS = {
  system: () => getSystemRegistry({ forceRefresh: false }),
  health: () => getPlatformHealth({ forceRefresh: false }),
  governance: () => {
    const registry = getSystemRegistry({ forceRefresh: false });
    return {
      warning_count: (registry.warnings || []).length,
      source: registry.source
    };
  },
  governance_policies: () => getGovernancePolicies(),
  governance_evaluation: () => evaluateGovernancePolicies({ forceRefresh: false }),
  governance_drift: () => detectGovernanceDrift({ forceRefresh: false }),
  governance_compliance: () =>
    computeGovernanceCompliance({
      forceRefresh: false,
      persistHistory: false
    }),
  governance_violations: () => getGovernanceViolations({ forceRefresh: false }),
  service_trends: () => analyzeServiceTrends({ forceRefresh: false }),
  repo_drift: () => analyzeRepositoryDrift({ forceRefresh: false }),
  dependency_risk: () => analyzeDependencyRisk({ forceRefresh: false }),
  intelligence_insights: () => generatePlatformInsights({ forceRefresh: false }),
  assistance_insights: () => getAssistedInsights({ forceRefresh: false }),
  assistance_diagnostics: () => getServiceDiagnosticGuidance({ forceRefresh: false }),
  assistance_repo_advice: () => getRepositoryCleanupAdvice({ forceRefresh: false }),
  assistance_workflows: () => getWorkflowGuidance({ forceRefresh: false }),
  reliability_incidents: () => detectIncidentPatterns({ forceRefresh: false }),
  reliability_playbooks: () => getRemediationPlaybooks({ forceRefresh: false }),
  reliability_trends: () => analyzeReliabilityTrends({ forceRefresh: false }),
  reliability_recovery_advice: () => getServiceRecoveryAdvice({ forceRefresh: false }),
  knowledge_nodes: () => getKnowledgeNodes({ forceRefresh: false }),
  knowledge_relationships: () => mapKnowledgeRelationships({ forceRefresh: false }),
  knowledge_graph: () => buildKnowledgeGraph({ forceRefresh: false })
};

function withTimeout(taskName, fn, timeoutMs) {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      resolve({ ok: false, warning: `${taskName} timed out`, data: null });
    }, timeoutMs);

    Promise.resolve()
      .then(fn)
      .then((data) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        resolve({ ok: true, data, warning: "" });
      })
      .catch((error) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        resolve({ ok: false, warning: `${taskName} failed: ${error.message}`, data: null });
      });
  });
}

export async function assembleCopilotContext({ queryType, sources }) {
  const timeoutMs = Math.max(200, Number(env.copilotContextTimeoutMs || 2500));
  const selectedSources = Array.isArray(sources) ? sources : [];
  const data = {};
  const warnings = [];
  const evidenceSources = [];

  for (const source of selectedSources) {
    const loader = LOADERS[source];
    if (!loader) {
      warnings.push(`unknown source requested: ${source}`);
      continue;
    }

    const result = await withTimeout(source, loader, timeoutMs);
    if (result.ok) {
      data[source] = result.data;
      evidenceSources.push(source);
    } else {
      data[source] = null;
      warnings.push(result.warning || `${source} unavailable`);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    queryType,
    sources: selectedSources,
    data,
    evidenceSources,
    warnings
  };
}
