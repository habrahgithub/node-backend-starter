import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { fetchJson } from "../lib/apiClient";

export default function ServiceMapPage({ serviceNodes, hosted, dependencies, impacts, sampleQuery, warningCount }) {
  return (
    <ConsoleLayout title="Service Map" warningCount={warningCount}>
      <PanelTable
        title="Service Nodes"
        columns={[
          { key: "name", label: "Service" },
          { key: "status", label: "Status" },
          { key: "runtime", label: "Runtime" },
          { key: "domain", label: "Domain" }
        ]}
        rows={serviceNodes}
      />

      <section className="panel-row">
        <PanelTable
          title="Service -> Repository"
          columns={[
            { key: "source", label: "Service" },
            { key: "target", label: "Repository" },
            { key: "confidence", label: "Confidence" }
          ]}
          rows={hosted}
        />
        <PanelTable
          title="Service -> Dependency"
          columns={[
            { key: "source", label: "Service" },
            { key: "target", label: "Dependency" },
            { key: "confidence", label: "Confidence" }
          ]}
          rows={dependencies}
        />
      </section>

      <PanelTable
        title="Incident/Workflow Impact"
        columns={[
          { key: "source", label: "Source" },
          { key: "relationship", label: "Relation" },
          { key: "target", label: "Service" },
          { key: "confidence", label: "Confidence" }
        ]}
        rows={impacts}
      />

      <PanelTable
        title="Sample Service Query"
        columns={[
          { key: "field", label: "Field" },
          { key: "value", label: "Value" }
        ]}
        rows={sampleQuery}
      />
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [nodes, relationships, governance] = await Promise.all([
      fetchJson(context, "/api/knowledge/nodes"),
      fetchJson(context, "/api/knowledge/relationships"),
      fetchJson(context, "/api/governance/summary")
    ]);

    const serviceNodes = (nodes.items || [])
      .filter((node) => node.node_type === "service")
      .map((node) => ({
        id: node.node_id,
        name: node.attributes?.name,
        status: node.attributes?.status,
        runtime: node.attributes?.runtime,
        domain: node.attributes?.domain
      }));

    const serviceSet = new Set(serviceNodes.map((node) => node.id));

    const hosted = (relationships.items || [])
      .filter((edge) => edge.relationship === "hosted_in" && serviceSet.has(edge.source))
      .slice(0, 30);

    const dependencies = (relationships.items || [])
      .filter((edge) => edge.relationship === "depends_on" && serviceSet.has(edge.source))
      .slice(0, 40);

    const impacts = (relationships.items || [])
      .filter((edge) => ["affects", "targets"].includes(edge.relationship) && serviceSet.has(edge.target))
      .slice(0, 40);

    let sampleQuery = [];
    const firstService = serviceNodes[0]?.name;
    if (firstService) {
      const query = await fetchJson(context, `/api/knowledge/query/service/${encodeURIComponent(firstService)}`);
      sampleQuery = [
        { field: "query", value: firstService },
        { field: "found", value: String(query.found) },
        { field: "dependencies", value: String(query.metadata?.dependency_count ?? 0) },
        { field: "incidents", value: String(query.metadata?.incident_count ?? 0) },
        { field: "workflows", value: String(query.metadata?.workflow_count ?? 0) }
      ];
    }

    return {
      props: {
        serviceNodes,
        hosted,
        dependencies,
        impacts,
        sampleQuery,
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        serviceNodes: [],
        hosted: [],
        dependencies: [],
        impacts: [],
        sampleQuery: [],
        warningCount: 0
      }
    };
  }
}
