import Link from "next/link";
import { getEventById } from "../../../lib/db";

export default function EventDetailPage({ params }) {
  const event = getEventById(params?.id);

  return (
    <main className="page">
      <header className="header">
        <h1>Vault Event Detail</h1>
        <p>Event-level audit view</p>
        <nav className="nav">
          <Link href="/">Status</Link>
          <Link href="/timeline">Timeline</Link>
          <Link href="/runs">Runs</Link>
          <Link href="/run-profiles">Run Profiles</Link>
        </nav>
      </header>

      {!event ? (
        <section className="panel">
          <p>Event not found.</p>
        </section>
      ) : (
        <>
          <section className="panel">
            <h2>
              #{event.id} {event.type}
            </h2>
            <p>
              [{event.ts}] {event.project} <span className={`severity severity-${event.severity}`}>{event.severity}</span>
            </p>
            <p>{event.summary}</p>
          </section>

          <section className="panel">
            <h2>Details</h2>
            <pre className="jsonBox">{JSON.stringify(event.details, null, 2)}</pre>
          </section>

          <section className="panel">
            <h2>Evidence Paths</h2>
            {event.evidence_paths.length === 0 ? (
              <p>None</p>
            ) : (
              <ul className="evidenceList">
                {event.evidence_paths.map((item) => (
                  <li key={item} className="mono">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
