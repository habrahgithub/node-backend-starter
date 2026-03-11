import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { StatusCard } from "../components/StatusCard";
import { fetchJson } from "../lib/apiClient";

export default function CompliancePage({ compliance, drift, warningCount }) {
  return (
    <ConsoleLayout title="Governance Compliance" warningCount={warningCount}>
      <section className="status-grid status-grid--four">
        <StatusCard label="Overall" value={compliance.overall_score ?? 0} />
        <StatusCard label="Node Score" value={compliance.node_score ?? 0} />
        <StatusCard label="Service Score" value={compliance.service_score ?? 0} />
        <StatusCard label="Repo Score" value={compliance.repo_score ?? 0} detail={`Trend: ${compliance.trend || "unknown"}`} />
      </section>

      <section className="panel-row">
        <PanelTable
          title="Compliance History"
          columns={[
            { key: "at", label: "Timestamp" },
            { key: "overall_score", label: "Overall" },
            { key: "node_score", label: "Node" },
            { key: "service_score", label: "Service" },
            { key: "repo_score", label: "Repo" },
            { key: "trend", label: "Trend" }
          ]}
          rows={compliance.history || []}
        />

        <PanelTable
          title="Drift Findings"
          columns={[
            { key: "component", label: "Component" },
            { key: "drift_type", label: "Drift Type" },
            { key: "severity", label: "Severity" },
            { key: "recommended_action", label: "Recommended Action" }
          ]}
          rows={drift.items || []}
        />
      </section>
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [compliance, drift, governance] = await Promise.all([
      fetchJson(context, "/api/governance/compliance"),
      fetchJson(context, "/api/governance/drift"),
      fetchJson(context, "/api/governance/summary")
    ]);

    return {
      props: {
        compliance,
        drift,
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        compliance: { overall_score: 0, node_score: 0, service_score: 0, repo_score: 0, trend: "unknown", history: [] },
        drift: { items: [] },
        warningCount: 0
      }
    };
  }
}
