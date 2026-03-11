import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { StatusCard } from "../components/StatusCard";
import { fetchJson } from "../lib/apiClient";

export default function IntelligencePage({ insights, warningCount }) {
  const topRisks = insights.top_risks || [];
  const recommendedActions = insights.recommended_actions || [];
  const confidence = insights.confidence_scores || {};

  return (
    <ConsoleLayout title="Platform Intelligence" warningCount={warningCount}>
      <section className="status-grid status-grid--four">
        <StatusCard label="Top Risks" value={topRisks.length} />
        <StatusCard label="Recommended Actions" value={recommendedActions.length} detail="Operator approval required" />
        <StatusCard label="Overall Confidence" value={confidence.overall ?? 0} />
        <StatusCard label="Evidence Links" value={(insights.evidence_links || []).length} />
      </section>

      <PanelTable
        title="Top Risk Signals"
        columns={[
          { key: "domain", label: "Domain" },
          { key: "subject", label: "Subject" },
          { key: "risk_level", label: "Risk" },
          { key: "confidence_score", label: "Confidence" },
          { key: "operator_approval_required", label: "Approval" }
        ]}
        rows={topRisks.map((item) => ({
          ...item,
          operator_approval_required: item.operator_approval_required ? "required" : "n/a"
        }))}
      />

      <section className="panel-row">
        <PanelTable
          title="Recommended Actions"
          columns={[
            { key: "domain", label: "Domain" },
            { key: "target", label: "Target" },
            { key: "action", label: "Action" },
            { key: "confidence_score", label: "Confidence" }
          ]}
          rows={recommendedActions}
        />
        <PanelTable
          title="Domain Confidence"
          columns={[
            { key: "metric", label: "Metric" },
            { key: "value", label: "Value" }
          ]}
          rows={Object.entries(confidence).map(([metric, value]) => ({ metric, value }))}
        />
      </section>
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [insights, governance] = await Promise.all([
      fetchJson(context, "/api/intelligence/insights"),
      fetchJson(context, "/api/governance/summary")
    ]);

    return {
      props: {
        insights,
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        insights: { top_risks: [], recommended_actions: [], confidence_scores: {}, evidence_links: [] },
        warningCount: 0
      }
    };
  }
}
