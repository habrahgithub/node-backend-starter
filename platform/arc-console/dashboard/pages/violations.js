import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { StatusCard } from "../components/StatusCard";
import { fetchJson } from "../lib/apiClient";

export default function ViolationsPage({ violations, warningCount }) {
  return (
    <ConsoleLayout title="Governance Violations" warningCount={warningCount}>
      <section className="status-grid status-grid--four">
        <StatusCard label="Total" value={violations.summary?.total ?? 0} />
        <StatusCard label="Critical" value={violations.summary?.critical ?? 0} />
        <StatusCard label="High" value={violations.summary?.high ?? 0} />
        <StatusCard label="Medium/Low" value={(violations.summary?.medium ?? 0) + (violations.summary?.low ?? 0)} />
      </section>

      <PanelTable
        title="Violation Report"
        columns={[
          { key: "violation_id", label: "Violation" },
          { key: "component", label: "Component" },
          { key: "policy", label: "Policy" },
          { key: "severity", label: "Severity" },
          { key: "recommended_action", label: "Recommended Action" },
          { key: "evidence", label: "Evidence" }
        ]}
        rows={(violations.items || []).map((item) => ({
          ...item,
          evidence: (item.evidence || []).join(" | ")
        }))}
      />
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [violations, governance] = await Promise.all([
      fetchJson(context, "/api/governance/violations"),
      fetchJson(context, "/api/governance/summary")
    ]);

    return {
      props: {
        violations,
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        violations: { items: [], summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 } },
        warningCount: 0
      }
    };
  }
}
