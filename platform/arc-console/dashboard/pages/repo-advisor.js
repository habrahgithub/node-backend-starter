import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { StatusCard } from "../components/StatusCard";
import { fetchJson } from "../lib/apiClient";

export default function RepoAdvisorPage({ repoAdvice, warningCount }) {
  return (
    <ConsoleLayout title="Repo Governance Advisor" warningCount={warningCount}>
      <section className="status-grid status-grid--four">
        <StatusCard label="Advisory Items" value={repoAdvice.summary?.total ?? 0} />
        <StatusCard label="High Risk" value={repoAdvice.summary?.high ?? 0} />
        <StatusCard label="Medium Risk" value={repoAdvice.summary?.medium ?? 0} />
        <StatusCard label="Approval Mode" value="REQUIRED" />
      </section>

      <PanelTable
        title="Repository Cleanup Advice"
        columns={[
          { key: "repository", label: "Repository" },
          { key: "issue", label: "Issue" },
          { key: "risk_level", label: "Risk" },
          { key: "suggested_cleanup", label: "Suggestion" },
          { key: "confidence", label: "Confidence" }
        ]}
        rows={repoAdvice.items || []}
      />

      <PanelTable
        title="Guidance Steps"
        columns={[
          { key: "repository", label: "Repository" },
          { key: "steps", label: "Steps" }
        ]}
        rows={(repoAdvice.items || []).map((item) => ({
          repository: item.repository,
          steps: (item.guidance_steps || []).join(" -> ")
        }))}
      />
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [repoAdvice, governance] = await Promise.all([
      fetchJson(context, "/api/assistance/repo-advice"),
      fetchJson(context, "/api/governance/summary")
    ]);

    return {
      props: {
        repoAdvice,
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        repoAdvice: { items: [], summary: { total: 0, high: 0, medium: 0 } },
        warningCount: 0
      }
    };
  }
}
