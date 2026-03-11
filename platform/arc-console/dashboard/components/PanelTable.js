export function PanelTable({ title, columns, rows }) {
  const safeRows = Array.isArray(rows) ? rows : [];

  return (
    <section className="panel">
      <div className="panel-header">
        <h3>{title}</h3>
      </div>
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {safeRows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>No data available.</td>
            </tr>
          ) : (
            safeRows.map((row, rowIndex) => (
              <tr key={row.id || `${rowIndex}-${row.name || "row"}`}>
                {columns.map((column) => (
                  <td key={column.key}>{row[column.key]}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
