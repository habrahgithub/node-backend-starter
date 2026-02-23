import Link from "next/link";
import { getRecentRunSummaryEvents, getRunProfilesMeta } from "../../lib/db";
import { triggerRunProfileAction } from "./actions";
import RunProfilesClient from "./RunProfilesClient";

export default function RunProfilesPage() {
  const profilesMeta = getRunProfilesMeta();
  const recentSummaries = getRecentRunSummaryEvents(5);

  return (
    <main className="page">
      <header className="header">
        <h1>SWD Run Profiles</h1>
        <p>Local-only profile execution control plane</p>
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

      <RunProfilesClient
        profilesMeta={profilesMeta}
        recentSummaries={recentSummaries}
        triggerRunProfileAction={triggerRunProfileAction}
      />
    </main>
  );
}
