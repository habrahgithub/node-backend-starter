import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { StatusCard } from "../components/StatusCard";
import { fetchJson } from "../lib/apiClient";

export default function AutomationPage({ agentState, serviceMetrics, workflows, warningCount }) {
  return (
    <ConsoleLayout title="Automation" warningCount={warningCount}>
      <section className="status-grid status-grid--four">
        <StatusCard label="Managed Agents" value={agentState.summary?.total ?? 0} detail={`${agentState.summary?.active ?? 0} active`} />
        <StatusCard label="Services Monitored" value={serviceMetrics.summary?.total ?? 0} detail={`${serviceMetrics.summary?.degraded ?? 0} degraded`} />
        <StatusCard label="Workflow Catalog" value={(workflows.items || []).length} detail="Operator-triggered only" />
        <StatusCard label="Safety Mode" value="ENABLED" detail="No destructive autonomous actions" />
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Automation Guardrails</h3>
        </div>
        <ul className="signal-list">
          <li>All automation routes require authenticated operator sessions.</li>
          <li>Service restart runs in simulation mode only.</li>
          <li>Operator-triggered actions write structured audit entries.</li>
          <li>Repository and integration adapters remain read-only.</li>
        </ul>
      </section>

      <section className="panel-row">
        <PanelTable
          title="Agent Orchestration State"
          columns={[
            { key: "name", label: "Agent" },
            { key: "status", label: "Status" },
            { key: "pipelineStage", label: "Pipeline Stage" },
            { key: "currentTask", label: "Current Task" }
          ]}
          rows={agentState.items || []}
        />
        <PanelTable
          title="Service Metrics"
          columns={[
            { key: "name", label: "Service" },
            { key: "status", label: "Status" },
            { key: "lastLatencyMs", label: "Latency (ms)" },
            { key: "executionReadiness", label: "Execution" }
          ]}
          rows={serviceMetrics.items || []}
        />
      </section>

      <PanelTable
        title="Predefined Operator Workflows"
        columns={[
          { key: "id", label: "Workflow" },
          { key: "title", label: "Title" },
          { key: "description", label: "Description" }
        ]}
        rows={workflows.items || []}
      />
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [agentState, serviceMetrics, workflows, governance] = await Promise.all([
      fetchJson(context, "/api/agents/state"),
      fetchJson(context, "/api/services/metrics"),
      fetchJson(context, "/api/workflows"),
      fetchJson(context, "/api/governance/summary")
    ]);

    return {
      props: {
        agentState,
        serviceMetrics,
        workflows,
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        agentState: { items: [], summary: { total: 0, active: 0 } },
        serviceMetrics: { items: [], summary: { total: 0, degraded: 0 } },
        workflows: { items: [] },
        warningCount: 0
      }
    };
  }
}
