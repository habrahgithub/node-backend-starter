# Tooling Commands

## Image Generation

```bash
python3 /home/habib/.codex/skills/imagegen/scripts/image_gen.py generate \
  --prompt "DocSmith product hero, clean layout, high contrast text area" \
  --size 1024x1024 \
  --out artifacts/images/hero-1x1.png
```

```bash
python3 /home/habib/.codex/skills/imagegen/scripts/image_gen.py generate \
  --prompt "DocSmith social story visual, vertical, strong headline space" \
  --size 1024x1536 \
  --out artifacts/images/story-9x16.png
```

## Image Edit

```bash
python3 /home/habib/.codex/skills/imagegen/scripts/image_gen.py edit \
  --prompt "Replace background with brand-safe gradient and increase contrast" \
  --image artifacts/images/source.png \
  --out artifacts/images/hero-edited.png
```

## Speech Narration

```bash
python3 /home/habib/.codex/skills/speech/scripts/text_to_speech.py speak \
  --input-file artifacts/scripts/narration.txt \
  --voice cedar \
  --speed 1.0 \
  --response-format wav \
  --out artifacts/audio/narration.wav
```

## Demo Capture (Playwright)

```bash
/home/habib/workspace/.codex/skills/social-marketing-content-studio/scripts/capture_demo_video.sh \
  --flow docsmith-sif-golden \
  --duration-sec 45 \
  --out-dir artifacts/raw \
  --viewport 1080x1920
```

## Overlay + Audio Composition

```bash
/home/habib/workspace/.codex/skills/social-marketing-content-studio/scripts/overlay_text_and_audio.sh \
  --input-video artifacts/raw/demo.webm \
  --audio artifacts/audio/narration.wav \
  --overlay-text "Still generating WPS files manually?" \
  --output artifacts/final/demo-final-9x16.mp4
```

## Packaging

```bash
STAMP="$(date +%F)"
cp artifacts/final/demo-final-9x16.mp4 "artifacts/final/${STAMP}_instagram_demo_v1.mp4"
```
