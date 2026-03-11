import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { fetchJson } from "../lib/apiClient";

export default function AgentsPage({ agents, summary, warningCount }) {
  return (
    <ConsoleLayout title="Agent Activity" warningCount={warningCount}>
      <section className="status-grid status-grid--three">
        <article className="status-card">
          <p className="status-label">Total Agents</p>
          <strong className="status-value">{summary.total}</strong>
        </article>
        <article className="status-card">
          <p className="status-label">Active</p>
          <strong className="status-value">{summary.active}</strong>
        </article>
        <article className="status-card">
          <p className="status-label">Standby/Paused</p>
          <strong className="status-value">{summary.standby}</strong>
        </article>
      </section>
      <PanelTable
        title="Managed Agents"
        columns={[
          { key: "name", label: "Agent" },
          { key: "status", label: "Status" },
          { key: "pipelineStage", label: "Pipeline Stage" },
          { key: "currentTask", label: "Current Task" }
        ]}
        rows={agents}
      />
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [data, governance] = await Promise.all([
      fetchJson(context, "/api/agents"),
      fetchJson(context, "/api/governance/summary")
    ]);

    return {
      props: {
        agents: data.items,
        summary: data.summary,
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        agents: [],
        summary: { total: 0, active: 0, standby: 0 },
        warningCount: 0
      }
    };
  }
}
