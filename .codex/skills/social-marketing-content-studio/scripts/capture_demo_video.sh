#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<USAGE
Capture a browser demo clip using Playwright test runner video artifacts.

Usage:
  capture_demo_video.sh --url URL [--duration-sec N] [--out-dir DIR] [--viewport WIDTHxHEIGHT]
  capture_demo_video.sh --flow FLOW [--duration-sec N] [--out-dir DIR] [--viewport WIDTHxHEIGHT]

Example:
  capture_demo_video.sh --url "https://example.com" --duration-sec 20 --out-dir output/marketing --viewport 1080x1920
  capture_demo_video.sh --flow docsmith-sif-golden --duration-sec 45 --out-dir artifacts/raw --viewport 1080x1920

Supported flows:
  - docsmith-sif-golden
USAGE
}

URL=""
FLOW=""
DURATION_SEC=15
DURATION_SET=0
OUT_DIR="artifacts/raw"
VIEWPORT="1280x720"
START_SERVER_CMD=""
WARMUP_SEC=0
SERVER_PID=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --url) URL="$2"; shift 2 ;;
    --flow) FLOW="$2"; shift 2 ;;
    --duration-sec) DURATION_SEC="$2"; DURATION_SET=1; shift 2 ;;
    --out-dir) OUT_DIR="$2"; shift 2 ;;
    --viewport) VIEWPORT="$2"; shift 2 ;;
    --start-server-cmd) START_SERVER_CMD="$2"; shift 2 ;;
    --warmup-sec) WARMUP_SEC="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 1 ;;
  esac
done

resolve_flow_defaults() {
  local script_dir workspace_dir extension_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  workspace_dir="$(cd "$script_dir/../../../../" && pwd)"
  extension_dir="$workspace_dir/projects/swd-docsmith-sif-extension/chrome/dist/extension"

  case "$FLOW" in
    "")
      return
      ;;
    docsmith-sif-golden)
      URL="${URL:-http://127.0.0.1:3100}"
      if [[ "$DURATION_SET" -eq 0 ]]; then
        DURATION_SEC=45
      fi
      if [[ -z "$START_SERVER_CMD" && -d "$extension_dir" ]]; then
        START_SERVER_CMD="python3 -m http.server 3100 --bind 127.0.0.1 --directory \"$extension_dir\""
      fi
      ;;
    *)
      echo "Unknown --flow value: $FLOW" >&2
      usage
      exit 1
      ;;
  esac
}

cleanup() {
  if [[ -n "$SERVER_PID" ]]; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "${TMP_DIR:-}" && -d "${TMP_DIR:-}" ]]; then
    rm -rf "$TMP_DIR"
  fi
}

resolve_flow_defaults

if [[ -z "$URL" ]]; then
  echo "--url or a supported --flow is required" >&2
  usage
  exit 1
fi

if ! [[ "$VIEWPORT" =~ ^[0-9]+x[0-9]+$ ]]; then
  echo "--viewport must be WIDTHxHEIGHT (example: 1080x1920)" >&2
  exit 1
fi

WIDTH="${VIEWPORT%x*}"
HEIGHT="${VIEWPORT#*x}"
DURATION_MS=$((DURATION_SEC * 1000))

TMP_DIR="$(mktemp -d)"
trap cleanup EXIT

SPEC="$TMP_DIR/demo.spec.js"
CFG="$TMP_DIR/playwright.config.js"
RUN_OUT="$TMP_DIR/output"
SERVER_LOG="$TMP_DIR/server.log"

if [[ -n "$START_SERVER_CMD" ]]; then
  bash -lc "$START_SERVER_CMD" >"$SERVER_LOG" 2>&1 &
  SERVER_PID=$!

  if command -v curl >/dev/null 2>&1; then
    for _ in $(seq 1 45); do
      if curl -fsS "$URL" >/dev/null 2>&1; then
        break
      fi
      sleep 1
    done
  fi
fi

if [[ "$WARMUP_SEC" -gt 0 ]]; then
  sleep "$WARMUP_SEC"
fi

cat > "$SPEC" <<'SPECFILE'
const { test } = require('@playwright/test');

test('capture demo clip', async ({ page }) => {
  const url = process.env.DEMO_URL;
  const durationMs = Number(process.env.DEMO_DURATION_MS || 15000);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(durationMs);
});
SPECFILE

cat > "$CFG" <<CFGFILE
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  retries: 0,
  reporter: 'dot',
  use: {
    headless: true,
    video: 'on',
    viewport: { width: ${WIDTH}, height: ${HEIGHT} }
  }
});
CFGFILE

mkdir -p "$OUT_DIR"

DEMO_URL="$URL" DEMO_DURATION_MS="$DURATION_MS" \
  npx -y @playwright/test test "$SPEC" --config "$CFG" --output "$RUN_OUT" >/dev/null

VIDEO_FILE="$(find "$RUN_OUT" -type f \( -name '*.webm' -o -name '*.mp4' \) | head -n 1 || true)"
if [[ -z "$VIDEO_FILE" ]]; then
  echo "No video artifact produced by Playwright run." >&2
  exit 1
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
EXT="${VIDEO_FILE##*.}"
FLOW_SUFFIX=""
if [[ -n "$FLOW" ]]; then
  FLOW_SUFFIX="-$(echo "$FLOW" | tr -cs 'a-zA-Z0-9' '-')"
fi
DEST="$OUT_DIR/demo${FLOW_SUFFIX}-${STAMP}.${EXT}"
cp "$VIDEO_FILE" "$DEST"

echo "$DEST"
