import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { StatusCard } from "../components/StatusCard";
import { fetchJson } from "../lib/apiClient";

export default function GovernancePage({ evaluation, compliance, violations, warningCount }) {
  return (
    <ConsoleLayout title="Autonomous Platform Governance" warningCount={warningCount}>
      <section className="status-grid status-grid--four">
        <StatusCard label="Active Policies" value={evaluation.summary?.total ?? 0} />
        <StatusCard label="Violations" value={evaluation.summary?.violation ?? 0} />
        <StatusCard label="Compliance Score" value={compliance.overall_score ?? 0} />
        <StatusCard label="Trend" value={compliance.trend || "unknown"} />
      </section>

      <section className="panel-row">
        <PanelTable
          title="Policy Evaluation Summary"
          columns={[
            { key: "policy_id", label: "Policy" },
            { key: "severity", label: "Severity" },
            { key: "status", label: "Status" },
            { key: "confidence", label: "Confidence" }
          ]}
          rows={evaluation.items || []}
        />

        <PanelTable
          title="Top Violations"
          columns={[
            { key: "component", label: "Component" },
            { key: "policy", label: "Policy" },
            { key: "severity", label: "Severity" },
            { key: "recommended_action", label: "Recommended Action" }
          ]}
          rows={(violations.items || []).slice(0, 20)}
        />
      </section>
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [evaluation, compliance, violations, governance] = await Promise.all([
      fetchJson(context, "/api/governance/evaluate"),
      fetchJson(context, "/api/governance/compliance"),
      fetchJson(context, "/api/governance/violations"),
      fetchJson(context, "/api/governance/summary")
    ]);

    return {
      props: {
        evaluation,
        compliance,
        violations,
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        evaluation: { items: [], summary: { total: 0, violation: 0 } },
        compliance: { overall_score: 0, trend: "unknown" },
        violations: { items: [] },
        warningCount: 0
      }
    };
  }
}
