#!/bin/bash
# DB Migration Script for DEV EC

# Fail-fast guard: DEVEC_DB must be set
if [ -z "$DEVEC_DB" ]; then
  echo "ERROR: DEVEC_DB environment variable is not set." >&2
  echo "Please set DEVEC_DB before running migrations." >&2
  exit 1
fi

echo "Running database migrations..."
cd "$(dirname "$0")/.."

dotnet ef database update --project src/DevEc.Infrastructure --startup-project src/DevEc.Api

echo "Migration complete."
