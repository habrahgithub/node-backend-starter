import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { env } from "../config/env.js";
import { getRepositories } from "../services/systemRegistry.js";

function computeGovernanceScore(repo) {
  let score = 100;

  if (repo.status === "dirty") {
    score -= 28;
  } else if (repo.status === "unknown") {
    score -= 40;
  }

  if (repo.repoType === "gitlink") {
    score -= 12;
  } else if (repo.repoType === "nested-repo") {
    score -= 8;
  }

  const dirtyCounts = repo.dirtyCounts || {};
  score -= Math.min(Number(dirtyCounts.modified || 0), 20);
  score -= Math.min(Number(dirtyCounts.deleted || 0) * 2, 20);
  score -= Math.min(Number(dirtyCounts.untracked || 0), 10);

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    rating: score >= 85 ? "healthy" : score >= 60 ? "warning" : "critical"
  };
}

function runGit(repoPath, args) {
  const result = spawnSync("git", ["-C", repoPath, ...args], {
    encoding: "utf8"
  });

  if (result.status !== 0) {
    return {
      ok: false,
      error: (result.stderr || "git command failed").trim()
    };
  }

  return {
    ok: true,
    output: (result.stdout || "").trim()
  };
}

function staleBranchRowsForRepo(repo) {
  const branchResult = runGit(repo.path, [
    "for-each-ref",
    "--format=%(refname:short)|%(committerdate:unix)",
    "refs/heads"
  ]);

  if (!branchResult.ok) {
    return {
      staleBranches: [],
      warning: branchResult.error
    };
  }

  const nowEpoch = Math.floor(Date.now() / 1000);
  const staleDays = Math.max(1, Number(env.repoStaleDays || 45));
  const staleSeconds = staleDays * 86400;

  const staleBranches = branchResult.output
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [name, ts] = line.split("|");
      const committedAt = Number(ts || 0);
      const ageDays = committedAt > 0 ? Math.floor((nowEpoch - committedAt) / 86400) : 0;

      return {
        name,
        committedAt: committedAt > 0 ? new Date(committedAt * 1000).toISOString() : "unknown",
        ageDays
      };
    })
    .filter((branch) => branch.name && !["main", "master", "develop", "dev"].includes(branch.name.toLowerCase()))
    .filter((branch) => branch.ageDays >= staleDays)
    .sort((a, b) => b.ageDays - a.ageDays)
    .slice(0, 10);

  return {
    staleBranches,
    warning: ""
  };
}

function dependencyRiskForRepo(repo) {
  const packageJsonPath = path.join(repo.path, "package.json");
  const lockfilePaths = [
    path.join(repo.path, "package-lock.json"),
    path.join(repo.path, "pnpm-lock.yaml"),
    path.join(repo.path, "yarn.lock")
  ];

  if (!fs.existsSync(packageJsonPath)) {
    return {
      id: repo.id,
      name: repo.name,
      relativePath: repo.relativePath,
      riskLevel: "needs_review",
      reasons: "package.json not found"
    };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const dependencies = parsed.dependencies || {};
    const devDependencies = parsed.devDependencies || {};

    const depCount = Object.keys(dependencies).length;
    const devDepCount = Object.keys(devDependencies).length;
    const hasLockfile = lockfilePaths.some((entry) => fs.existsSync(entry));
    const majorZeroDeps = Object.values(dependencies).filter((version) => /^\^?0\./.test(String(version || "").trim())).length;

    let riskLevel = "low";
    const reasons = [];

    if (!hasLockfile && depCount + devDepCount > 0) {
      riskLevel = "high";
      reasons.push("missing lockfile");
    }

    if (majorZeroDeps >= 5 && riskLevel !== "high") {
      riskLevel = "medium";
      reasons.push("many major-zero dependencies");
    }

    if (depCount + devDepCount >= 80 && riskLevel === "low") {
      riskLevel = "medium";
      reasons.push("large dependency surface");
    }

    if (reasons.length === 0) {
      reasons.push("baseline dependency signals stable");
    }

    return {
      id: repo.id,
      name: repo.name,
      relativePath: repo.relativePath,
      riskLevel,
      dependencyCount: depCount,
      devDependencyCount: devDepCount,
      majorZeroDeps,
      lockfilePresent: hasLockfile,
      reasons: reasons.join(", ")
    };
  } catch (error) {
    return {
      id: repo.id,
      name: repo.name,
      relativePath: repo.relativePath,
      riskLevel: "needs_review",
      reasons: `package.json parse failed: ${error.message}`
    };
  }
}

export function getRepositoryHealth({ forceRefresh = false } = {}) {
  const repos = getRepositories({ forceRefresh });

  const items = repos.map((repo) => {
    const governance = computeGovernanceScore(repo);
    return {
      id: repo.id,
      name: repo.name,
      relativePath: repo.relativePath,
      status: repo.status,
      repoType: repo.repoType,
      governanceScore: governance.score,
      rating: governance.rating,
      dirtyModified: repo.dirtyCounts?.modified ?? 0,
      dirtyDeleted: repo.dirtyCounts?.deleted ?? 0,
      dirtyUntracked: repo.dirtyCounts?.untracked ?? 0
    };
  });

  const averageScore =
    items.length > 0 ? Number((items.reduce((total, item) => total + item.governanceScore, 0) / items.length).toFixed(2)) : 0;

  return {
    generatedAt: new Date().toISOString(),
    items,
    summary: {
      total: items.length,
      healthy: items.filter((item) => item.rating === "healthy").length,
      warning: items.filter((item) => item.rating === "warning").length,
      critical: items.filter((item) => item.rating === "critical").length,
      averageScore
    }
  };
}

export function getStaleBranches({ forceRefresh = false } = {}) {
  const repos = getRepositories({ forceRefresh });

  const items = repos.map((repo) => {
    const stale = staleBranchRowsForRepo(repo);

    return {
      id: repo.id,
      name: repo.name,
      relativePath: repo.relativePath,
      staleCount: stale.staleBranches.length,
      staleBranches: stale.staleBranches.map((branch) => `${branch.name} (${branch.ageDays}d)`).join(", "),
      warning: stale.warning || ""
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    staleAfterDays: Number(env.repoStaleDays || 45),
    items,
    summary: {
      totalRepositories: items.length,
      withStaleBranches: items.filter((item) => item.staleCount > 0).length
    }
  };
}

export function getDependencyRisk({ forceRefresh = false } = {}) {
  const repos = getRepositories({ forceRefresh });
  const items = repos.map((repo) => dependencyRiskForRepo(repo));

  return {
    generatedAt: new Date().toISOString(),
    items,
    summary: {
      total: items.length,
      high: items.filter((item) => item.riskLevel === "high").length,
      medium: items.filter((item) => item.riskLevel === "medium").length,
      low: items.filter((item) => item.riskLevel === "low").length,
      needsReview: items.filter((item) => item.riskLevel === "needs_review").length
    }
  };
}
