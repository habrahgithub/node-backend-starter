import { useState } from "react";
import { useRouter } from "next/router";
import { ApiRequestError, fetchJson } from "../lib/apiClient";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("operator");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const nextPath = typeof router.query.next === "string" && router.query.next.startsWith("/") ? router.query.next : "/";

  async function onSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload.message || "Authentication failed.");
        setSubmitting(false);
        return;
      }

      router.push(nextPath);
    } catch {
      setError("Authentication request failed.");
      setSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <p className="eyebrow">ARC Console Access</p>
        <h1>Operator Sign-In</h1>
        <p className="login-help">Use local operator credentials to access the unified control plane.</p>

        <form onSubmit={onSubmit} className="login-form">
          <label>
            Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {error ? <p className="login-error">{error}</p> : null}
      </section>
    </main>
  );
}

export async function getServerSideProps(context) {
  try {
    await fetchJson(context, "/api/auth/session");
    const nextPath =
      typeof context.query.next === "string" && context.query.next.startsWith("/") ? context.query.next : "/";

    return {
      redirect: {
        destination: nextPath,
        permanent: false
      }
    };
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      return { props: {} };
    }

    return { props: {} };
  }
}
