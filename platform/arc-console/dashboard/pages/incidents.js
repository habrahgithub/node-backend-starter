import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { StatusCard } from "../components/StatusCard";
import { fetchJson } from "../lib/apiClient";

export default function IncidentsPage({ incidents, warningCount }) {
  return (
    <ConsoleLayout title="Incident Patterns" warningCount={warningCount}>
      <section className="status-grid status-grid--four">
        <StatusCard label="Total Incidents" value={incidents.summary?.total ?? 0} />
        <StatusCard label="High" value={incidents.summary?.high ?? 0} />
        <StatusCard label="Medium" value={incidents.summary?.medium ?? 0} />
        <StatusCard label="Low" value={incidents.summary?.low ?? 0} />
      </section>

      <PanelTable
        title="Detected Incident Patterns"
        columns={[
          { key: "incident_id", label: "Incident" },
          { key: "service", label: "Service" },
          { key: "pattern_type", label: "Pattern" },
          { key: "severity", label: "Severity" },
          { key: "occurrence_count", label: "Occurrences" },
          { key: "confidence", label: "Confidence" }
        ]}
        rows={incidents.items || []}
      />

      <PanelTable
        title="Incident Evidence"
        columns={[
          { key: "incident_id", label: "Incident" },
          { key: "evidence", label: "Evidence" }
        ]}
        rows={(incidents.items || []).map((item) => ({
          incident_id: item.incident_id,
          evidence: (item.evidence || []).join(" | ")
        }))}
      />
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [incidents, governance] = await Promise.all([
      fetchJson(context, "/api/reliability/incidents"),
      fetchJson(context, "/api/governance/summary")
    ]);

    return {
      props: {
        incidents,
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        incidents: { items: [], summary: { total: 0, high: 0, medium: 0, low: 0 } },
        warningCount: 0
      }
    };
  }
}
