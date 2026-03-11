#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<USAGE
Capture a browser demo clip using Playwright test runner video artifacts.

Usage:
  capture_demo_video.sh --url URL [--duration-sec N] [--out-dir DIR] [--viewport WIDTHxHEIGHT]

Example:
  capture_demo_video.sh --url "https://example.com" --duration-sec 20 --out-dir output/marketing --viewport 1080x1920
USAGE
}

URL=""
DURATION_SEC=15
OUT_DIR="output/marketing"
VIEWPORT="1280x720"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --url) URL="$2"; shift 2 ;;
    --duration-sec) DURATION_SEC="$2"; shift 2 ;;
    --out-dir) OUT_DIR="$2"; shift 2 ;;
    --viewport) VIEWPORT="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$URL" ]]; then
  echo "--url is required" >&2
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
trap 'rm -rf "$TMP_DIR"' EXIT

SPEC="$TMP_DIR/demo.spec.js"
CFG="$TMP_DIR/playwright.config.js"
RUN_OUT="$TMP_DIR/output"

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
DEST="$OUT_DIR/demo-${STAMP}.${EXT}"
cp "$VIDEO_FILE" "$DEST"

echo "$DEST"
