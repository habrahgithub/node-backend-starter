import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { fetchJson } from "../lib/apiClient";

export default function ServicesPage({ services, serviceHealth, warningCount }) {
  return (
    <ConsoleLayout title="Service Status" warningCount={warningCount}>
      <section className="status-grid status-grid--three">
        <article className="status-card">
          <p className="status-label">Total</p>
          <strong className="status-value">{serviceHealth.total}</strong>
        </article>
        <article className="status-card">
          <p className="status-label">Operational</p>
          <strong className="status-value">{serviceHealth.operational}</strong>
        </article>
        <article className="status-card">
          <p className="status-label">Degraded</p>
          <strong className="status-value">{serviceHealth.degraded}</strong>
        </article>
      </section>
      <PanelTable
        title="Managed Services"
        columns={[
          { key: "name", label: "Service" },
          { key: "domain", label: "Domain" },
          { key: "status", label: "Status" },
          { key: "runtime", label: "Runtime" },
          { key: "executionType", label: "Execution Type" }
        ]}
        rows={services}
      />
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [servicesData, serviceHealth, governance] = await Promise.all([
      fetchJson(context, "/api/services"),
      fetchJson(context, "/api/services/health"),
      fetchJson(context, "/api/governance/summary")
    ]);

    return {
      props: {
        services: servicesData.items,
        serviceHealth,
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        services: [],
        serviceHealth: { total: 0, operational: 0, degraded: 0 },
        warningCount: 0
      }
    };
  }
}
