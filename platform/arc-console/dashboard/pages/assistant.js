import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { StatusCard } from "../components/StatusCard";
import { fetchJson } from "../lib/apiClient";

export default function AssistantPage({ insights, workflows, warningCount }) {
  return (
    <ConsoleLayout title="Operator Assistant" warningCount={warningCount}>
      <section className="status-grid status-grid--four">
        <StatusCard label="Insight Guidance" value={insights.summary?.total ?? 0} />
        <StatusCard label="Urgent Items" value={insights.summary?.urgent ?? 0} />
        <StatusCard label="Workflow Suggestions" value={workflows.summary?.total ?? 0} />
        <StatusCard label="Approval Mode" value="REQUIRED" detail="Operator approval required" />
      </section>

      <PanelTable
        title="Copilot Insight Interpretation"
        columns={[
          { key: "risk", label: "Risk" },
          { key: "severity", label: "Severity" },
          { key: "recommended_action", label: "Recommended Action" },
          { key: "confidence", label: "Confidence" }
        ]}
        rows={insights.items || []}
      />

      <PanelTable
        title="Workflow Recommendations"
        columns={[
          { key: "workflow", label: "Workflow" },
          { key: "domain", label: "Domain" },
          { key: "reason", label: "Reason" },
          { key: "confidence", label: "Confidence" },
          { key: "status", label: "Status" }
        ]}
        rows={workflows.items || []}
      />
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [insights, workflows, governance] = await Promise.all([
      fetchJson(context, "/api/assistance/insights"),
      fetchJson(context, "/api/assistance/workflows"),
      fetchJson(context, "/api/governance/summary")
    ]);

    return {
      props: {
        insights,
        workflows,
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        insights: { items: [], summary: { total: 0, urgent: 0 } },
        workflows: { items: [], summary: { total: 0 } },
        warningCount: 0
      }
    };
  }
}
