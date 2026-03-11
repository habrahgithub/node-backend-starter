import Link from "next/link";
import { getTimelineData } from "../../lib/db";

function getProvenance(event) {
  const type = String(event?.type || "");
  if (!["ingest_summary", "backup", "restore"].includes(type)) return null;
  const details = event?.details && typeof event.details === "object" ? event.details : {};
  const runProfile = String(details.run_profile || "");
  const cliVersion = String(details.cli_version || "");
  const hostFingerprint = String(details.host_fingerprint || "");
  if (!runProfile && !cliVersion && !hostFingerprint) return null;
  return {
    runProfile: runProfile || "-",
    cliVersion: cliVersion || "-",
    hostFingerprint: hostFingerprint || "-"
  };
}

function getSeverityIcon(severity) {
  const s = String(severity || "").toLowerCase();
  if (s === "critical" || s === "fatal" || s === "blocker") return "🔴";
  if (s === "warning" || s === "warn") return "🟡";
  if (s === "info") return "🔵";
  return "⚙";
}

function truncateSummary(summary, maxLength = 80) {
  if (!summary) return "";
  const str = String(summary);
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}

export default function TimelinePage({ searchParams }) {
  const project = searchParams?.project || "";
  const type = searchParams?.type || "";
  const severity = searchParams?.severity || "";
  const eventClass = searchParams?.event_class || "";
  const since = searchParams?.since || "7d";

  const data = getTimelineData({ project, type, severity, eventClass, since, max: 200 });

  return (
    <main className="page">
      <header className="header">
        <h1>SWD Vault Timeline</h1>
        <p>Last 200 events with filters</p>
        <nav className="nav">
          <Link href="/">Status</Link>
          <Link href="/timeline">Timeline</Link>
          <Link href="/runs">Runs</Link>
          <Link href="/decisions">Decisions</Link>
          <Link href="/blockers">Blockers</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/run-profiles">Run Profiles</Link>
        </nav>
      </header>

      {!data.hasDb ? (
        <section className="panel">
          <p>
            Vault database not found. Run <code>./swd-vault init</code> first.
          </p>
        </section>
      ) : (
        <>
          <section className="panel">
            <form className="filters" method="get">
              <label>
                <span>Since</span>
                <input name="since" defaultValue={since} placeholder="7d" />
              </label>
              <label>
                <span>Project</span>
                <select name="project" defaultValue={project}>
                  <option value="">All</option>
                  {data.filters.projects.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Type</span>
                <select name="type" defaultValue={type}>
                  <option value="">All</option>
                  {data.filters.types.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Severity</span>
                <select name="severity" defaultValue={severity}>
                  <option value="">All</option>
                  {data.filters.severities.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Class</span>
                <select name="event_class" defaultValue={eventClass}>
                  <option value="">All</option>
                  {data.filters.classes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit">Apply</button>
            </form>
          </section>

          <section className="panel">
            {data.events.length === 0 ? (
              <p>No events found for current filters.</p>
            ) : (
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Project</th>
                      <th>Type</th>
                      <th>Severity</th>
                      <th>Class</th>
                      <th>Summary</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.events.map((event) => {
                      const provenance = getProvenance(event);
                      return (
                        <tr key={event.id}>
                          <td>{event.ts}</td>
                          <td>{event.project}</td>
                          <td>{event.type}</td>
                          <td>
                            <span className={`severity severity-${event.severity}`}>
                              {getSeverityIcon(event.severity)} {event.severity}
                            </span>
                          </td>
                          <td>{event.details?.event_class || "-"}</td>
                          <td>
                            <div>
                              {truncateSummary(event.summary)}
                              {event.summary && event.summary.length > 80 && (
                                <details className="small">
                                  <summary>Read more</summary>
                                  <p>{event.summary}</p>
                                </details>
                              )}
                            </div>
                            {provenance ? (
                              <details className="small">
                                <summary>Provenance</summary>
                                <p className="mono">Run Profile: {provenance.runProfile}</p>
                                <p className="mono">CLI Version: {provenance.cliVersion}</p>
                                <p className="mono">Host: {provenance.hostFingerprint.slice(0, 12)}</p>
                              </details>
                            ) : null}
                          </td>
                          <td>{event.source}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
