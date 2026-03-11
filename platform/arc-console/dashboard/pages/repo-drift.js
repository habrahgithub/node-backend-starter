import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { StatusCard } from "../components/StatusCard";
import { fetchJson } from "../lib/apiClient";

export default function RepoDriftPage({ repoDrift, dependencyRisk, warningCount }) {
  return (
    <ConsoleLayout title="Repository Drift" warningCount={warningCount}>
      <section className="status-grid status-grid--four">
        <StatusCard label="Drift Findings" value={repoDrift.summary?.total ?? 0} />
        <StatusCard label="High Drift" value={repoDrift.summary?.high ?? 0} />
        <StatusCard label="Dependency High" value={dependencyRisk.summary?.high ?? 0} />
        <StatusCard label="Alerts" value={(repoDrift.alerts || []).length + (dependencyRisk.alerts || []).length} />
      </section>

      <PanelTable
        title="Repository Drift Detection"
        columns={[
          { key: "repository", label: "Repository" },
          { key: "drift_type", label: "Drift Type" },
          { key: "risk_level", label: "Risk" },
          { key: "confidence_score", label: "Confidence" },
          { key: "recommended_action", label: "Recommendation" }
        ]}
        rows={(repoDrift.items || []).map((item) => ({
          ...item,
          recommended_action: item.recommended_action?.text || "monitor"
        }))}
      />

      <PanelTable
        title="Dependency Intelligence Risks"
        columns={[
          { key: "repository", label: "Repository" },
          { key: "package", label: "Package" },
          { key: "current_version", label: "Current" },
          { key: "risk_score", label: "Risk Score" },
          { key: "recommended_version", label: "Recommendation" }
        ]}
        rows={(dependencyRisk.items || []).slice(0, 30)}
      />
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [repoDrift, dependencyRisk, governance] = await Promise.all([
      fetchJson(context, "/api/intelligence/repo-drift"),
      fetchJson(context, "/api/intelligence/dependency-risk"),
      fetchJson(context, "/api/governance/summary")
    ]);

    return {
      props: {
        repoDrift,
        dependencyRisk,
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        repoDrift: { items: [], alerts: [], summary: { total: 0, high: 0 } },
        dependencyRisk: { items: [], alerts: [], summary: { high: 0 } },
        warningCount: 0
      }
    };
  }
}
