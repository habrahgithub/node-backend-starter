import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { StatusCard } from "../components/StatusCard";
import { fetchJson } from "../lib/apiClient";

export default function ServiceTrendsPage({ trends, warningCount }) {
  return (
    <ConsoleLayout title="Service Trends" warningCount={warningCount}>
      <section className="status-grid status-grid--four">
        <StatusCard label="Services Analyzed" value={trends.summary?.total ?? 0} />
        <StatusCard label="Unstable Services" value={trends.summary?.unstable ?? 0} />
        <StatusCard label="Avg Stability" value={trends.summary?.averageStability ?? 0} />
        <StatusCard label="Alerts" value={(trends.alerts || []).length} />
      </section>

      <PanelTable
        title="Service Trend Analysis"
        columns={[
          { key: "service", label: "Service" },
          { key: "health_trend", label: "Trend" },
          { key: "failure_count", label: "Failures" },
          { key: "stability_score", label: "Stability" },
          { key: "confidence_score", label: "Confidence" }
        ]}
        rows={trends.items || []}
      />

      <PanelTable
        title="Service Intelligence Alerts"
        columns={[
          { key: "severity", label: "Severity" },
          { key: "title", label: "Title" },
          { key: "message", label: "Message" },
          { key: "confidence_score", label: "Confidence" }
        ]}
        rows={trends.alerts || []}
      />
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [trends, governance] = await Promise.all([
      fetchJson(context, "/api/intelligence/service-trends"),
      fetchJson(context, "/api/governance/summary")
    ]);

    return {
      props: {
        trends,
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        trends: { items: [], alerts: [], summary: { total: 0, unstable: 0, averageStability: 0 } },
        warningCount: 0
      }
    };
  }
}
