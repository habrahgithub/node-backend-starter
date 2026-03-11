import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { StatusCard } from "../components/StatusCard";
import { fetchJson } from "../lib/apiClient";

function toRows(items) {
  return Array.isArray(items)
    ? items.map((item) => ({
        label: item.label,
        count: item.count
      }))
    : [];
}

export default function DashboardPage({ status, health, governance }) {
  const services = status.registry.services.slice(0, 6);
  const repositories = status.registry.repositories.slice(0, 6);
  const agents = status.registry.agents;
  const warnings = governance.warningCenter?.currentWarnings || [];
  const backlog = governance.recoveryBacklogSummary || {};

  return (
    <ConsoleLayout title="Platform Overview" warningCount={warnings.length}>
      <section className="status-grid">
        <StatusCard label="Platform Status" value={health.overall} detail={health.summary} />
        <StatusCard label="Services" value={health.serviceAvailability.total} detail={`${health.serviceAvailability.operational} operational`} />
        <StatusCard label="Repositories" value={health.repositoryActivity.total} detail={`${health.repositoryActivity.dirty} dirty`} />
        <StatusCard label="Warnings" value={warnings.length} detail="Current governance warnings" />
      </section>

      <section className="status-grid status-grid--four">
        <StatusCard label="Backlog Critical" value={backlog.critical ?? 0} />
        <StatusCard label="Backlog High" value={backlog.high ?? 0} />
        <StatusCard label="Backlog Medium" value={backlog.medium ?? 0} />
        <StatusCard label="Backlog Low" value={backlog.low ?? 0} />
      </section>

      <section className="panel-row">
        <PanelTable
          title="Priority Distribution"
          columns={[
            { key: "label", label: "Priority" },
            { key: "count", label: "Count" }
          ]}
          rows={toRows(governance.priorityDistribution)}
        />
        <PanelTable
          title="Lifecycle Status Distribution"
          columns={[
            { key: "label", label: "Status" },
            { key: "count", label: "Count" }
          ]}
          rows={toRows(governance.statusDistribution)}
        />
      </section>

      <section className="panel-row">
        <PanelTable
          title="Repo Boundary Status"
          columns={[
            { key: "label", label: "Boundary Type" },
            { key: "count", label: "Count" }
          ]}
          rows={toRows(governance.repoBoundaryStatus)}
        />
        <PanelTable
          title="Warning Center"
          columns={[
            { key: "level", label: "Level" },
            { key: "code", label: "Code" },
            { key: "message", label: "Message" }
          ]}
          rows={warnings.slice(0, 10)}
        />
      </section>

      <section className="panel-row">
        <PanelTable
          title="Service Status"
          columns={[
            { key: "name", label: "Service" },
            { key: "status", label: "Status" },
            { key: "runtime", label: "Runtime" },
            { key: "executionReadiness", label: "Execution" }
          ]}
          rows={services}
        />
        <PanelTable
          title="System Health Summary"
          columns={[
            { key: "label", label: "Signal" },
            { key: "value", label: "Value" }
          ]}
          rows={[
            { label: "Overall", value: governance.systemHealthSummary?.overall || "unknown" },
            { label: "Dirty Repositories", value: health.repositoryActivity.dirty },
            { label: "Unknown Repositories", value: health.repositoryActivity.unknown ?? 0 },
            { label: "CI Coverage", value: `${health.ciCd?.coverage ?? 0}%` },
            {
              label: "Health Route Avg Latency",
              value: `${governance.systemHealthSummary?.healthLatency?.avgDurationMs ?? 0}ms`
            }
          ]}
        />
      </section>

      <section className="panel-row">
        <PanelTable
          title="Repository Governance"
          columns={[
            { key: "name", label: "Repository" },
            { key: "status", label: "Status" },
            { key: "repoType", label: "Boundary" }
          ]}
          rows={repositories}
        />
        <PanelTable
          title="Agent Activity"
          columns={[
            { key: "name", label: "Agent" },
            { key: "status", label: "Status" },
            { key: "pipelineStage", label: "Stage" }
          ]}
          rows={agents}
        />
      </section>
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [status, health, governance] = await Promise.all([
      fetchJson(context, "/api/system/status"),
      fetchJson(context, "/api/health"),
      fetchJson(context, "/api/governance/summary")
    ]);

    return { props: { status, health, governance } };
  } catch {
    return {
      props: {
        status: {
          registry: { services: [], repositories: [], agents: [] }
        },
        health: {
          overall: "unavailable",
          summary: "Failed to load control-plane data.",
          serviceAvailability: { total: 0, operational: 0 },
          repositoryActivity: { total: 0, dirty: 0, unknown: 0 },
          agentActivity: { total: 0, active: 0 },
          ciCd: { coverage: 0 }
        },
        governance: {
          priorityDistribution: [],
          statusDistribution: [],
          repoBoundaryStatus: [],
          recoveryBacklogSummary: { critical: 0, high: 0, medium: 0, low: 0 },
          warningCenter: { currentWarnings: [] },
          systemHealthSummary: { overall: "unavailable", healthLatency: { avgDurationMs: 0 } }
        }
      }
    };
  }
}
