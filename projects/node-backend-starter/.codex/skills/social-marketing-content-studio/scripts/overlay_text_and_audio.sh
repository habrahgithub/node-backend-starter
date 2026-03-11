#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<USAGE
Add text overlay and optional narration audio to a video.

Usage:
  overlay_text_and_audio.sh --input-video FILE --overlay-text TEXT --output FILE [--audio FILE] [--font-size N] [--x EXPR] [--y EXPR]

Example:
  overlay_text_and_audio.sh --input-video demo.webm --audio voiceover.mp3 --overlay-text "Launch in minutes" --output final.mp4
USAGE
}

INPUT_VIDEO=""
AUDIO_FILE=""
OVERLAY_TEXT=""
OUTPUT_FILE=""
FONT_SIZE=54
X_EXPR="(w-text_w)/2"
Y_EXPR="h-(text_h*2)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --input-video) INPUT_VIDEO="$2"; shift 2 ;;
    --audio) AUDIO_FILE="$2"; shift 2 ;;
    --overlay-text) OVERLAY_TEXT="$2"; shift 2 ;;
    --output) OUTPUT_FILE="$2"; shift 2 ;;
    --font-size) FONT_SIZE="$2"; shift 2 ;;
    --x) X_EXPR="$2"; shift 2 ;;
    --y) Y_EXPR="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$INPUT_VIDEO" || -z "$OVERLAY_TEXT" || -z "$OUTPUT_FILE" ]]; then
  echo "--input-video, --overlay-text, and --output are required" >&2
  usage
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is required for overlay composition" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUTPUT_FILE")"

DRAW="drawtext=text='${OVERLAY_TEXT//:/\\:}':fontcolor=white:fontsize=${FONT_SIZE}:x=${X_EXPR}:y=${Y_EXPR}:box=1:boxcolor=black@0.45:boxborderw=16"

if [[ -n "$AUDIO_FILE" ]]; then
  ffmpeg -y -i "$INPUT_VIDEO" -i "$AUDIO_FILE" \
    -vf "$DRAW" \
    -map 0:v:0 -map 1:a:0 -c:v libx264 -c:a aac -shortest "$OUTPUT_FILE" >/dev/null 2>&1
else
  ffmpeg -y -i "$INPUT_VIDEO" \
    -vf "$DRAW" \
    -c:v libx264 -an "$OUTPUT_FILE" >/dev/null 2>&1
fi

echo "$OUTPUT_FILE"
