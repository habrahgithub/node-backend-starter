# Script Discovery and Fallback Contract

## Inputs

1. Target project path
2. Mode: `fast`, `standard`, `full`
3. Stress approval: `approved` or `not-approved`

## Discovery Order

Find and prefer scripts in this order:

1. `checkup:*`
2. `verify`
3. `test`
4. `build`

Search locations:

1. `package.json` scripts
2. `Makefile` targets

## Minimum Discovery Output

```text
Project: <name>
Mode: <fast|standard|full>
Scripts found:
- checkup:run
- checkup:full
- verify
- test
- build
```

## Fallback Rule

If a script is missing for a layer:

1. Use explicit command only for that missing layer.
2. Record fallback command in evidence.
3. Continue deterministic order.
