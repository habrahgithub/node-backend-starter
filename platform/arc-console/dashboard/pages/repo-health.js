import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { StatusCard } from "../components/StatusCard";
import { fetchJson } from "../lib/apiClient";

export default function RepoHealthPage({ repoHealth, staleBranches, dependencyRisk, warningCount }) {
  return (
    <ConsoleLayout title="Repository Health" warningCount={warningCount}>
      <section className="status-grid status-grid--four">
        <StatusCard label="Repositories" value={repoHealth.summary?.total ?? 0} />
        <StatusCard label="Avg Governance Score" value={repoHealth.summary?.averageScore ?? 0} />
        <StatusCard label="Stale Branch Repos" value={staleBranches.summary?.withStaleBranches ?? 0} />
        <StatusCard label="High Dependency Risk" value={dependencyRisk.summary?.high ?? 0} />
      </section>

      <PanelTable
        title="Governance Scorecard"
        columns={[
          { key: "name", label: "Repository" },
          { key: "status", label: "State" },
          { key: "repoType", label: "Boundary" },
          { key: "governanceScore", label: "Score" },
          { key: "rating", label: "Rating" }
        ]}
        rows={repoHealth.items || []}
      />

      <section className="panel-row">
        <PanelTable
          title="Stale Branch Signals"
          columns={[
            { key: "name", label: "Repository" },
            { key: "staleCount", label: "Stale" },
            { key: "staleBranches", label: "Branches" },
            { key: "warning", label: "Warnings" }
          ]}
          rows={staleBranches.items || []}
        />
        <PanelTable
          title="Dependency Risk Signals"
          columns={[
            { key: "name", label: "Repository" },
            { key: "riskLevel", label: "Risk" },
            { key: "dependencyCount", label: "Deps" },
            { key: "lockfilePresent", label: "Lockfile" },
            { key: "reasons", label: "Reason" }
          ]}
          rows={(dependencyRisk.items || []).map((item) => ({
            ...item,
            lockfilePresent: typeof item.lockfilePresent === "boolean" ? (item.lockfilePresent ? "yes" : "no") : "n/a"
          }))}
        />
      </section>
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [repoHealth, staleBranches, dependencyRisk, governance] = await Promise.all([
      fetchJson(context, "/api/repos/health"),
      fetchJson(context, "/api/repos/stale-branches"),
      fetchJson(context, "/api/repos/dependency-risk"),
      fetchJson(context, "/api/governance/summary")
    ]);

    return {
      props: {
        repoHealth,
        staleBranches,
        dependencyRisk,
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        repoHealth: { items: [], summary: { total: 0, averageScore: 0 } },
        staleBranches: { items: [], summary: { withStaleBranches: 0 } },
        dependencyRisk: { items: [], summary: { high: 0 } },
        warningCount: 0
      }
    };
  }
}
