#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<USAGE
Usage:
  rotate_vercel_env_token.sh --token-name NAME --environment ENV --value-env ENV_VAR [--project DIR] [--scope TEAM] [--apply]

Defaults to dry-run unless --apply is provided.
ENV must be one of: development, preview, production.
USAGE
}

PROJECT_DIR="."
TOKEN_NAME=""
TARGET_ENV=""
VALUE_ENV=""
SCOPE=""
APPLY=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project)
      PROJECT_DIR="$2"; shift 2 ;;
    --token-name)
      TOKEN_NAME="$2"; shift 2 ;;
    --environment)
      TARGET_ENV="$2"; shift 2 ;;
    --value-env)
      VALUE_ENV="$2"; shift 2 ;;
    --scope)
      SCOPE="$2"; shift 2 ;;
    --apply)
      APPLY=1; shift ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1 ;;
  esac
done

if [[ -z "$TOKEN_NAME" || -z "$TARGET_ENV" || -z "$VALUE_ENV" ]]; then
  echo "Missing required arguments." >&2
  usage
  exit 1
fi

if [[ "$TARGET_ENV" != "development" && "$TARGET_ENV" != "preview" && "$TARGET_ENV" != "production" ]]; then
  echo "Invalid --environment: $TARGET_ENV" >&2
  exit 1
fi

if [[ -z "${!VALUE_ENV:-}" ]]; then
  echo "Environment variable '$VALUE_ENV' is empty or unset." >&2
  exit 1
fi

VALUE="${!VALUE_ENV}"

CMD_SCOPE=()
if [[ -n "$SCOPE" ]]; then
  CMD_SCOPE=(--scope "$SCOPE")
fi

echo "Vercel token rotation plan"
echo "  Project: $PROJECT_DIR"
echo "  Variable: $TOKEN_NAME"
echo "  Environment: $TARGET_ENV"
echo "  New value source: \$$VALUE_ENV (length ${#VALUE})"

if [[ $APPLY -eq 0 ]]; then
  echo "Dry-run mode. Re-run with --apply to execute."
  exit 0
fi

command -v vercel >/dev/null 2>&1 || { echo "vercel CLI is required." >&2; exit 1; }

pushd "$PROJECT_DIR" >/dev/null

# Remove old value if it exists, continue if missing.
vercel env rm "$TOKEN_NAME" "$TARGET_ENV" --yes "${CMD_SCOPE[@]}" >/dev/null 2>&1 || true

# Add new value by stdin to avoid shell history leaks.
printf '%s\n' "$VALUE" | vercel env add "$TOKEN_NAME" "$TARGET_ENV" "${CMD_SCOPE[@]}"

popd >/dev/null

echo "Rotation completed for $TOKEN_NAME on Vercel ($TARGET_ENV)."
