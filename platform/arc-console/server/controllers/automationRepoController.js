import { getDependencyRisk, getRepositoryHealth, getStaleBranches } from "../automation/repoGovernor.js";

export function getRepositoryHealthController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    res.json(getRepositoryHealth({ forceRefresh }));
  } catch (error) {
    res.status(503).json({
      error: "repo_health_unavailable",
      message: "Repository health scan is unavailable.",
      details: error.message
    });
  }
}

export function getStaleBranchesController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    res.json(getStaleBranches({ forceRefresh }));
  } catch (error) {
    res.status(503).json({
      error: "repo_stale_branches_unavailable",
      message: "Stale branch scan is unavailable.",
      details: error.message
    });
  }
}

export function getDependencyRiskController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    res.json(getDependencyRisk({ forceRefresh }));
  } catch (error) {
    res.status(503).json({
      error: "repo_dependency_risk_unavailable",
      message: "Dependency risk scan is unavailable.",
      details: error.message
    });
  }
}
