import "./globals.css";

export const metadata = {
  title: "SWD Vault War Room",
  description: "Local-first SWD Vault status dashboard"
};

export default function RootLayout({ children }) {
  const schemaVersion = process.env.VAULT_SCHEMA_VERSION || "1.0";
  const buildId = process.env.VAULT_BUILD_ID || "dev";
  return (
    <html lang="en">
      <body>
        {children}
        <footer className="appFooter">
          <div className="page">
            <p className="small mono">
              VAULT_SCHEMA_VERSION={schemaVersion} | VAULT_BUILD_ID={buildId}
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
