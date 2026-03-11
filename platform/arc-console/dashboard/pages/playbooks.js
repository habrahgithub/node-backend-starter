import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { StatusCard } from "../components/StatusCard";
import { fetchJson } from "../lib/apiClient";

export default function PlaybooksPage({ playbooks, warningCount }) {
  return (
    <ConsoleLayout title="Remediation Playbooks" warningCount={warningCount}>
      <section className="status-grid status-grid--three">
        <StatusCard label="Playbooks" value={playbooks.summary?.total ?? 0} />
        <StatusCard label="Approval Required" value={playbooks.summary?.approvalRequired ?? 0} />
        <StatusCard label="Mode" value="Advisory" />
      </section>

      <PanelTable
        title="Playbook Catalog"
        columns={[
          { key: "incident_id", label: "Incident" },
          { key: "service", label: "Service" },
          { key: "playbook_title", label: "Playbook" },
          { key: "approval_required", label: "Approval" },
          { key: "confidence", label: "Confidence" }
        ]}
        rows={(playbooks.items || []).map((item) => ({
          ...item,
          approval_required: item.approval_required ? "required" : "n/a"
        }))}
      />

      <PanelTable
        title="Playbook Steps"
        columns={[
          { key: "incident_id", label: "Incident" },
          { key: "recommended_steps", label: "Recommended Steps" },
          { key: "rollback_checks", label: "Rollback Checks" }
        ]}
        rows={(playbooks.items || []).map((item) => ({
          incident_id: item.incident_id,
          recommended_steps: (item.recommended_steps || []).join(" -> "),
          rollback_checks: (item.rollback_checks || []).join(" -> ")
        }))}
      />
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [playbooks, governance] = await Promise.all([
      fetchJson(context, "/api/reliability/playbooks"),
      fetchJson(context, "/api/governance/summary")
    ]);

    return {
      props: {
        playbooks,
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        playbooks: { items: [], summary: { total: 0, approvalRequired: 0 } },
        warningCount: 0
      }
    };
  }
}
