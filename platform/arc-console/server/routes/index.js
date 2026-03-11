import { Router } from "express";
import { login, logout, session } from "../controllers/authController.js";
import { getGovernanceSummary } from "../controllers/governanceController.js";
import { getSystemStatus } from "../controllers/systemController.js";
import { listServices, listServiceHealth } from "../controllers/serviceController.js";
import { listRepositories } from "../controllers/repositoryController.js";
import { listAgents } from "../controllers/agentController.js";
import { getHealth } from "../controllers/healthController.js";
import { listLogs } from "../controllers/logController.js";
import {
  getAgentStateAdapterController,
  getServiceHeartbeatAdapterController,
  refreshArtifactSignalsController,
  refreshRepoInventoryController
} from "../controllers/integrationController.js";
import { getOperatorActionsPolicy } from "../controllers/operatorActionsController.js";
import {
  evaluateGovernancePoliciesController,
  getGovernanceComplianceController,
  getGovernanceDriftController,
  getGovernancePoliciesController,
  getGovernanceViolationsController
} from "../controllers/governancePolicyController.js";
import { getAgentStateController, runAgentTaskController } from "../controllers/automationAgentController.js";
import {
  getServiceMetricsController,
  restartServiceController,
  runServiceDiagnosticsController
} from "../controllers/automationServiceController.js";
import {
  getDependencyRiskController,
  getRepositoryHealthController,
  getStaleBranchesController
} from "../controllers/automationRepoController.js";
import { getWorkflowsController, runWorkflowController } from "../controllers/automationWorkflowController.js";
import {
  getAgentActivityController,
  getDependencyRiskIntelligenceController,
  getPlatformInsightsController,
  getRepoDriftController,
  getServiceTrendsController
} from "../controllers/intelligenceController.js";
import {
  getAssistanceAlertsController,
  getAssistanceInsightsController,
  getAssistanceRepoAdviceController,
  getAssistanceServiceDiagnosticsController,
  getAssistanceWorkflowsController
} from "../controllers/assistanceController.js";
import {
  getReliabilityIncidentsController,
  getReliabilityLearningController,
  getReliabilityPlaybookByIncidentController,
  getReliabilityPlaybooksController,
  getReliabilityRecoveryAdviceController,
  getReliabilityTrendsController,
  recordReliabilityLearningController
} from "../controllers/reliabilityController.js";
import {
  getKnowledgeGraphController,
  getKnowledgeNodesController,
  getKnowledgeRelationshipsController,
  getKnowledgeSnapshotsController,
  queryKnowledgeRepositoryController,
  queryKnowledgeServiceController
} from "../controllers/knowledgeController.js";
import {
  getCopilotHistoryController,
  getCopilotSuggestionsController,
  queryCopilotController
} from "../copilot/copilotController.js";
import {
  getFabricNodeController,
  getFabricTelemetryController,
  getFabricTopologyController,
  ingestFabricTelemetryController,
  listFabricNodesController,
  queryFabricController,
  recordFabricNodeHeartbeatController,
  registerFabricNodeController
} from "../controllers/fabricController.js";
import { requireApiAuth } from "../middleware/authMiddleware.js";

export function createRouter() {
  const router = Router();

  router.post("/api/auth/login", login);
  router.post("/api/auth/logout", logout);
  router.get("/api/auth/session", session);

  router.get("/api/health", requireApiAuth, getHealth);

  router.get("/api/system/status", requireApiAuth, getSystemStatus);
  router.get("/api/services", requireApiAuth, listServices);
  router.get("/api/services/health", requireApiAuth, listServiceHealth);
  router.get("/api/repos", requireApiAuth, listRepositories);
  router.get("/api/agents", requireApiAuth, listAgents);
  router.get("/api/governance/summary", requireApiAuth, getGovernanceSummary);
  router.get("/api/governance/policies", requireApiAuth, getGovernancePoliciesController);
  router.get("/api/governance/evaluate", requireApiAuth, evaluateGovernancePoliciesController);
  router.get("/api/governance/drift", requireApiAuth, getGovernanceDriftController);
  router.get("/api/governance/compliance", requireApiAuth, getGovernanceComplianceController);
  router.get("/api/governance/violations", requireApiAuth, getGovernanceViolationsController);
  router.get("/api/logs", requireApiAuth, listLogs);
  router.post("/api/integrations/repo-inventory/refresh", requireApiAuth, refreshRepoInventoryController);
  router.post("/api/integrations/artifacts/refresh", requireApiAuth, refreshArtifactSignalsController);
  router.get("/api/integrations/agent-state", requireApiAuth, getAgentStateAdapterController);
  router.get("/api/integrations/service-heartbeat", requireApiAuth, getServiceHeartbeatAdapterController);
  router.get("/api/operator/actions", requireApiAuth, getOperatorActionsPolicy);
  router.get("/api/agents/state", requireApiAuth, getAgentStateController);
  router.post("/api/agents/run", requireApiAuth, runAgentTaskController);
  router.get("/api/services/metrics", requireApiAuth, getServiceMetricsController);
  router.post("/api/services/diagnostics", requireApiAuth, runServiceDiagnosticsController);
  router.post("/api/services/restart", requireApiAuth, restartServiceController);
  router.get("/api/repos/health", requireApiAuth, getRepositoryHealthController);
  router.get("/api/repos/stale-branches", requireApiAuth, getStaleBranchesController);
  router.get("/api/repos/dependency-risk", requireApiAuth, getDependencyRiskController);
  router.get("/api/workflows", requireApiAuth, getWorkflowsController);
  router.post("/api/workflows/run", requireApiAuth, runWorkflowController);
  router.get("/api/intelligence/service-trends", requireApiAuth, getServiceTrendsController);
  router.get("/api/intelligence/repo-drift", requireApiAuth, getRepoDriftController);
  router.get("/api/intelligence/dependency-risk", requireApiAuth, getDependencyRiskIntelligenceController);
  router.get("/api/intelligence/agent-activity", requireApiAuth, getAgentActivityController);
  router.get("/api/intelligence/insights", requireApiAuth, getPlatformInsightsController);
  router.get("/api/assistance/insights", requireApiAuth, getAssistanceInsightsController);
  router.get("/api/assistance/service-diagnostics", requireApiAuth, getAssistanceServiceDiagnosticsController);
  router.get("/api/assistance/repo-advice", requireApiAuth, getAssistanceRepoAdviceController);
  router.get("/api/assistance/workflows", requireApiAuth, getAssistanceWorkflowsController);
  router.get("/api/assistance/alerts", requireApiAuth, getAssistanceAlertsController);
  router.get("/api/reliability/incidents", requireApiAuth, getReliabilityIncidentsController);
  router.get("/api/reliability/playbooks", requireApiAuth, getReliabilityPlaybooksController);
  router.get("/api/reliability/playbooks/:incidentId", requireApiAuth, getReliabilityPlaybookByIncidentController);
  router.get("/api/reliability/trends", requireApiAuth, getReliabilityTrendsController);
  router.get("/api/reliability/recovery-advice", requireApiAuth, getReliabilityRecoveryAdviceController);
  router.get("/api/reliability/learning", requireApiAuth, getReliabilityLearningController);
  router.post("/api/reliability/learning/record", requireApiAuth, recordReliabilityLearningController);
  router.get("/api/knowledge/nodes", requireApiAuth, getKnowledgeNodesController);
  router.get("/api/knowledge/relationships", requireApiAuth, getKnowledgeRelationshipsController);
  router.get("/api/knowledge/graph", requireApiAuth, getKnowledgeGraphController);
  router.get("/api/knowledge/query/service/:name", requireApiAuth, queryKnowledgeServiceController);
  router.get("/api/knowledge/query/repository/:name", requireApiAuth, queryKnowledgeRepositoryController);
  router.get("/api/knowledge/snapshots", requireApiAuth, getKnowledgeSnapshotsController);
  router.post("/api/copilot/query", requireApiAuth, queryCopilotController);
  router.get("/api/copilot/suggestions", requireApiAuth, getCopilotSuggestionsController);
  router.get("/api/copilot/history", requireApiAuth, getCopilotHistoryController);
  router.post("/api/fabric/nodes/register", requireApiAuth, registerFabricNodeController);
  router.get("/api/fabric/nodes", requireApiAuth, listFabricNodesController);
  router.get("/api/fabric/nodes/:id", requireApiAuth, getFabricNodeController);
  router.post("/api/fabric/nodes/:id/heartbeat", requireApiAuth, recordFabricNodeHeartbeatController);
  router.post("/api/fabric/nodes/:id/telemetry", requireApiAuth, ingestFabricTelemetryController);
  router.get("/api/fabric/telemetry", requireApiAuth, getFabricTelemetryController);
  router.post("/api/fabric/query", requireApiAuth, queryFabricController);
  router.get("/api/fabric/topology", requireApiAuth, getFabricTopologyController);

  return router;
}
