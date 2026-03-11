---
name: social-marketing-content-studio
description: Create end-to-end social media marketing content including image generation/editing, demo video capture with Playwright, speech narration, text overlays, and final content packaging. Use when the user asks to produce marketing assets or campaign-ready creative bundles.
---

# Social Marketing Content Studio

## Scope

Produce ready-to-publish social assets across image, video, and audio formats.

## Core Capabilities

1. Image generation and editing
2. Demo video capture using Playwright
3. Speech narration (text-to-speech)
4. Text overlay and caption burn-in
5. Multi-platform export packaging

## Workflow

1. Define campaign goal, audience, and target platforms.
2. Generate visual assets:
   - Use `imagegen` CLI for new visuals or edits.
3. Capture demo video:
   - Use `scripts/capture_demo_video.sh` for browser-flow capture.
4. Generate narration:
   - Use `speech` CLI for TTS voiceover.
5. Compose overlays and final video:
   - Use `scripts/overlay_text_and_audio.sh`.
6. Package final deliverables with naming by platform and date.

## Tool Mapping

- Image create/edit:
  - `python3 /home/habib/.codex/skills/imagegen/scripts/image_gen.py`
- Speech generation:
  - `python3 /home/habib/.codex/skills/speech/scripts/text_to_speech.py`
- Demo capture:
  - `scripts/capture_demo_video.sh`
- Overlay composition:
  - `scripts/overlay_text_and_audio.sh`

## Output Bundle (Minimum)

- `hero-image` (1:1 + 4:5 variants)
- `story-vertical` (9:16)
- `demo-video` (with text overlay)
- `voiceover` audio file
- `caption-pack` (short + long + hashtags)

## Quality Gate

1. Text is legible on mobile.
2. Opening 2 seconds includes brand/context hook.
3. Captions and spoken audio stay aligned.
4. Exports match target platform aspect ratios.
5. No watermark, placeholder, or low-res artifacts.

## References

- `references/workflow.md`
- `references/platform-specs.md`
- `references/tooling-commands.md`
