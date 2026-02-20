# Social Marketing Studio Workflow (v1.0)

## 1) Define Campaign (Required)

Capture and confirm:

1. Goal
2. Audience
3. Platform(s)
4. Core message
5. CTA

Do not proceed if any are missing.

## 2) Generate Visual Assets

Generate at minimum:

1. Hero 1:1
2. Hero 4:5
3. Story 9:16

Requirements:

1. High contrast text/background
2. Mobile-legible type sizes
3. No watermark or placeholder artifacts

## 3) Capture Demo Video

Use Playwright-based capture:

```bash
/home/habib/workspace/.codex/skills/social-marketing-content-studio/scripts/capture_demo_video.sh \
  --flow docsmith-sif-golden \
  --duration-sec 45 \
  --out-dir artifacts/raw \
  --viewport 1080x1920
```

Notes:

1. Keep clip length to 30-60 seconds.
2. Prefer deterministic test/demo states.
3. Store raw captures under `artifacts/raw`.

## 4) Generate Narration

Create a concise, authoritative voiceover:

```bash
python3 /home/habib/.codex/skills/speech/scripts/text_to_speech.py speak \
  --input-file artifacts/scripts/narration.txt \
  --voice cedar \
  --speed 1.0 \
  --out artifacts/audio/narration.wav
```

Narration rules:

1. Hook in first 2 seconds.
2. No filler language.
3. Target ~120-150 words per minute.

## 5) Compose Final Video

Overlay headline text and sync voiceover:

```bash
/home/habib/workspace/.codex/skills/social-marketing-content-studio/scripts/overlay_text_and_audio.sh \
  --input-video artifacts/raw/demo.webm \
  --audio artifacts/audio/narration.wav \
  --overlay-text "DocSmith cuts payroll prep time." \
  --output artifacts/final/demo-final-9x16.mp4
```

Export all required platform variants.

## 6) Package Deliverables

Use naming convention:

`YYYY-MM-DD_platform_assettype_version.ext`

Example:

1. `2026-02-19_linkedin_demo_v1.mp4`
2. `2026-02-19_instagram_story_v1.mp4`

## 7) Mandatory Quality Gate

Before completion verify:

1. Opening 2 seconds include brand context.
2. Text remains readable on a 6.1-inch mobile display.
3. Audio and visual timing are aligned.
4. Ratio/duration comply with platform contract.
5. No low-res scaling artifacts.
6. No placeholder text or watermark artifacts.
