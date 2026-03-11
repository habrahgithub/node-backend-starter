import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { StatusCard } from "../components/StatusCard";
import { fetchJson } from "../lib/apiClient";

export default function RecoveryAdvicePage({ advice, warningCount }) {
  return (
    <ConsoleLayout title="Service Recovery Advice" warningCount={warningCount}>
      <section className="status-grid status-grid--three">
        <StatusCard label="Services" value={advice.summary?.total ?? 0} />
        <StatusCard label="Operator-Run Candidates" value={advice.summary?.operatorRunCandidates ?? 0} />
        <StatusCard label="Simulation-Only" value={advice.summary?.simulationOnly ?? 0} />
      </section>

      <PanelTable
        title="Recovery Recommendations"
        columns={[
          { key: "service", label: "Service" },
          { key: "recommended_action", label: "Recommended Action" },
          { key: "action_mode", label: "Action Mode" },
          { key: "approval_required", label: "Approval" },
          { key: "confidence", label: "Confidence" }
        ]}
        rows={(advice.items || []).map((item) => ({
          ...item,
          approval_required: item.approval_required ? "required" : "n/a"
        }))}
      />

      <PanelTable
        title="Recovery Prerequisites"
        columns={[
          { key: "service", label: "Service" },
          { key: "prerequisites", label: "Prerequisites" },
          { key: "evidence", label: "Evidence" }
        ]}
        rows={(advice.items || []).map((item) => ({
          service: item.service,
          prerequisites: (item.prerequisites || []).join(" | "),
          evidence: (item.evidence || []).join(" | ")
        }))}
      />
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [advice, governance] = await Promise.all([
      fetchJson(context, "/api/reliability/recovery-advice"),
      fetchJson(context, "/api/governance/summary")
    ]);

    return {
      props: {
        advice,
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        advice: { items: [], summary: { total: 0, operatorRunCandidates: 0, simulationOnly: 0 } },
        warningCount: 0
      }
    };
  }
}
