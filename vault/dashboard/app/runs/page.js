import Link from "next/link";
import { getRunsData } from "../../lib/db";

export default function RunsPage({ searchParams }) {
  const project = searchParams?.project || "";
  const since = searchParams?.since || "30d";
  const runGroupId = searchParams?.run_group_id || "";
  const data = getRunsData({ project, since, runGroupId, max: 200 });

  return (
    <main className="page">
      <header className="header">
        <h1>SWD Vault Runs</h1>
        <p>Recent captured command executions</p>
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
                <input name="since" defaultValue={since} placeholder="30d" />
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
                <span>Run Group</span>
                <input name="run_group_id" defaultValue={runGroupId} placeholder="runall-..." />
              </label>
              <button type="submit">Apply</button>
            </form>
          </section>

          <section className="panel">
            {data.runs.length === 0 ? (
              <p>No runs found.</p>
            ) : (
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Project</th>
                      <th>Command</th>
                      <th>Exit</th>
                      <th>Duration</th>
                      <th>Severity</th>
                      <th>Log</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.runs.map((run) => (
                      <tr key={run.id}>
                        <td>{run.ts}</td>
                        <td>{run.project}</td>
                        <td className="mono">{run.command_text || run.summary}</td>
                        <td>{String(run.exit_code ?? "-")}</td>
                        <td>{run.duration_ms ? `${run.duration_ms}ms` : "-"}</td>
                        <td>
                          <span className={`severity severity-${run.severity}`}>{run.severity}</span>
                        </td>
                        <td className="mono">{run.log_path || "-"}</td>
                      </tr>
                    ))}
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
