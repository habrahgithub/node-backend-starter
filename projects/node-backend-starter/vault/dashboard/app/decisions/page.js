import Link from "next/link";
import { getDecisionsData } from "../../lib/db";

export default function DecisionsPage({ searchParams }) {
  const tag = searchParams?.tag || "";
  const since = searchParams?.since || "90d";
  const data = getDecisionsData({ tag, since, max: 200 });

  return (
    <main className="page">
      <header className="header">
        <h1>SWD Decisions</h1>
        <p>Decision and ops sweep memory with NOW/NEXT/LATER tags</p>
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
                <input name="since" defaultValue={since} placeholder="90d" />
              </label>
              <label>
                <span>Tag</span>
                <select name="tag" defaultValue={tag}>
                  <option value="">All</option>
                  <option value="now">now</option>
                  <option value="next">next</option>
                  <option value="later">later</option>
                </select>
              </label>
              <button type="submit">Apply</button>
            </form>
          </section>

          <section className="panel">
            {data.decisions.length === 0 ? (
              <p>No decision events found.</p>
            ) : (
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Project</th>
                      <th>Type</th>
                      <th>Severity</th>
                      <th>Tag</th>
                      <th>Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.decisions.map((row) => (
                      <tr key={row.id}>
                        <td>{row.ts}</td>
                        <td>{row.project}</td>
                        <td>{row.type}</td>
                        <td>
                          <span className={`severity severity-${row.severity}`}>{row.severity}</span>
                        </td>
                        <td>{row.tag || "-"}</td>
                        <td>{row.summary}</td>
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
