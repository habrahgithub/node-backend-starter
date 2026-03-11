import fs from "fs";
import path from "path";
import { getRepositories } from "../services/systemRegistry.js";

function recommendedVersionFor(currentVersion) {
  const value = String(currentVersion || "").trim();

  if (!value || value === "*") {
    return "pin to a reviewed stable semver range";
  }

  if (/^(file:|link:|workspace:|github:|git\+|https?:)/.test(value)) {
    return "replace with audited registry version and pinned range";
  }

  if (/^\^?0\./.test(value) || /^~0\./.test(value)) {
    return "review latest stable major (manual validation required)";
  }

  return "review latest compatible minor/patch (manual approval required)";
}

function scoreDependencyRisk(version, repoPenalty = 0) {
  const value = String(version || "").trim();
  let score = 18 + repoPenalty;

  if (!value || value === "*") {
    score += 50;
  }

  if (/^(file:|link:|workspace:|github:|git\+|https?:)/.test(value)) {
    score += 35;
  }

  if (/^\^?0\./.test(value) || /^~0\./.test(value)) {
    score += 22;
  }

  if (/^[~^]?\d+\.\d+\.\d+$/.test(value)) {
    score += 8;
  }

  return Math.max(0, Math.min(100, score));
}

function riskLevel(score) {
  if (score >= 75) {
    return "high";
  }

  if (score >= 45) {
    return "medium";
  }

  return "low";
}

function confidenceForDependency(version) {
  const value = String(version || "").trim();
  let confidence = 0.6;

  if (value) {
    confidence += 0.18;
  }

  if (/^[~^]?\d+\.\d+\.\d+$/.test(value)) {
    confidence += 0.12;
  }

  return Number(Math.min(0.92, confidence).toFixed(2));
}

export function analyzeDependencyRisk({ forceRefresh = false } = {}) {
  const repos = getRepositories({ forceRefresh });
  const rows = [];

  for (const repo of repos) {
    const packageJsonPath = path.join(repo.path, "package.json");

    if (!fs.existsSync(packageJsonPath)) {
      continue;
    }

    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    } catch {
      rows.push({
        package: "package.json",
        repository: repo.name,
        current_version: "unreadable",
        recommended_version: "fix package.json parse error before dependency analysis",
        risk_score: 80,
        risk_level: "high",
        confidence_score: 0.7,
        evidence: [`repo=${repo.name}`, "package_json_parse=failed"],
        operator_approval_required: true
      });
      continue;
    }

    const allDeps = {
      ...(parsed.dependencies || {}),
      ...(parsed.devDependencies || {})
    };

    const repoPenalty = repo.status === "dirty" ? 10 : repo.status === "unknown" ? 14 : 0;

    for (const [name, version] of Object.entries(allDeps)) {
      const score = scoreDependencyRisk(version, repoPenalty);

      rows.push({
        package: name,
        repository: repo.name,
        current_version: String(version),
        recommended_version: recommendedVersionFor(version),
        risk_score: score,
        risk_level: riskLevel(score),
        confidence_score: confidenceForDependency(version),
        evidence: [
          `repo=${repo.name}`,
          `repo_status=${repo.status}`,
          `declared_version=${version}`,
          `dependency_source=package.json`
        ],
        operator_approval_required: true
      });
    }
  }

  rows.sort((a, b) => b.risk_score - a.risk_score);
  const items = rows.slice(0, 250);

  const alerts = items
    .filter((item) => item.risk_level === "high")
    .slice(0, 30)
    .map((item) => ({
      severity: "high",
      title: `Dependency risk alert: ${item.package}`,
      message: `${item.package} in ${item.repository} scored ${item.risk_score}.`,
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
      low: items.filter((item) => item.risk_level === "low").length
    }
  };
}
