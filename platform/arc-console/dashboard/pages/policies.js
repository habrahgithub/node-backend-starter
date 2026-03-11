import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { StatusCard } from "../components/StatusCard";
import { fetchJson } from "../lib/apiClient";

export default function PoliciesPage({ policies, warningCount }) {
  return (
    <ConsoleLayout title="Governance Policies" warningCount={warningCount}>
      <section className="status-grid status-grid--three">
        <StatusCard label="Total Policies" value={policies.summary?.total ?? 0} />
        <StatusCard label="Active" value={policies.summary?.active ?? 0} />
        <StatusCard label="Disabled" value={policies.summary?.disabled ?? 0} />
      </section>

      <PanelTable
        title="Policy Registry"
        columns={[
          { key: "policy_id", label: "Policy ID" },
          { key: "evaluation_target", label: "Target" },
          { key: "severity", label: "Severity" },
          { key: "threshold", label: "Threshold" },
          { key: "enabled", label: "Enabled" },
          { key: "description", label: "Description" }
        ]}
        rows={(policies.items || []).map((policy) => ({
          ...policy,
          threshold: JSON.stringify(policy.threshold || {}),
          enabled: policy.enabled ? "true" : "false"
        }))}
      />
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [policies, governance] = await Promise.all([
      fetchJson(context, "/api/governance/policies"),
      fetchJson(context, "/api/governance/summary")
    ]);

    return {
      props: {
        policies,
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        policies: { items: [], summary: { total: 0, active: 0, disabled: 0 } },
        warningCount: 0
      }
    };
  }
}
