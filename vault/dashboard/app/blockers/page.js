import Link from "next/link";
import { getBlockersData } from "../../lib/db";

export default function BlockersPage({ searchParams }) {
  const since = searchParams?.since || "30d";
  const data = getBlockersData({ since, max: 200 });

  return (
    <main className="page">
      <header className="header">
        <h1>SWD Criticals</h1>
        <p>Critical/fatal events grouped by failure fingerprint</p>
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
              <button type="submit">Apply</button>
            </form>
          </section>

          <section className="panel">
            {data.groups.length === 0 ? (
              <p>No blocker groups found.</p>
            ) : (
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Fingerprint</th>
                      <th>Count</th>
                      <th>First Seen</th>
                      <th>Last Seen</th>
                      <th>Project</th>
                      <th>Sample</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.groups.map((group) => (
                      <tr key={group.fingerprint}>
                        <td className="mono">{group.fingerprint}</td>
                        <td>{group.count}</td>
                        <td>{group.first_seen}</td>
                        <td>{group.last_seen}</td>
                        <td>{group.sample_project}</td>
                        <td>{group.sample_summary}</td>
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
