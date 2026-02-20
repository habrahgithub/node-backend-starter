import Link from "next/link";
import { getStatusWindow } from "../lib/db";

function formatHours(value) {
  if (value === null || value === undefined) return "n/a";
  return `${value}h`;
}

function formatPct(value) {
  if (value === null || value === undefined) return "n/a";
  return `${(value * 100).toFixed(1)}%`;
}

function flagTone(level) {
  return level === "warning" ? "warning" : "muted";
}

export default function HomePage() {
  const status = getStatusWindow();

  return (
    <main className="page">
      <header className="header">
        <h1>SWD Vault War Room</h1>
        <p>Local append-only operational memory</p>
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

      {!status.hasDb ? (
        <section className="panel">
          <p>
            Vault database not found. Run <code>./swd-vault init</code> first.
          </p>
        </section>
      ) : (
        <>
          <section className="stats">
            <article className="stat">
              <h2>Total Events (7d)</h2>
              <p>{status.totalEvents}</p>
            </article>
            <article className="stat">
              <h2>Criticals (7d)</h2>
              <p>{status.blockers}</p>
            </article>
            <article className="stat">
              <h2>Last Event</h2>
              <p className="small">{status.lastTs || "-"}</p>
            </article>
            <article className="stat">
              <h2>Release Status</h2>
              <p className={`release release-${status.releaseStatus.toLowerCase()}`}>{status.releaseStatus}</p>
            </article>
          </section>

          <section className="panel">
            <h2>Rules</h2>
            <ul className="rules">
              <li>RED: any critical/fatal in last 7 days</li>
              <li>YELLOW: warnings/notices and no critical/fatal</li>
              <li>GREEN: no warning/critical/fatal events</li>
            </ul>
          </section>

          <section className="panel">
            <h2>Last Sweep</h2>
            {status.lastSweep ? (
              <p>
                [{status.lastSweep.ts}] {status.lastSweep.severity.toUpperCase()} {status.lastSweep.project}:{" "}
                {status.lastSweep.summary}
              </p>
            ) : (
              <p>No sweep events yet. Run <code>./swd-vault sweep --mode system</code>.</p>
            )}
          </section>

          <section className="panel">
            <h2>Integrity Chain</h2>
            {status.chainStatus?.ok ? (
              <>
                <p>
                  <span className="release release-green">Chain OK</span> checked={status.chainStatus.checkedEvents}
                </p>
                <p className="small mono">head={status.chainStatus.headHash || "-"}</p>
              </>
            ) : (
              <>
                <p>
                  <span className="release release-red">BROKEN</span>{" "}
                  at event #{status.chainStatus?.brokenAtId || "-"} ({status.chainStatus?.reason || "unknown"})
                </p>
                {status.chainStatus?.expectedHash ? (
                  <p className="small mono">expected={status.chainStatus.expectedHash}</p>
                ) : null}
                {status.chainStatus?.actualHash !== undefined ? (
                  <p className="small mono">actual={status.chainStatus.actualHash || "(empty)"}</p>
                ) : null}
              </>
            )}
            <p className="small">
              Verify from CLI: <code>./swd-vault verify chain</code>
            </p>
          </section>

          <section className="panel">
            <h2>Vault Health</h2>
            <div className="stats">
              <article className="stat">
                <h2>Health Score</h2>
                <p>{status.health?.score ?? 0}%</p>
                <p className={`release release-${String(status.health?.status || "GREEN").toLowerCase()}`}>
                  {status.health?.status || "GREEN"}
                </p>
              </article>
              <article className="stat">
                <h2>Integrity</h2>
                <p>{status.health?.chainContinuity ? "100%" : "0%"}</p>
              </article>
              <article className="stat">
                <h2>Backup Freshness</h2>
                <p className="small">{formatHours(status.health?.backupFreshnessHours)}</p>
              </article>
              <article className="stat">
                <h2>Recent Failures (7d)</h2>
                <p>{status.health?.failedRuns7d ?? 0}</p>
              </article>
              <article className="stat">
                <h2>Duplicate Suppression</h2>
                <p className="small">{formatPct(status.health?.duplicateSuppressionRatio)}</p>
              </article>
              <article className="stat">
                <h2>Seal Recency</h2>
                <p className="small">{formatHours(status.health?.sealFreshnessHours)}</p>
              </article>
              <article className="stat">
                <h2>Chain Height</h2>
                <p>{status.health?.chainHeight ?? 0}</p>
              </article>
            </div>
          </section>

          <section className="grid-two">
            <article className="panel">
              <h2>Recent Critical Events</h2>
              {status.recentCriticalEvents?.length ? (
                <div className="tableWrap">
                  <table>
                    <thead>
                      <tr>
                        <th>TS</th>
                        <th>Severity</th>
                        <th>Type</th>
                        <th>Project</th>
                        <th>Summary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {status.recentCriticalEvents.map((event) => (
                        <tr key={event.id}>
                          <td>{event.ts}</td>
                          <td>
                            <span className={`severity severity-${event.severity}`}>{event.severity}</span>
                          </td>
                          <td>{event.type}</td>
                          <td>{event.project}</td>
                          <td>{event.summary}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No critical events found.</p>
              )}
            </article>

            <article className="panel">
              <h2>Ingestion Summary (Last 10)</h2>
              {status.recentIngestRuns?.length ? (
                <>
                  <div className="tableWrap">
                    <table>
                      <thead>
                        <tr>
                          <th>TS</th>
                          <th>Severity</th>
                          <th>Bundle</th>
                          <th>Inserted</th>
                          <th>State</th>
                          <th>Summary</th>
                        </tr>
                      </thead>
                      <tbody>
                        {status.recentIngestRuns.map((event) => (
                          <tr key={event.id}>
                            <td>{event.ts}</td>
                            <td>
                              <span className={`severity severity-${event.severity}`}>{event.severity}</span>
                            </td>
                            <td>{event.bundleLabel || "-"}</td>
                            <td>{event.totalInserted ?? "-"}</td>
                            <td>
                              {event.duplicateOnly ? (
                                <span className="status-badge status-badge-warning">duplicate-only</span>
                              ) : (
                                <span className="status-badge status-badge-muted">new-content</span>
                              )}
                            </td>
                            <td>{event.summary}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <details className="small">
                    <summary>Show provenance details</summary>
                    <div className="tableWrap">
                      <table>
                        <thead>
                          <tr>
                            <th>TS</th>
                            <th>Run Profile</th>
                            <th>CLI Version</th>
                            <th>Host</th>
                          </tr>
                        </thead>
                        <tbody>
                          {status.recentIngestRuns.map((event) => (
                            <tr key={`prov-${event.id}`}>
                              <td>{event.ts}</td>
                              <td className="mono">{event.runProfile || "-"}</td>
                              <td className="mono">{event.cliVersion || "-"}</td>
                              <td className="mono">{event.hostFingerprintShort || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </>
              ) : (
                <p>No ingest summary events found.</p>
              )}
            </article>
          </section>

          <section className="panel">
            <h2>Format Coverage (Latest Ingest)</h2>
            {status.formatCoverage ? (
              <>
                <p className="small">Last ingest: {status.formatCoverage.ts}</p>
                <div className="stats">
                  <article className="stat">
                    <h2>Markdown</h2>
                    <p className="small">
                      scanned={status.formatCoverage.md.scanned} inserted={status.formatCoverage.md.inserted} skipped=
                      {status.formatCoverage.md.skipped}
                    </p>
                  </article>
                  <article className="stat">
                    <h2>CSV Rows</h2>
                    <p className="small">
                      scanned={status.formatCoverage.csvRows.scanned} inserted={status.formatCoverage.csvRows.inserted}{" "}
                      skipped={status.formatCoverage.csvRows.skipped}
                    </p>
                  </article>
                  <article className="stat">
                    <h2>HTML</h2>
                    <p className="small">
                      scanned={status.formatCoverage.html.scanned} inserted={status.formatCoverage.html.inserted} skipped=
                      {status.formatCoverage.html.skipped}
                    </p>
                  </article>
                  <article className="stat">
                    <h2>Total Inserted</h2>
                    <p>{status.formatCoverage.totalInserted}</p>
                    <p className="small">
                      total insert rate={formatPct(status.formatCoverage.rates?.totalInsert)} | total skip rate=
                      {formatPct(status.formatCoverage.rates?.totalSkip)}
                    </p>
                  </article>
                </div>
                <p className="small">
                  Markdown: insert {formatPct(status.formatCoverage.rates?.mdInsert)} | skip{" "}
                  {formatPct(status.formatCoverage.rates?.mdSkip)} | CSV: insert{" "}
                  {formatPct(status.formatCoverage.rates?.csvInsert)} | skip {formatPct(status.formatCoverage.rates?.csvSkip)}{" "}
                  | HTML: insert {formatPct(status.formatCoverage.rates?.htmlInsert)} | skip{" "}
                  {formatPct(status.formatCoverage.rates?.htmlSkip)}
                </p>
                {status.formatCoverage.flags?.length ? (
                  <div>
                    {status.formatCoverage.flags.map((flag) => (
                      <span key={flag.code} className={`status-badge status-badge-${flagTone(flag.level)}`}>
                        {flag.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="small">No coverage anomalies detected.</p>
                )}
                <details className="small">
                  <summary>Show latest ingest provenance</summary>
                  <p className="mono">
                    run_profile={status.formatCoverage.provenance?.runProfile || "-"} | cli_version=
                    {status.formatCoverage.provenance?.cliVersion || "-"} | host=
                    {status.formatCoverage.provenance?.hostFingerprintShort || "-"}
                  </p>
                </details>
              </>
            ) : (
              <p>No ingest summary available yet.</p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
