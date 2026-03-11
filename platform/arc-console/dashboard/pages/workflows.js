import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { StatusCard } from "../components/StatusCard";
import { fetchJson } from "../lib/apiClient";

function toWorkflowHistoryRows(logItems) {
  return (logItems || [])
    .filter((item) => item.source === "operator-action" && item.action === "workflow.run")
    .slice(0, 25)
    .map((item) => ({
      id: item.id,
      at: item.at,
      operator: item.operator || "operator",
      target: item.target,
      result: item.result,
      durationMs: item.durationMs ?? 0
    }));
}

export default function WorkflowsPage({ workflows, workflowHistory, warningCount }) {
  const blockedCount = workflowHistory.filter((item) => String(item.result).includes("blocked")).length;

  return (
    <ConsoleLayout title="Operator Workflows" warningCount={warningCount}>
      <section className="status-grid status-grid--three">
        <StatusCard label="Workflow Definitions" value={(workflows.items || []).length} />
        <StatusCard label="Recent Runs" value={workflowHistory.length} />
        <StatusCard label="Blocked Runs" value={blockedCount} detail="Confirmation/prerequisite guarded" />
      </section>

      <PanelTable
        title="Available Workflows"
        columns={[
          { key: "id", label: "ID" },
          { key: "title", label: "Title" },
          { key: "description", label: "Description" },
          { key: "prerequisites", label: "Prerequisites" }
        ]}
        rows={(workflows.items || []).map((item) => ({
          ...item,
          prerequisites: (item.prerequisites || []).join(", ")
        }))}
      />

      <PanelTable
        title="Workflow Execution History"
        columns={[
          { key: "at", label: "Timestamp" },
          { key: "operator", label: "Operator" },
          { key: "target", label: "Workflow" },
          { key: "result", label: "Result" },
          { key: "durationMs", label: "Duration (ms)" }
        ]}
        rows={workflowHistory}
      />
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [workflows, logs, governance] = await Promise.all([
      fetchJson(context, "/api/workflows"),
      fetchJson(context, "/api/logs?limit=400"),
      fetchJson(context, "/api/governance/summary")
    ]);

    return {
      props: {
        workflows,
        workflowHistory: toWorkflowHistoryRows(logs.items),
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        workflows: { items: [] },
        workflowHistory: [],
        warningCount: 0
      }
    };
  }
}
