# Storage Policy

Keep the repository lean and audit friendly.

Allowed:
- Source code, configs, and documentation.
- Small reference assets required for the repo to function.

Not allowed:
- Logs, debug dumps, crash reports, or console output.
- Build artifacts, caches, or compiled outputs.
- Credentials, secrets, or personal data.
- Large binaries that are not required to build or run.

If a large or generated artifact is required, store it outside the repo and link to it.
Update `.gitignore` when new build or log outputs appear.
