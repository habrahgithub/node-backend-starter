import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { StatusCard } from "../components/StatusCard";
import { fetchJson } from "../lib/apiClient";

export default function FabricPage({ telemetry, queryResult, warningCount }) {
  return (
    <ConsoleLayout title="Distributed Control Fabric" warningCount={warningCount}>
      <section className="status-grid status-grid--four">
        <StatusCard label="Managed Nodes" value={telemetry.summary?.nodes_total ?? 0} />
        <StatusCard label="Online" value={telemetry.summary?.nodes_online ?? 0} />
        <StatusCard label="Degraded/Offline" value={(telemetry.summary?.nodes_degraded ?? 0) + (telemetry.summary?.nodes_offline ?? 0)} />
        <StatusCard label="Services (Federated)" value={telemetry.summary?.services_total ?? 0} />
      </section>

      <section className="panel-row">
        <PanelTable
          title="Node Telemetry Summary"
          columns={[
            { key: "node_id", label: "Node" },
            { key: "status", label: "Status" },
            { key: "services_total", label: "Services" },
            { key: "services_degraded", label: "Degraded" },
            { key: "warning_count", label: "Warnings" }
          ]}
          rows={telemetry.items || []}
        />

        <PanelTable
          title="Distributed Query Result"
          columns={[
            { key: "node_id", label: "Node" },
            { key: "status", label: "Status" },
            { key: "services_total", label: "Services" },
            { key: "services_degraded", label: "Degraded" }
          ]}
          rows={queryResult.results || []}
        />
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Fabric Guardrails</h3>
        </div>
        <ul className="signal-list">
          <li>Node registration and all fabric routes require authenticated API access.</li>
          <li>Remote telemetry is read-only by default and stored locally in ARC.</li>
          <li>Offline-node transitions are tolerated and surfaced via status signals.</li>
          <li>Distributed query routing is advisory and does not execute remote actions.</li>
        </ul>
      </section>
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [telemetry, queryResult, governance] = await Promise.all([
      fetchJson(context, "/api/fabric/telemetry"),
      fetchJson(context, "/api/fabric/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: "show services status across all nodes"
        })
      }),
      fetchJson(context, "/api/governance/summary")
    ]);

    return {
      props: {
        telemetry,
        queryResult,
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        telemetry: {
          items: [],
          summary: {
            nodes_total: 0,
            nodes_online: 0,
            nodes_degraded: 0,
            nodes_offline: 0,
            services_total: 0
          }
        },
        queryResult: { results: [] },
        warningCount: 0
      }
    };
  }
}
