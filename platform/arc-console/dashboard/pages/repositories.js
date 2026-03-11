import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { fetchJson } from "../lib/apiClient";

export default function RepositoriesPage({ repositories, summary, warningCount }) {
  return (
    <ConsoleLayout title="Repository Governance" warningCount={warningCount}>
      <section className="status-grid status-grid--three">
        <article className="status-card">
          <p className="status-label">Total Repos</p>
          <strong className="status-value">{summary.total}</strong>
        </article>
        <article className="status-card">
          <p className="status-label">Dirty</p>
          <strong className="status-value">{summary.dirty}</strong>
        </article>
        <article className="status-card">
          <p className="status-label">Clean</p>
          <strong className="status-value">{summary.clean}</strong>
        </article>
      </section>
      <PanelTable
        title="Repository Inventory"
        columns={[
          { key: "name", label: "Repository" },
          { key: "relativePath", label: "Path" },
          { key: "status", label: "Status" },
          { key: "repoType", label: "Boundary" }
        ]}
        rows={repositories}
      />
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [repoData, governance] = await Promise.all([
      fetchJson(context, "/api/repos"),
      fetchJson(context, "/api/governance/summary")
    ]);

    return {
      props: {
        repositories: repoData.items,
        summary: repoData.summary,
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        repositories: [],
        summary: { total: 0, dirty: 0, clean: 0, unknown: 0 },
        warningCount: 0
      }
    };
  }
}
