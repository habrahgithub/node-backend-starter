import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { StatusCard } from "../components/StatusCard";
import { fetchJson } from "../lib/apiClient";

export default function LogsPage({ logEvents, observability, warningCount }) {
  return (
    <ConsoleLayout title="Logs" warningCount={warningCount}>
      <section className="status-grid status-grid--three">
        <StatusCard label="Total Events" value={observability.totalEvents || 0} />
        <StatusCard label="Tracked Routes" value={observability.routeMetrics?.length || 0} />
        <StatusCard
          label="Health Avg Latency"
          value={`${(observability.routeMetrics || []).find((item) => item.path === "/api/health")?.avgDurationMs || 0}ms`}
        />
      </section>

      <PanelTable
        title="Recent Control Plane Events"
        columns={[
          { key: "at", label: "Timestamp" },
          { key: "source", label: "Source" },
          { key: "level", label: "Level" },
          { key: "message", label: "Message" }
        ]}
        rows={logEvents.slice(0, 50)}
      />

      <PanelTable
        title="Route Latency Metrics"
        columns={[
          { key: "path", label: "Path" },
          { key: "count", label: "Count" },
          { key: "avgDurationMs", label: "Avg (ms)" },
          { key: "maxDurationMs", label: "Max (ms)" },
          { key: "lastStatusCode", label: "Last Status" }
        ]}
        rows={observability.routeMetrics || []}
      />
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [data, governance] = await Promise.all([
      fetchJson(context, "/api/logs?limit=300"),
      fetchJson(context, "/api/governance/summary")
    ]);

    return {
      props: {
        logEvents: data.items || [],
        observability: data.observability || { totalEvents: 0, routeMetrics: [] },
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        logEvents: [],
        observability: { totalEvents: 0, routeMetrics: [] },
        warningCount: 0
      }
    };
  }
}
