import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { StatusCard } from "../components/StatusCard";
import { fetchJson } from "../lib/apiClient";

export default function GraphPage({ graph, snapshots, warningCount }) {
  return (
    <ConsoleLayout title="Platform Knowledge Graph" warningCount={warningCount}>
      <section className="status-grid status-grid--four">
        <StatusCard label="Nodes" value={graph.metadata?.node_count ?? 0} />
        <StatusCard label="Relationships" value={graph.metadata?.relationship_count ?? 0} />
        <StatusCard label="Orphan Nodes" value={graph.metadata?.orphan_node_count ?? 0} />
        <StatusCard label="Snapshots" value={snapshots.items?.length ?? 0} />
      </section>

      <section className="panel-row">
        <PanelTable
          title="Node Type Distribution"
          columns={[
            { key: "type", label: "Node Type" },
            { key: "count", label: "Count" }
          ]}
          rows={Object.entries(graph.metadata?.node_types || {}).map(([type, count]) => ({ type, count }))}
        />
        <PanelTable
          title="Relationship Distribution"
          columns={[
            { key: "relationship", label: "Relationship" },
            { key: "count", label: "Count" }
          ]}
          rows={Object.entries(graph.metadata?.relationship_types || {}).map(([relationship, count]) => ({ relationship, count }))}
        />
      </section>

      <PanelTable
        title="Graph Edges (Sample)"
        columns={[
          { key: "source", label: "Source" },
          { key: "relationship", label: "Relationship" },
          { key: "target", label: "Target" },
          { key: "confidence", label: "Confidence" }
        ]}
        rows={(graph.relationships || []).slice(0, 30)}
      />

      <PanelTable
        title="Snapshot History"
        columns={[
          { key: "snapshot_id", label: "Snapshot" },
          { key: "captured_at", label: "Captured At" },
          { key: "node_count", label: "Nodes" },
          { key: "relationship_count", label: "Relationships" }
        ]}
        rows={snapshots.items || []}
      />
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [graph, snapshots, governance] = await Promise.all([
      fetchJson(context, "/api/knowledge/graph"),
      fetchJson(context, "/api/knowledge/snapshots"),
      fetchJson(context, "/api/governance/summary")
    ]);

    return {
      props: {
        graph,
        snapshots,
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        graph: { metadata: {}, relationships: [] },
        snapshots: { items: [] },
        warningCount: 0
      }
    };
  }
}
