# Command Notes

## Safety

- Keep scripts in dry-run by default.
- Never print token values in logs.
- Do not commit token values to files.

## Vercel

- Requires project linked via `vercel link` or use correct cwd.
- Rotation flow in script:
  1. Remove old env var value for target environment.
  2. Add new value from shell environment variable.

## Railway

- Requires project/environment linked in target working directory.
- Rotation flow in script:
  1. Resolve service ID from `railway status --json` (unless `--shared`).
  2. Build JSON patch with `jq`.
  3. Apply with `railway environment edit --json`.
