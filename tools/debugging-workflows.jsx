import { useState } from "react";

const workflows = {
  general: {
    label: "General / Code",
    icon: "🐛",
    color: "#6366f1",
    light: "#eef2ff",
    steps: [
      {
        id: 1,
        title: "Reproduce the Bug",
        desc: "Can you reliably reproduce it?",
        yes: 2,
        no: "isolate",
        checklist: [
          "Document exact steps to reproduce",
          "Identify the smallest reproducible case",
          "Note environment (OS, version, browser)",
          "Check if it's intermittent or consistent",
        ],
      },
      {
        id: 2,
        title: "Read the Error",
        desc: "Is there an error message or stack trace?",
        yes: 3,
        no: 4,
        checklist: [
          "Read the full stack trace top to bottom",
          "Identify the origin file & line number",
          "Search the exact error message online",
          "Check logs (console, server, system)",
        ],
      },
      {
        id: 3,
        title: "Isolate the Cause",
        desc: "Can you narrow it to a single function/module?",
        yes: 5,
        no: 4,
        checklist: [
          "Add breakpoints or console logs",
          "Comment out sections binary-search style",
          "Test with minimal data inputs",
          "Use a debugger (Chrome DevTools, pdb, etc.)",
        ],
      },
      {
        id: 4,
        title: "Gather Context",
        desc: "Do you have enough info to form a hypothesis?",
        yes: 5,
        no: "gather",
        checklist: [
          "Check recent git commits / diffs",
          "Review related issue tracker tickets",
          "Ask teammates or check Slack history",
          "Add more verbose logging temporarily",
        ],
      },
      {
        id: 5,
        title: "Fix & Verify",
        desc: "Apply fix, run tests, confirm resolved.",
        yes: null,
        no: null,
        checklist: [
          "Write a failing test first (TDD approach)",
          "Apply the fix",
          "Run full test suite",
          "Test edge cases manually",
          "Document what caused it & how you fixed it",
        ],
      },
    ],
    tips: [
      "🔁 Binary search your codebase — comment out half, see if bug persists",
      "🕵️ Git blame & git bisect are your best friends for regressions",
      "📋 Rubber duck debug: explain the problem out loud",
      "🧪 Write the test before the fix",
    ],
  },
  frontend: {
    label: "Frontend / UI",
    icon: "🖥️",
    color: "#0ea5e9",
    light: "#f0f9ff",
    steps: [
      {
        id: 1,
        title: "Check the Console",
        desc: "Any JS errors or warnings in DevTools?",
        yes: 2,
        no: 3,
        checklist: [
          "Open DevTools → Console tab",
          "Look for red errors & yellow warnings",
          "Filter by 'Errors' to reduce noise",
          "Check for CORS or network errors",
        ],
      },
      {
        id: 2,
        title: "Trace the Error",
        desc: "Does the stack trace point to your code?",
        yes: 4,
        no: 3,
        checklist: [
          "Click the source link in the stack trace",
          "Enable source maps if minified",
          "Set breakpoints in Sources tab",
          "Step through with F10 / F11",
        ],
      },
      {
        id: 3,
        title: "Inspect the DOM",
        desc: "Is the issue visual / layout related?",
        yes: 5,
        no: 4,
        checklist: [
          "Right-click → Inspect the broken element",
          "Check applied CSS in Styles panel",
          "Look for display:none or visibility:hidden",
          "Check z-index, overflow, and position",
          "Test in different browsers",
        ],
      },
      {
        id: 4,
        title: "Check Network",
        desc: "Is data missing or an API call failing?",
        yes: 5,
        no: 5,
        checklist: [
          "Open Network tab → filter by XHR/Fetch",
          "Check request status codes (4xx, 5xx)",
          "Inspect request/response payloads",
          "Look for blocked or cancelled requests",
        ],
      },
      {
        id: 5,
        title: "Fix & Cross-test",
        desc: "Fix applied — verify across browsers/devices.",
        yes: null,
        no: null,
        checklist: [
          "Test in Chrome, Firefox, Safari",
          "Test on mobile viewport sizes",
          "Run Lighthouse for performance regressions",
          "Check accessibility (tab order, screen reader)",
        ],
      },
    ],
    tips: [
      "🎨 Use DevTools 'Force element state' to debug :hover/:focus styles",
      "📱 Use device toolbar to simulate mobile breakpoints",
      "⚡ React DevTools / Vue DevTools are essential for component state",
      "🌐 Disable cache in DevTools while debugging network issues",
    ],
  },
  backend: {
    label: "Backend / API",
    icon: "⚙️",
    color: "#10b981",
    light: "#f0fdf4",
    steps: [
      {
        id: 1,
        title: "Check Status Code",
        desc: "What HTTP status is the API returning?",
        yes: 2,
        no: 3,
        checklist: [
          "2xx = success path — check response body",
          "4xx = client error (bad request, auth, not found)",
          "5xx = server error — check server logs",
          "Network error = connectivity or CORS issue",
        ],
      },
      {
        id: 2,
        title: "Inspect Request/Response",
        desc: "Is the payload correct on both ends?",
        yes: 4,
        no: 3,
        checklist: [
          "Use Postman / Insomnia to isolate the call",
          "Check request headers (Content-Type, Auth token)",
          "Validate request body schema",
          "Compare expected vs actual response shape",
        ],
      },
      {
        id: 3,
        title: "Check Server Logs",
        desc: "Do logs reveal the root cause?",
        yes: 4,
        no: 4,
        checklist: [
          "Tail logs in real time during the request",
          "Look for exceptions / stack traces",
          "Check request ID correlation across services",
          "Verify env variables & config values",
        ],
      },
      {
        id: 4,
        title: "Trace the Code Path",
        desc: "Walk through the code from endpoint to DB.",
        yes: 5,
        no: 5,
        checklist: [
          "Set breakpoints in handler / controller",
          "Check middleware execution order",
          "Validate DB query and returned data",
          "Test auth / permission logic in isolation",
        ],
      },
      {
        id: 5,
        title: "Fix & Regression Test",
        desc: "Fix applied, tests passing, deployed safely.",
        yes: null,
        no: null,
        checklist: [
          "Write an integration test for this endpoint",
          "Test in staging before production",
          "Check for impact on other endpoints",
          "Update API docs if contract changed",
        ],
      },
    ],
    tips: [
      "🔑 Always check authentication headers first — 90% of 401/403 errors",
      "📊 Add request tracing IDs to correlate logs across microservices",
      "🗃️ Check DB query performance with EXPLAIN ANALYZE",
      "🔄 Test idempotency for POST/PUT endpoints",
    ],
  },
  data: {
    label: "Data & Pipelines",
    icon: "📊",
    color: "#f59e0b",
    light: "#fffbeb",
    steps: [
      {
        id: 1,
        title: "Identify the Symptom",
        desc: "Is the data missing, wrong, or late?",
        yes: 2,
        no: 2,
        checklist: [
          "Define expected vs actual output clearly",
          "Check the pipeline run logs / job status",
          "Identify which stage first produces bad data",
          "Check if it's all records or a subset",
        ],
      },
      {
        id: 2,
        title: "Validate the Source",
        desc: "Is the input data clean and complete?",
        yes: 3,
        no: 5,
        checklist: [
          "Profile source data (nulls, types, ranges)",
          "Check for schema changes upstream",
          "Verify row counts at ingestion",
          "Look for truncated or duplicate records",
        ],
      },
      {
        id: 3,
        title: "Trace the Transform",
        desc: "Does each pipeline step produce correct output?",
        yes: 4,
        no: 5,
        checklist: [
          "Add data quality checks between steps",
          "Log row counts before and after transforms",
          "Spot-check sample records at each stage",
          "Validate join keys and filter logic",
        ],
      },
      {
        id: 4,
        title: "Check the Load",
        desc: "Did data land correctly in the destination?",
        yes: 5,
        no: 5,
        checklist: [
          "Query destination and compare counts",
          "Check for write errors or partial loads",
          "Verify partitioning / indexing is correct",
          "Check for timezone or encoding issues",
        ],
      },
      {
        id: 5,
        title: "Fix & Monitor",
        desc: "Backfill if needed, add monitoring alerts.",
        yes: null,
        no: null,
        checklist: [
          "Backfill affected date ranges if needed",
          "Add data quality assertions to pipeline",
          "Set up alerting on row count anomalies",
          "Document the incident and root cause",
        ],
      },
    ],
    tips: [
      "📐 Always validate row counts at source, transform, and destination",
      "🕐 Check timezone handling — it causes more bugs than you'd think",
      "🔍 Use data profiling tools (Great Expectations, dbt tests)",
      "📅 For late data, check SLA of upstream dependencies",
    ],
  },
  controls: {
    label: "SWD Controls Center",
    icon: "🧭",
    color: "#0f766e",
    light: "#f0fdfa",
    steps: [
      {
        id: 1,
        title: "Choose Ownership Boundary",
        desc: "Should Controls Center be the human I/O boundary for system actions?",
        yes: 2,
        no: 3,
        checklist: [
          "Confirm Controls Center is the only human-facing action surface",
          "Keep Vault as source of truth (append-only record)",
          "Keep OS runner as execution authority",
          "Keep Pulse read-only and Sentinel write-only for alerts",
        ],
      },
      {
        id: 2,
        title: "Option 1: Place Inside SWD OS (Recommended)",
        desc: "Use SWD OS as the governance boundary when Controls Center owns actions.",
        yes: 5,
        no: 3,
        checklist: [
          "Create app path: projects/SWD-OS/apps/controls-center",
          "Connect Controls Center -> OS runner endpoints only",
          "Use OS/Vault credentials server-side only (no client secrets)",
          "Record ui.action_requested and approval events into Vault",
        ],
      },
      {
        id: 3,
        title: "Option 2: Place Inside War Room",
        desc: "Use when War Room is already the primary dashboard shell.",
        yes: 5,
        no: 4,
        checklist: [
          "Add route group like app/controls/* in War Room app",
          "Preserve War Room default mode as read-mostly",
          "Gate action routes behind operator/approver roles",
          "Keep action execution delegated to OS runner",
        ],
      },
      {
        id: 4,
        title: "Option 3: Separate Controls App",
        desc: "Use for maximum deploy and security isolation.",
        yes: 5,
        no: 5,
        checklist: [
          "Create dedicated repo/path: projects/SWD-controls-center",
          "Define explicit URLs and token contracts with OS runner",
          "Use short-lived run tokens for action calls",
          "Keep Vault write surface minimal and auditable",
        ],
      },
      {
        id: 5,
        title: "Finalize Wiring Contract",
        desc: "Lock the runtime contract before implementation.",
        yes: null,
        no: null,
        checklist: [
          "Route map: /runs, /approvals, /exports, /policy, /war-room",
          "Enforce approval gate for release/export actions",
          "Require effective policy for release-grade operations",
          "Document monorepo layout and runner/Vault interfaces",
        ],
      },
    ],
    tips: [
      "✅ Default: put Controls Center in SWD OS when it owns actions",
      "🔒 Treat War Room as read-mostly, Controls as act-mode",
      "🧾 Record every action/approval/event edge in Vault",
      "🎯 Keep OS runner as only executor and Pulse non-executing",
    ],
  },
};

const severityColors = {
  Low: { bg: "#dcfce7", text: "#166534" },
  Medium: { bg: "#fef9c3", text: "#854d0e" },
  High: { bg: "#fee2e2", text: "#991b1b" },
};

export default function DebuggingWorkflows() {
  const [activeTab, setActiveTab] = useState("general");
  const [view, setView] = useState("checklist"); // checklist | flowchart
  const [activeStep, setActiveStep] = useState(0);
  const [checked, setChecked] = useState({});
  const [severity, setSeverity] = useState("Medium");

  const wf = workflows[activeTab];
  const step = wf.steps[activeStep];

  const toggleCheck = (key) =>
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  const totalItems = wf.steps.flatMap((s) => s.checklist).length;
  const doneItems = Object.values(checked).filter(Boolean).length;
  const progress = Math.round((doneItems / totalItems) * 100);

  const resetWorkflow = () => {
    setChecked({});
    setActiveStep(0);
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", maxWidth: 900, margin: "0 auto", padding: "24px 16px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", margin: 0 }}>🔍 Debugging Workflow Hub</h1>
        <p style={{ color: "#64748b", margin: "8px 0 0", fontSize: 14 }}>Interactive checklists, decision trees & pro tips for every bug type</p>
      </div>

      {/* Severity & Progress Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 14px" }}>
          <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Severity:</span>
          {["Low", "Medium", "High"].map((s) => (
            <button key={s} onClick={() => setSeverity(s)} style={{
              padding: "3px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
              background: severity === s ? severityColors[s].bg : "#f1f5f9",
              color: severity === s ? severityColors[s].text : "#94a3b8",
              transition: "all 0.15s"
            }}>{s}</button>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 4 }}>
            <span>Progress</span><span style={{ fontWeight: 700, color: wf.color }}>{progress}%</span>
          </div>
          <div style={{ background: "#e2e8f0", borderRadius: 99, height: 8, overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, background: wf.color, height: "100%", borderRadius: 99, transition: "width 0.4s ease" }} />
          </div>
        </div>
        <button onClick={resetWorkflow} style={{
          padding: "7px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff",
          color: "#64748b", fontSize: 12, cursor: "pointer", fontWeight: 600
        }}>↺ Reset</button>
      </div>

      {/* Tab Nav */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {Object.entries(workflows).map(([key, w]) => (
          <button key={key} onClick={() => { setActiveTab(key); setActiveStep(0); }} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "9px 18px",
            borderRadius: 10, border: "2px solid", cursor: "pointer", fontWeight: 700, fontSize: 14, transition: "all 0.15s",
            borderColor: activeTab === key ? w.color : "#e2e8f0",
            background: activeTab === key ? w.light : "#fff",
            color: activeTab === key ? w.color : "#64748b",
          }}>
            {w.icon} {w.label}
          </button>
        ))}
      </div>

      {/* View Toggle */}
      <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 20, width: "fit-content" }}>
        {[["checklist", "✅ Checklist"], ["flowchart", "🗺️ Decision Tree"]].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: "7px 18px", borderRadius: 7, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13,
            background: view === v ? "#fff" : "transparent",
            color: view === v ? wf.color : "#64748b",
            boxShadow: view === v ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            transition: "all 0.15s"
          }}>{label}</button>
        ))}
      </div>

      {/* CHECKLIST VIEW */}
      {view === "checklist" && (
        <div style={{ display: "grid", gap: 16 }}>
          {wf.steps.map((s, si) => {
            const doneCount = s.checklist.filter((_, ci) => checked[`${activeTab}-${si}-${ci}`]).length;
            const allDone = doneCount === s.checklist.length;
            return (
              <div key={si} style={{
                background: "#fff", borderRadius: 14, border: `2px solid ${allDone ? wf.color : "#e2e8f0"}`,
                overflow: "hidden", transition: "border-color 0.2s"
              }}>
                <div onClick={() => setActiveStep(activeStep === si ? -1 : si)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", cursor: "pointer", background: allDone ? wf.light : "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%", background: allDone ? wf.color : "#e2e8f0",
                      display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13,
                      color: allDone ? "#fff" : "#94a3b8", flexShrink: 0
                    }}>{allDone ? "✓" : si + 1}</div>
                    <div>
                      <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 15 }}>Step {si + 1}: {s.title}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{doneCount}/{s.checklist.length} items done</div>
                    </div>
                  </div>
                  <span style={{ color: "#94a3b8", fontSize: 18 }}>{activeStep === si ? "▲" : "▼"}</span>
                </div>
                {activeStep === si && (
                  <div style={{ padding: "0 18px 18px" }}>
                    <p style={{ color: "#475569", fontSize: 13, margin: "4px 0 14px", fontStyle: "italic" }}>{s.desc}</p>
                    <div style={{ display: "grid", gap: 8 }}>
                      {s.checklist.map((item, ci) => {
                        const key = `${activeTab}-${si}-${ci}`;
                        return (
                          <label key={ci} style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "8px 12px", borderRadius: 8, background: checked[key] ? wf.light : "#f8fafc", transition: "background 0.15s" }}>
                            <input type="checkbox" checked={!!checked[key]} onChange={() => toggleCheck(key)}
                              style={{ marginTop: 2, accentColor: wf.color, width: 16, height: 16, flexShrink: 0 }} />
                            <span style={{ fontSize: 14, color: checked[key] ? "#94a3b8" : "#334155", textDecoration: checked[key] ? "line-through" : "none", transition: "all 0.15s" }}>{item}</span>
                          </label>
                        );
                      })}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                      {si > 0 && (
                        <button onClick={() => setActiveStep(si - 1)} style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>← Previous</button>
                      )}
                      {si < wf.steps.length - 1 && (
                        <button onClick={() => setActiveStep(si + 1)} style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: wf.color, color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Next Step →</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* FLOWCHART / DECISION TREE VIEW */}
      {view === "flowchart" && (
        <div>
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 24 }}>
            <h3 style={{ margin: "0 0 20px", color: "#1e293b", fontSize: 16 }}>🗺️ Step-by-Step Decision Tree</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {wf.steps.map((s, si) => (
                <div key={si} style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
                  {/* Left rail */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 40, flexShrink: 0 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: wf.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14, flexShrink: 0, zIndex: 1 }}>{si + 1}</div>
                    {si < wf.steps.length - 1 && <div style={{ width: 3, flex: 1, background: `${wf.color}40`, minHeight: 40 }} />}
                  </div>
                  {/* Card */}
                  <div style={{ flex: 1, marginLeft: 12, marginBottom: si < wf.steps.length - 1 ? 12 : 0, paddingBottom: si < wf.steps.length - 1 ? 8 : 0 }}>
                    <div style={{ background: wf.light, border: `1.5px solid ${wf.color}40`, borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 15 }}>{s.title}</div>
                      <div style={{ color: "#475569", fontSize: 13, marginTop: 4 }}>{s.desc}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                        {s.checklist.slice(0, 2).map((item, i) => (
                          <span key={i} style={{ fontSize: 12, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "3px 10px", color: "#475569" }}>{item}</span>
                        ))}
                        {s.checklist.length > 2 && (
                          <span style={{ fontSize: 12, background: wf.color, color: "#fff", borderRadius: 20, padding: "3px 10px" }}>+{s.checklist.length - 2} more</span>
                        )}
                      </div>
                    </div>
                    {si < wf.steps.length - 1 && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0 4px 12px" }}>
                        <div style={{ background: "#dcfce7", color: "#166534", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>✓ Resolved</div>
                        <span style={{ color: "#cbd5e1", fontSize: 12 }}>→ proceed to fix</span>
                        <div style={{ background: "#fee2e2", color: "#991b1b", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>✗ Not yet</div>
                        <span style={{ color: "#cbd5e1", fontSize: 12 }}>→ step {si + 2}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pro Tips */}
      <div style={{ marginTop: 20, background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 20 }}>
        <h3 style={{ margin: "0 0 14px", color: "#1e293b", fontSize: 15, fontWeight: 700 }}>💡 Pro Tips — {wf.label}</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {wf.tips.map((tip, i) => (
            <div key={i} style={{ background: wf.light, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#334155", borderLeft: `3px solid ${wf.color}` }}>{tip}</div>
          ))}
        </div>
      </div>

      {activeTab === "controls" && (
        <div style={{ marginTop: 16, background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 20 }}>
          <h3 style={{ margin: "0 0 10px", color: "#1e293b", fontSize: 15, fontWeight: 700 }}>🏗️ Recommended Layout</h3>
          <pre
            style={{
              margin: 0,
              background: "#0f172a",
              color: "#e2e8f0",
              borderRadius: 10,
              padding: "14px 16px",
              fontSize: 12,
              overflowX: "auto",
              lineHeight: 1.5,
            }}
          >
{`SWD-OS/
  apps/
    controls-center/
  services/
    os-runner/
  packages/
    vault-client/`}
          </pre>
        </div>
      )}

      {/* Footer */}
      <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, marginTop: 24 }}>
        Switch tabs to explore General · Frontend · Backend · Data workflows
      </p>
    </div>
  );
}
