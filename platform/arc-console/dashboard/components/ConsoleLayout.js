import Link from "next/link";
import { useRouter } from "next/router";

const navItems = [
  ["/", "Dashboard"],
  ["/services", "Services"],
  ["/repositories", "Repositories"],
  ["/repo-health", "Repo Health"],
  ["/agents", "Agents"],
  ["/automation", "Automation"],
  ["/workflows", "Workflows"],
  ["/intelligence", "Intelligence"],
  ["/service-trends", "Service Trends"],
  ["/repo-drift", "Repo Drift"],
  ["/assistant", "Assistant"],
  ["/diagnostics", "Diagnostics"],
  ["/repo-advisor", "Repo Advisor"],
  ["/alerts", "Alerts"],
  ["/reliability", "Reliability"],
  ["/incidents", "Incidents"],
  ["/playbooks", "Playbooks"],
  ["/recovery-advice", "Recovery Advice"],
  ["/graph", "Graph"],
  ["/service-map", "Service Map"],
  ["/repo-map", "Repo Map"],
  ["/copilot", "Copilot"],
  ["/copilot-history", "Copilot History"],
  ["/fabric", "Fabric"],
  ["/nodes", "Nodes"],
  ["/node-topology", "Node Topology"],
  ["/governance", "Governance"],
  ["/policies", "Policies"],
  ["/compliance", "Compliance"],
  ["/violations", "Violations"],
  ["/security", "Security"],
  ["/logs", "Logs"]
];

export function ConsoleLayout({ title, warningCount = 0, children }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="console-shell">
      <aside className="console-sidebar">
        <div>
          <p className="eyebrow">Unified Control Plane</p>
          <h1>ARC Console</h1>
          <p className="sidebar-warning">Warnings: {warningCount}</p>
        </div>
        <nav>
          {navItems.map(([href, label]) => (
            <Link key={href} href={href} className="nav-link">
              {label}
            </Link>
          ))}
        </nav>
        <button type="button" className="logout-btn" onClick={handleLogout}>
          Sign out
        </button>
      </aside>
      <main className="console-main">
        <header className="console-header">
          <p className="eyebrow">Solo Operator Cockpit</p>
          <h2>{title}</h2>
        </header>
        {children}
      </main>
    </div>
  );
}
