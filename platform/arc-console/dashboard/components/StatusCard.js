export function StatusCard({ label, value, detail }) {
  return (
    <article className="status-card">
      <p className="status-label">{label}</p>
      <strong className="status-value">{value}</strong>
      {detail ? <p className="status-detail">{detail}</p> : null}
    </article>
  );
}
