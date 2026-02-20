# Artifact Governance Contract

Classify artifacts before deciding whether they are commit-eligible.

| Type | Example | Persistence |
| --- | --- | --- |
| Product code | `projects/**/src/**` | Persistent |
| Golden expected output | `expected/**/*.sif` | Persistent |
| Generated test output | `artifacts/downloads/*.sif` | Temporary |
| Demo video output | `artifacts/videos/*.mp4` | Temporary |
| Marketing export pack | `campaign-packaged/**` | Persistent (tagged release only) |

## Non-Commit Rules

Never commit unless explicitly approved:

1. Generated videos (`.mp4`, `.webm`)
2. Generated SIF outputs outside canonical expected fixtures
3. Raw Playwright artifacts (`test-results`, `playwright-report`, videos)
4. Temporary logs and scratch files
5. Secrets and `.env` files

## Blockers

1. Tracked noisy artifacts -> Blocker
2. Tracked secrets/`.env` -> Critical Blocker
