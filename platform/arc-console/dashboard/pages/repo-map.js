import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { fetchJson } from "../lib/apiClient";

export default function RepoMapPage({ repoNodes, hostedServices, incidents, workflows, sampleQuery, warningCount }) {
  return (
    <ConsoleLayout title="Repository Map" warningCount={warningCount}>
      <PanelTable
        title="Repository Nodes"
        columns={[
          { key: "name", label: "Repository" },
          { key: "relativePath", label: "Path" },
          { key: "status", label: "Status" },
          { key: "repoType", label: "Type" }
        ]}
        rows={repoNodes}
      />

      <section className="panel-row">
        <PanelTable
          title="Services Hosted In Repository"
          columns={[
            { key: "target", label: "Repository" },
            { key: "source", label: "Service" },
            { key: "confidence", label: "Confidence" }
          ]}
          rows={hostedServices}
        />
        <PanelTable
          title="Incident Impact Chains"
          columns={[
            { key: "source", label: "Incident" },
            { key: "target", label: "Service" },
            { key: "confidence", label: "Confidence" }
          ]}
          rows={incidents}
        />
      </section>

      <PanelTable
        title="Workflow-Service Links"
        columns={[
          { key: "source", label: "Workflow" },
          { key: "target", label: "Service" },
          { key: "confidence", label: "Confidence" }
        ]}
        rows={workflows}
      />

      <PanelTable
        title="Sample Repository Query"
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

    const repoNodes = (nodes.items || [])
      .filter((node) => node.node_type === "repository")
      .map((node) => ({
        id: node.node_id,
        name: node.attributes?.name,
        relativePath: node.attributes?.relativePath,
        status: node.attributes?.status,
        repoType: node.attributes?.repoType
      }));

    const repoSet = new Set(repoNodes.map((node) => node.id));

    const hostedServices = (relationships.items || [])
      .filter((edge) => edge.relationship === "hosted_in" && repoSet.has(edge.target))
      .slice(0, 40);

    const incidents = (relationships.items || []).filter((edge) => edge.relationship === "affects").slice(0, 40);
    const workflows = (relationships.items || []).filter((edge) => edge.relationship === "targets").slice(0, 40);

    let sampleQuery = [];
    const firstRepo = repoNodes[0]?.name;
    if (firstRepo) {
      const query = await fetchJson(context, `/api/knowledge/query/repository/${encodeURIComponent(firstRepo)}`);
      sampleQuery = [
        { field: "query", value: firstRepo },
        { field: "found", value: String(query.found) },
        { field: "services", value: String(query.metadata?.service_count ?? 0) },
        { field: "incidents", value: String(query.metadata?.incident_count ?? 0) },
        { field: "workflows", value: String(query.metadata?.workflow_count ?? 0) }
      ];
    }

    return {
      props: {
        repoNodes,
        hostedServices,
        incidents,
        workflows,
        sampleQuery,
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        repoNodes: [],
        hostedServices: [],
        incidents: [],
        workflows: [],
        sampleQuery: [],
        warningCount: 0
      }
    };
  }
}
