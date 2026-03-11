import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { StatusCard } from "../components/StatusCard";
import { fetchJson } from "../lib/apiClient";

export default function DiagnosticsPage({ diagnostics, alerts, warningCount }) {
  return (
    <ConsoleLayout title="Diagnostic Copilot" warningCount={warningCount}>
      <section className="status-grid status-grid--four">
        <StatusCard label="Diagnostic Items" value={diagnostics.summary?.total ?? 0} />
        <StatusCard label="Unstable Services" value={diagnostics.summary?.unstableServices ?? 0} />
        <StatusCard label="Avg Confidence" value={diagnostics.summary?.averageConfidence ?? 0} />
        <StatusCard label="Urgent Alerts" value={alerts.summary?.urgent ?? 0} />
      </section>

      <PanelTable
        title="Service Diagnostic Guidance"
        columns={[
          { key: "service", label: "Service" },
          { key: "issue", label: "Issue" },
          { key: "recommended_workflow", label: "Workflow" },
          { key: "confidence", label: "Confidence" }
        ]}
        rows={diagnostics.items || []}
      />

      <PanelTable
        title="Diagnostic Steps"
        columns={[
          { key: "service", label: "Service" },
          { key: "steps", label: "Guided Steps" }
        ]}
        rows={(diagnostics.items || []).map((item) => ({
          service: item.service,
          steps: (item.diagnostic_steps || []).join(" -> ")
        }))}
      />
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [diagnostics, alerts, governance] = await Promise.all([
      fetchJson(context, "/api/assistance/service-diagnostics"),
      fetchJson(context, "/api/assistance/alerts"),
      fetchJson(context, "/api/governance/summary")
    ]);

    return {
      props: {
        diagnostics,
        alerts,
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        diagnostics: { items: [], summary: { total: 0, unstableServices: 0, averageConfidence: 0 } },
        alerts: { summary: { urgent: 0 } },
        warningCount: 0
      }
    };
  }
}
