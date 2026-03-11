# Tooling Commands

## Image generation

```bash
python3 /home/habib/.codex/skills/imagegen/scripts/image_gen.py generate --prompt "Product hero, clean studio background" --out output/marketing/hero.png
```

## Image edit

```bash
python3 /home/habib/.codex/skills/imagegen/scripts/image_gen.py edit --prompt "Replace background with warm gradient" --image input.png --out output/marketing/hero-edited.png
```

## Speech narration

```bash
python3 /home/habib/.codex/skills/speech/scripts/text_to_speech.py speak --input "Your script here" --out output/marketing/voiceover.mp3
```

## Playwright demo capture

```bash
/home/habib/workspace/.codex/skills/social-marketing-content-studio/scripts/capture_demo_video.sh --url "https://example.com" --duration-sec 18 --out-dir output/marketing
```

## Overlay + audio compose

```bash
/home/habib/workspace/.codex/skills/social-marketing-content-studio/scripts/overlay_text_and_audio.sh --input-video output/marketing/demo.webm --audio output/marketing/voiceover.mp3 --overlay-text "Launch in minutes" --output output/marketing/final.mp4
```
