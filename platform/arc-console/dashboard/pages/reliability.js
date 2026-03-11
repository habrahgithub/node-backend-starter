import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { StatusCard } from "../components/StatusCard";
import { fetchJson } from "../lib/apiClient";

export default function ReliabilityPage({ incidents, trends, learning, warningCount }) {
  return (
    <ConsoleLayout title="Reliability Advisory" warningCount={warningCount}>
      <section className="status-grid status-grid--four">
        <StatusCard label="Incidents" value={incidents.summary?.total ?? 0} />
        <StatusCard label="High Severity" value={incidents.summary?.high ?? 0} />
        <StatusCard label="Platform Trend" value={trends.summary?.platform_trend ?? "unknown"} />
        <StatusCard label="Learning Records" value={learning.summary?.total ?? 0} />
      </section>

      <section className="panel-row">
        <PanelTable
          title="Reliability Incident Clusters"
          columns={[
            { key: "incident_id", label: "Incident" },
            { key: "service", label: "Service" },
            { key: "pattern_type", label: "Pattern" },
            { key: "severity", label: "Severity" },
            { key: "occurrence_count", label: "Count" }
          ]}
          rows={(incidents.items || []).slice(0, 20)}
        />
        <PanelTable
          title="Reliability Trend Summary"
          columns={[
            { key: "service", label: "Service" },
            { key: "reliability_score", label: "Score" },
            { key: "trend", label: "Trend" },
            { key: "risk_level", label: "Risk" }
          ]}
          rows={(trends.items || []).slice(0, 20)}
        />
      </section>

      <PanelTable
        title="Incident Learning Ledger"
        columns={[
          { key: "incident_id", label: "Incident" },
          { key: "lesson", label: "Lesson" },
          { key: "prevention_recommendation", label: "Prevention" },
          { key: "confidence", label: "Confidence" }
        ]}
        rows={(learning.items || []).slice(0, 12)}
      />
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [incidents, trends, learning, governance] = await Promise.all([
      fetchJson(context, "/api/reliability/incidents"),
      fetchJson(context, "/api/reliability/trends"),
      fetchJson(context, "/api/reliability/learning"),
      fetchJson(context, "/api/governance/summary")
    ]);

    return {
      props: {
        incidents,
        trends,
        learning,
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        incidents: { items: [], summary: { total: 0, high: 0 } },
        trends: { items: [], summary: { platform_trend: "unknown" } },
        learning: { items: [], summary: { total: 0 } },
        warningCount: 0
      }
    };
  }
}
