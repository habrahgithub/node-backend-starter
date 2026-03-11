#!/usr/bin/env bash
set -euo pipefail

# Safe helper: validates required API keys are already set in the shell.
# No secret values are stored in this repository.

required_keys=(
  OPENAI_API_KEY
  GOOGLE_API_KEY
  GROQ_API_KEY
  OLLAMA_API_KEY
  OPENROUTER_API_KEY
)

echo "Checking API key environment variables..."
missing=()
for key in "${required_keys[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    missing+=("$key")
  fi
done

if [[ "${#missing[@]}" -gt 0 ]]; then
  echo "Missing required keys:"
  for key in "${missing[@]}"; do
    echo "  - $key"
  done
  echo
  echo "Set them in your local shell profile (not in repo files), then rerun."
  exit 1
fi

echo "All required API keys are present in this shell session."
echo "Restart your tools to ensure they pick up the current environment."
