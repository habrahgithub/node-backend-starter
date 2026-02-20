"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export default function RunProfilesClient({ profilesMeta, recentSummaries, triggerRunProfileAction }) {
  const [project, setProject] = useState("__all__");
  const [continueOnFail, setContinueOnFail] = useState(false);
  const [runningProfile, setRunningProfile] = useState("");
  const [lastStartedAt, setLastStartedAt] = useState("");
  const [result, setResult] = useState(null);

  const visibleProfiles = useMemo(() => {
    const preferred = ["fast", "standard", "full"];
    const existing = new Set(profilesMeta.profiles);
    const list = preferred.filter((profile) => existing.has(profile));
    for (const profile of profilesMeta.profiles) {
      if (!list.includes(profile)) list.push(profile);
    }
    return list;
  }, [profilesMeta.profiles]);

  const selectedRepos = useMemo(() => {
    if (project === "__all__") return profilesMeta.repos;
    return profilesMeta.repos.filter((repo) => repo.name === project);
  }, [profilesMeta.repos, project]);

  const missingForSelected = useMemo(() => {
    const map = {};
    for (const profile of visibleProfiles) {
      map[profile] = selectedRepos.filter((repo) => !repo.profiles.includes(profile)).map((repo) => repo.name);
    }
    return map;
  }, [visibleProfiles, selectedRepos]);

  async function triggerProfile(profile) {
    setRunningProfile(profile);
    setLastStartedAt(new Date().toISOString());
    setResult(null);

    try {
      if (typeof triggerRunProfileAction !== "function") {
        throw new Error("Run action unavailable");
      }
      const json = await triggerRunProfileAction({
        profile,
        project,
        continueOnFail
      });
      setResult(json);
    } catch (error) {
      setResult({
        ok: false,
        summary: "Request failed",
        stderr: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setRunningProfile("");
    }
  }

  return (
    <>
      <section className="panel">
        <form className="filters" onSubmit={(event) => event.preventDefault()}>
          <label>
            <span>Target</span>
            <select value={project} onChange={(event) => setProject(event.target.value)}>
              <option value="__all__">All repos</option>
              {profilesMeta.repos.map((repo) => (
                <option key={repo.name} value={repo.name}>
                  {repo.name}
                </option>
              ))}
            </select>
          </label>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={continueOnFail}
              onChange={(event) => setContinueOnFail(event.target.checked)}
            />
            <span>Continue on fail</span>
          </label>
        </form>
      </section>

      <section className="panel">
        <h2>Run Profiles</h2>
        <div className="buttons">
          {visibleProfiles.length === 0 ? (
            <p>No profiles available in config.</p>
          ) : (
            visibleProfiles.map((profile) => {
              const missing = missingForSelected[profile] || [];
              return (
                <div key={profile} className="runAction">
                  <button
                    className="runButton"
                    disabled={Boolean(runningProfile)}
                    onClick={() => triggerProfile(profile)}
                    type="button"
                  >
                    Run {profile}
                  </button>
                  {missing.length > 0 ? (
                    <p className="warnText">Missing profile in: {missing.join(", ")} (CLI will enforce)</p>
                  ) : (
                    <p className="small">Ready across selected repos.</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="panel">
        <h2>Status</h2>
        <p>Last started: {lastStartedAt || "-"}</p>
        <p>{runningProfile ? `Running profile '${runningProfile}'...` : "Idle"}</p>

        {result ? (
          <div className="resultBox">
            <p className={result.ok ? "text-green" : "text-red"}>
              {result.ok ? "Success" : "Failed"} (exit={String(result.exitCode ?? "-")})
            </p>
            <p>{result.summary || "-"}</p>
            {result.summaryEventId ? (
              <p>
                Summary event: <Link href={`/events/${result.summaryEventId}`}>#{result.summaryEventId}</Link>
              </p>
            ) : null}
            <p>
              <Link href={result?.runGroupId ? `/runs?run_group_id=${result.runGroupId}` : "/runs"}>Open runs</Link>
            </p>
          </div>
        ) : null}
      </section>

      <section className="panel">
        <h2>Last 5 Profile Runs</h2>
        {recentSummaries.length === 0 ? (
          <p>No `run_summary` events yet.</p>
        ) : (
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Profile</th>
                  <th>Severity</th>
                  <th>Summary</th>
                  <th>Event</th>
                </tr>
              </thead>
              <tbody>
                {recentSummaries.map((row) => (
                  <tr key={row.id}>
                    <td>{row.ts}</td>
                    <td>{row.profile || "-"}</td>
                    <td>
                      <span className={`severity severity-${row.severity}`}>{row.severity}</span>
                    </td>
                    <td>{row.summary}</td>
                    <td>
                      <Link href={`/events/${row.id}`}>#{row.id}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
