#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<USAGE
Usage:
  rotate_railway_env_token.sh --variable NAME --value-env ENV_VAR [--project DIR] [--environment ENV] [--service-name NAME | --shared] [--apply]

Defaults to dry-run unless --apply is provided.
Use --service-name for service-scoped variables or --shared for sharedVariables.
USAGE
}

PROJECT_DIR="."
ENVIRONMENT_NAME=""
SERVICE_NAME=""
SHARED=0
VARIABLE_NAME=""
VALUE_ENV=""
APPLY=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project)
      PROJECT_DIR="$2"; shift 2 ;;
    --environment)
      ENVIRONMENT_NAME="$2"; shift 2 ;;
    --service-name)
      SERVICE_NAME="$2"; shift 2 ;;
    --shared)
      SHARED=1; shift ;;
    --variable)
      VARIABLE_NAME="$2"; shift 2 ;;
    --value-env)
      VALUE_ENV="$2"; shift 2 ;;
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

if [[ -z "$VARIABLE_NAME" || -z "$VALUE_ENV" ]]; then
  echo "Missing required arguments." >&2
  usage
  exit 1
fi

if [[ $SHARED -eq 0 && -z "$SERVICE_NAME" ]]; then
  echo "Provide --service-name or use --shared." >&2
  exit 1
fi

if [[ $SHARED -eq 1 && -n "$SERVICE_NAME" ]]; then
  echo "Use either --service-name or --shared, not both." >&2
  exit 1
fi

if [[ -z "${!VALUE_ENV:-}" ]]; then
  echo "Environment variable '$VALUE_ENV' is empty or unset." >&2
  exit 1
fi

VALUE="${!VALUE_ENV}"

command -v jq >/dev/null 2>&1 || { echo "jq is required." >&2; exit 1; }

pushd "$PROJECT_DIR" >/dev/null

if [[ -n "$ENVIRONMENT_NAME" ]]; then
  railway environment "$ENVIRONMENT_NAME" >/dev/null
fi

if [[ $SHARED -eq 1 ]]; then
  PATCH_JSON="$(jq -n --arg key "$VARIABLE_NAME" --arg val "$VALUE" '{sharedVariables:{($key):{value:$val}}}')"
  TARGET_DESC="shared variable"
else
  SERVICE_ID="$(railway status --json | jq -r --arg name "$SERVICE_NAME" '.project.services[]? | select(.name == $name) | .id' | head -n 1)"
  if [[ -z "$SERVICE_ID" ]]; then
    echo "Service '$SERVICE_NAME' not found in linked project." >&2
    railway status --json | jq -r '.project.services[]?.name' >&2 || true
    exit 1
  fi
  PATCH_JSON="$(jq -n --arg sid "$SERVICE_ID" --arg key "$VARIABLE_NAME" --arg val "$VALUE" '{services:{($sid):{variables:{($key):{value:$val}}}}}')"
  TARGET_DESC="service '$SERVICE_NAME'"
fi

echo "Railway token rotation plan"
echo "  Project: $PROJECT_DIR"
[[ -n "$ENVIRONMENT_NAME" ]] && echo "  Environment: $ENVIRONMENT_NAME"
echo "  Target: $TARGET_DESC"
echo "  Variable: $VARIABLE_NAME"
echo "  New value source: \$$VALUE_ENV (length ${#VALUE})"

if [[ $APPLY -eq 0 ]]; then
  echo "Dry-run mode. Re-run with --apply to execute."
  popd >/dev/null
  exit 0
fi

command -v railway >/dev/null 2>&1 || { echo "railway CLI is required." >&2; popd >/dev/null; exit 1; }

railway environment edit -m "rotate $VARIABLE_NAME token" --json <<<"$PATCH_JSON"

popd >/dev/null

echo "Rotation completed for $VARIABLE_NAME on Railway ($TARGET_DESC)."
