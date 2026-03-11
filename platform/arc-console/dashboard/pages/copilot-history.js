import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { StatusCard } from "../components/StatusCard";
import { fetchJson } from "../lib/apiClient";

function toRows(history) {
  return (history.items || []).slice(0, 50).map((item) => ({
    id: item.id,
    at: item.at,
    operator: item.operator,
    query: item.query,
    query_type: item.response_summary?.query_type || "unknown",
    confidence: item.response_summary?.confidence ?? 0,
    action_mode: item.response_summary?.action_mode || "informational",
    warning_count: item.response_summary?.warning_count ?? 0
  }));
}

export default function CopilotHistoryPage({ history, warningCount }) {
  const rows = toRows(history);

  return (
    <ConsoleLayout title="Copilot Conversation History" warningCount={warningCount}>
      <section className="status-grid status-grid--three">
        <StatusCard label="Recorded Queries" value={history.summary?.total ?? 0} />
        <StatusCard label="Latest Entry" value={history.summary?.latest_at || "none"} />
        <StatusCard label="Storage Mode" value={history.mode || "local_only"} />
      </section>

      <PanelTable
        title="Recent Copilot Interactions"
        columns={[
          { key: "at", label: "Timestamp" },
          { key: "operator", label: "Operator" },
          { key: "query_type", label: "Type" },
          { key: "query", label: "Query" },
          { key: "confidence", label: "Confidence" },
          { key: "action_mode", label: "Action Mode" },
          { key: "warning_count", label: "Warnings" }
        ]}
        rows={rows}
      />
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [history, governance] = await Promise.all([
      fetchJson(context, "/api/copilot/history"),
      fetchJson(context, "/api/governance/summary")
    ]);

    return {
      props: {
        history,
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        history: {
          mode: "local_only",
          items: [],
          summary: {
            total: 0,
            latest_at: null
          }
        },
        warningCount: 0
      }
    };
  }
}
