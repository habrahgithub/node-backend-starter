import Link from "next/link";
import { getProjectsData } from "../../lib/db";

export default function ProjectsPage({ searchParams }) {
  const since = searchParams?.since || "30d";
  const data = getProjectsData({ since });

  return (
    <main className="page">
      <header className="header">
        <h1>SWD Projects</h1>
        <p>Last activity, blockers, and latest run per project</p>
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
                <span>Window</span>
                <input name="since" defaultValue={since} placeholder="30d" />
              </label>
              <button type="submit">Apply</button>
            </form>
          </section>

          <section className="cards">
            {data.cards.length === 0 ? (
              <article className="card">
                <h2>No projects yet</h2>
                <p>Append events or run sweep to populate project cards.</p>
              </article>
            ) : (
              data.cards.map((card) => (
                <article key={card.project} className="card">
                  <h2>{card.project}</h2>
                  <p className="small">Last activity: {card.last_activity_ts || "-"}</p>
                  <p>{card.last_activity_summary || "-"}</p>
                  <p>
                    Blockers ({since}):{" "}
                    <strong className={card.blockers > 0 ? "text-red" : "text-green"}>{card.blockers}</strong>
                  </p>
                  <p className="small">Last run: {card.last_run_ts || "-"}</p>
                  <p>{card.last_run_summary || "No run captured yet"}</p>
                  <p className="small">Exit: {card.last_run_exit_code ?? "-"}</p>
                  <p className="small">Last commit: {card.last_commit_ts || "-"}</p>
                  <p>{card.last_commit_summary || "No commit ingested yet"}</p>
                  <p className="small mono">
                    Commit: {card.last_commit_hash ? String(card.last_commit_hash).slice(0, 12) : "-"}
                  </p>
                </article>
              ))
            )}
          </section>
        </>
      )}
    </main>
  );
}
