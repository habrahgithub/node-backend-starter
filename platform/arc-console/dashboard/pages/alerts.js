import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { StatusCard } from "../components/StatusCard";
import { fetchJson } from "../lib/apiClient";

export default function AlertsPage({ alerts, warningCount }) {
  return (
    <ConsoleLayout title="Operator Alerts" warningCount={warningCount}>
      <section className="status-grid status-grid--four">
        <StatusCard label="Total Alerts" value={alerts.summary?.total ?? 0} />
        <StatusCard label="Urgent" value={alerts.summary?.urgent ?? 0} />
        <StatusCard label="Attention" value={alerts.summary?.attention ?? 0} />
        <StatusCard label="Monitor" value={alerts.summary?.monitor ?? 0} />
      </section>

      <PanelTable
        title="Prioritized Operator Alerts"
        columns={[
          { key: "category", label: "Category" },
          { key: "level", label: "Level" },
          { key: "title", label: "Title" },
          { key: "summary", label: "Summary" },
          { key: "next_action", label: "Next Action" },
          { key: "confidence", label: "Confidence" }
        ]}
        rows={alerts.items || []}
      />
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [alerts, governance] = await Promise.all([
      fetchJson(context, "/api/assistance/alerts"),
      fetchJson(context, "/api/governance/summary")
    ]);

    return {
      props: {
        alerts,
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        alerts: { items: [], summary: { total: 0, urgent: 0, attention: 0, monitor: 0 } },
        warningCount: 0
      }
    };
  }
}
