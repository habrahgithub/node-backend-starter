---
name: social-marketing-content-studio
description: Execute a deterministic social marketing content pipeline for DocSmith/SWD campaigns, including image generation/editing, Playwright demo capture, voiceover, video composition, packaging, and QA gates for platform-ready delivery.
---

# Social Marketing Content Studio

Use this skill when the user asks to produce campaign-ready social media assets or to run a repeatable content studio pipeline.

## Purpose

Produce ready-to-publish, platform-optimized marketing assets that are mobile-legible, brand-consistent, and free of placeholders/artifacts.

## Required Inputs (Blocker)

Collect all of these before execution:

1. Campaign goal
2. Target audience
3. Target platforms
4. Core message
5. CTA

If any input is missing, ask for it and do not continue generation.

## Execution Standard (v1.0)

Run steps in order:

1. Define campaign brief and acceptance criteria.
2. Generate visual assets in required ratios.
3. Capture deterministic product demo footage with Playwright.
4. Generate narration voiceover.
5. Compose final videos with overlays/audio.
6. Package assets with naming/versioning convention.
7. Run mandatory quality gate before completion.

## Output Bundle (Minimum)

For each campaign, produce:

1. Visual assets:
   - hero image 1:1
   - hero image 4:5
   - story image/video 9:16
2. Video assets:
   - demo video (9:16 minimum; 1:1 optional per platform)
   - text overlays burned in final export
3. Audio assets:
   - narration voiceover (`.mp3` or `.wav`)
4. Copy pack:
   - short caption
   - long caption
   - hashtag pack per platform

## Tool Mapping

- Image generation/editing:
  - `python3 /home/habib/.codex/skills/imagegen/scripts/image_gen.py`
- Voice generation:
  - `python3 /home/habib/.codex/skills/speech/scripts/text_to_speech.py`
- Demo capture:
  - `scripts/capture_demo_video.sh`
- Overlay composition:
  - `scripts/overlay_text_and_audio.sh`

## Quality Gate (Mandatory)

All checks must pass:

1. Opening 2 seconds establish brand/context.
2. Text is readable on mobile screens.
3. Caption/overlay timing aligns with voiceover.
4. Aspect ratio and duration match platform contract.
5. No low-resolution scaling artifacts.
6. No placeholders, dummy text, or watermark artifacts.

If any check fails, regenerate only affected assets and rerun QA.

## References

- `references/workflow.md`
- `references/platform-specs.md`
- `references/hook-library.md`
- `references/tooling-commands.md`
