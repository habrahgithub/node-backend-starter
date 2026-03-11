import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { fetchJson } from "../lib/apiClient";

export default function SecurityPage({ health, warnings, warningCount, integrationRows, operatorPolicyRows }) {
  const signals = [
    `Overall health: ${health.overall}`,
    `Dirty repositories: ${health.repositoryActivity?.dirty ?? 0}`,
    `CI workflow coverage: ${health.ciCd?.coverage ?? 0}%`,
    "Authentication boundary is active for dashboard and API routes.",
    "Vault integration remains governed and pending explicit wiring approval."
  ];

  return (
    <ConsoleLayout title="Security Overview" warningCount={warningCount}>
      <section className="panel">
        <div className="panel-header">
          <h3>Security and Governance Signals</h3>
        </div>
        <ul className="signal-list">
          {signals.map((signal) => (
            <li key={signal}>{signal}</li>
          ))}
        </ul>
      </section>

      <section className="panel-row">
        <PanelTable
          title="Warning Center"
          columns={[
            { key: "level", label: "Level" },
            { key: "code", label: "Code" },
            { key: "message", label: "Message" }
          ]}
          rows={warnings}
        />
        <PanelTable
          title="Integration Control Status"
          columns={[
            { key: "adapter", label: "Adapter" },
            { key: "source", label: "Source" },
            { key: "count", label: "Count" },
            { key: "notes", label: "Notes" }
          ]}
          rows={integrationRows}
        />
      </section>

      <PanelTable
        title="Operator Action Policy (Defined, Not Enabled)"
        columns={[
          { key: "id", label: "Action" },
          { key: "status", label: "Status" },
          { key: "approvalRequired", label: "Approval" },
          { key: "rollbackRequired", label: "Rollback" }
        ]}
        rows={operatorPolicyRows}
      />
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [health, governance, agentAdapter, serviceHeartbeat, operatorPolicy] = await Promise.all([
      fetchJson(context, "/api/health"),
      fetchJson(context, "/api/governance/summary"),
      fetchJson(context, "/api/integrations/agent-state"),
      fetchJson(context, "/api/integrations/service-heartbeat"),
      fetchJson(context, "/api/operator/actions")
    ]);

    return {
      props: {
        health,
        warnings: governance.warningCenter?.currentWarnings?.slice(0, 20) || [],
        warningCount: governance.warningCenter?.warningCount ?? 0,
        integrationRows: [
          {
            adapter: "agent-state",
            source: agentAdapter.source || "unknown",
            count: agentAdapter.count ?? 0,
            notes: agentAdapter.error || "read-only adapter"
          },
          {
            adapter: "service-heartbeat",
            source: serviceHeartbeat.source || "unknown",
            count: serviceHeartbeat.count ?? 0,
            notes: serviceHeartbeat.error || "read-only adapter"
          }
        ],
        operatorPolicyRows: (operatorPolicy.actions || []).map((item) => ({
          id: item.id,
          status: item.status,
          approvalRequired: item.approvalRequired ? "yes" : "no",
          rollbackRequired: item.rollbackRequired ? "yes" : "no"
        }))
      }
    };
  } catch {
    return {
      props: {
        health: {
          overall: "unavailable",
          repositoryActivity: { dirty: 0 },
          ciCd: { coverage: 0 }
        },
        warnings: [],
        warningCount: 0,
        integrationRows: [],
        operatorPolicyRows: []
      }
    };
  }
}
