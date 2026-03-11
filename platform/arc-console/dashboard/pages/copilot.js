import { useMemo, useState } from "react";
import { ConsoleLayout } from "../components/ConsoleLayout";
import { PanelTable } from "../components/PanelTable";
import { StatusCard } from "../components/StatusCard";
import { fetchJson } from "../lib/apiClient";

const DEFAULT_SUGGESTIONS = [
  "What services are currently unstable?",
  "Which repositories show governance drift?",
  "Show incidents affecting payment services.",
  "What actions do you recommend for the top current risks?",
  "Which workflows should I run next?"
];

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export default function CopilotPage({ suggestions, warningCount }) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("concise");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState(null);

  const suggestionItems = useMemo(() => {
    const items = safeArray(suggestions?.items);
    return items.length > 0 ? items : DEFAULT_SUGGESTIONS;
  }, [suggestions]);

  async function onSubmit(event) {
    event.preventDefault();
    const trimmed = String(query || "").trim();
    if (!trimmed) {
      setError("Query is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await fetch("/api/copilot/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: trimmed,
          mode
        })
      });

      if (!result.ok) {
        const payload = await result.json().catch(() => ({}));
        setError(payload.message || "Copilot request failed.");
        setLoading(false);
        return;
      }

      const payload = await result.json();
      setResponse(payload);
    } catch {
      setError("Copilot request failed.");
    } finally {
      setLoading(false);
    }
  }

  const resultRows = response
    ? [
        {
          id: response.timestamp,
          query_type: response.query_type,
          action_mode: response.action_mode,
          confidence: response.confidence,
          evidence_count: safeArray(response.evidence_sources).length,
          warning_count: safeArray(response.warnings).length
        }
      ]
    : [];

  return (
    <ConsoleLayout title="Autonomous Platform Copilot" warningCount={warningCount}>
      <section className="status-grid status-grid--four">
        <StatusCard label="Suggestions" value={suggestionItems.length} />
        <StatusCard
          label="Query Type"
          value={response?.query_type || "-"}
          detail={response ? "Classified by query router" : "Run a query to classify"}
        />
        <StatusCard
          label="Confidence"
          value={typeof response?.confidence === "number" ? response.confidence : "-"}
          detail="Evidence-scored result"
        />
        <StatusCard label="Action Mode" value={response?.action_mode || "informational"} />
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Operator Query</h3>
        </div>

        <form onSubmit={onSubmit} className="copilot-form">
          <label>
            Query
            <textarea
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              rows={4}
              placeholder="Ask about platform state, incidents, dependencies, workflows, or governance drift."
            />
          </label>

          <label>
            Response Mode
            <select value={mode} onChange={(event) => setMode(event.target.value)}>
              <option value="concise">concise</option>
              <option value="expanded">expanded</option>
            </select>
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Running query..." : "Run copilot query"}
          </button>
        </form>

        {error ? <p className="copilot-error">{error}</p> : null}

        <div className="chip-row">
          {suggestionItems.map((item) => (
            <button key={item} type="button" className="suggestion-chip" onClick={() => setQuery(item)}>
              {item}
            </button>
          ))}
        </div>
      </section>

      <PanelTable
        title="Latest Copilot Response"
        columns={[
          { key: "query_type", label: "Query Type" },
          { key: "action_mode", label: "Action Mode" },
          { key: "confidence", label: "Confidence" },
          { key: "evidence_count", label: "Evidence Sources" },
          { key: "warning_count", label: "Warnings" }
        ]}
        rows={resultRows}
      />

      <section className="panel-row">
        <section className="panel">
          <div className="panel-header">
            <h3>Answer</h3>
          </div>
          <p>{response?.answer || "No response yet."}</p>
          <h3>Facts</h3>
          <ul className="signal-list">
            {safeArray(response?.facts).length > 0 ? (
              safeArray(response?.facts).map((fact) => <li key={fact}>{fact}</li>)
            ) : (
              <li>No facts yet.</li>
            )}
          </ul>
          <h3>Inferences</h3>
          <ul className="signal-list">
            {safeArray(response?.inferences).length > 0 ? (
              safeArray(response?.inferences).map((item) => <li key={item}>{item}</li>)
            ) : (
              <li>No inferences yet.</li>
            )}
          </ul>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h3>Recommendations and Evidence</h3>
          </div>
          <h3>Recommended Actions</h3>
          <ul className="signal-list">
            {safeArray(response?.recommended_actions).length > 0 ? (
              safeArray(response?.recommended_actions).map((item) => <li key={item}>{item}</li>)
            ) : (
              <li>No recommendations yet.</li>
            )}
          </ul>
          <h3>Evidence Sources</h3>
          <ul className="signal-list">
            {safeArray(response?.evidence_sources).length > 0 ? (
              safeArray(response?.evidence_sources).map((item) => <li key={item}>{item}</li>)
            ) : (
              <li>No evidence sources yet.</li>
            )}
          </ul>
          <h3>Warnings</h3>
          <ul className="signal-list">
            {safeArray(response?.warnings).length > 0 ? (
              safeArray(response?.warnings).map((item) => <li key={item}>{item}</li>)
            ) : (
              <li>No warnings.</li>
            )}
          </ul>
        </section>
      </section>
    </ConsoleLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const [suggestions, governance] = await Promise.all([
      fetchJson(context, "/api/copilot/suggestions"),
      fetchJson(context, "/api/governance/summary")
    ]);

    return {
      props: {
        suggestions,
        warningCount: governance.warningCenter?.warningCount ?? 0
      }
    };
  } catch {
    return {
      props: {
        suggestions: { items: DEFAULT_SUGGESTIONS },
        warningCount: 0
      }
    };
  }
}
