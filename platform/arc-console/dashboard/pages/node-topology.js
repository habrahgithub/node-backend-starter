import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { StatusCard } from "../components/StatusCard";
import { fetchJson } from "../lib/apiClient";

export default function NodeTopologyPage({ topology, warningCount }) {
  return (
    <ConsoleLayout title="Fabric Topology" warningCount={warningCount}>
      <section className="status-grid status-grid--four">
        <StatusCard label="Graph Nodes" value={topology.summary?.node_count ?? 0} />
        <StatusCard label="Relationships" value={topology.summary?.relationship_count ?? 0} />
        <StatusCard label="Managed Nodes" value={topology.summary?.managed_nodes ?? 0} />
        <StatusCard label="Offline Nodes" value={topology.summary?.nodes_offline ?? 0} />
      </section>

      <section className="panel-row">
        <PanelTable
          title="Topology Nodes"
          columns={[
            { key: "id", label: "ID" },
            { key: "type", label: "Type" },
            { key: "label", label: "Label" },
            { key: "status", label: "Status" }
          ]}
          rows={topology.nodes || []}
        />

        <PanelTable
          title="Topology Relationships"
          columns={[
            { key: "source", label: "Source" },
            { key: "relationship", label: "Relationship" },
            { key: "target", label: "Target" },
            { key: "confidence", label: "Confidence" }
          ]}
          rows={topology.relationships || []}
        />
      </section>
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [topology, governance] = await Promise.all([
      fetchJson(context, "/api/fabric/topology"),
      fetchJson(context, "/api/governance/summary")
    ]);

    return {
      props: {
        topology,
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        topology: {
          nodes: [],
          relationships: [],
          summary: {
            node_count: 0,
            relationship_count: 0,
            managed_nodes: 0,
            nodes_offline: 0
          }
        },
        warningCount: 0
      }
    };
  }
}
