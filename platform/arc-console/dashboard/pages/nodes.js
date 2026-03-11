import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { StatusCard } from "../components/StatusCard";
import { fetchJson } from "../lib/apiClient";

export default function NodesPage({ nodes, nodeDetails, warningCount }) {
  return (
    <ConsoleLayout title="Fabric Nodes" warningCount={warningCount}>
      <section className="status-grid status-grid--three">
        <StatusCard label="Registered" value={nodes.summary?.total ?? 0} />
        <StatusCard label="Online" value={nodes.summary?.online ?? 0} />
        <StatusCard label="Offline" value={nodes.summary?.offline ?? 0} />
      </section>

      <PanelTable
        title="Registered Node Metadata"
        columns={[
          { key: "node_id", label: "Node ID" },
          { key: "node_type", label: "Type" },
          { key: "hostname", label: "Hostname" },
          { key: "status", label: "Status" },
          { key: "last_seen", label: "Last Seen" },
          { key: "capabilities", label: "Capabilities" }
        ]}
        rows={(nodes.items || []).map((item) => ({
          ...item,
          capabilities: (item.capabilities || []).join(", ")
        }))}
      />

      <PanelTable
        title="Sample Node Lookup"
        columns={[
          { key: "field", label: "Field" },
          { key: "value", label: "Value" }
        ]}
        rows={nodeDetails}
      />
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [nodes, governance] = await Promise.all([
      fetchJson(context, "/api/fabric/nodes"),
      fetchJson(context, "/api/governance/summary")
    ]);

    const firstNode = nodes.items?.[0]?.node_id;
    let nodeDetails = [];

    if (firstNode) {
      const lookup = await fetchJson(context, `/api/fabric/nodes/${encodeURIComponent(firstNode)}`);
      nodeDetails = [
        { field: "node_id", value: lookup.item?.node_id || "" },
        { field: "node_type", value: lookup.item?.node_type || "" },
        { field: "hostname", value: lookup.item?.hostname || "" },
        { field: "status", value: lookup.item?.status || "" },
        { field: "capabilities", value: (lookup.item?.capabilities || []).join(", ") }
      ];
    }

    return {
      props: {
        nodes,
        nodeDetails,
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        nodes: {
          items: [],
          summary: { total: 0, online: 0, offline: 0 }
        },
        nodeDetails: [],
        warningCount: 0
      }
    };
  }
}
