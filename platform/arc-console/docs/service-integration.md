# Service Integration

## Current Wiring

Service inventory is loaded from:

- `operation-clean/classification/asset_registry_v2.csv`
- `operation-clean/recovery/move_plan_v3.csv` (execution context)

The registry derives service domain, lifecycle status, runtime hints, and execution readiness.

## API Surface

- `GET /api/services`
- `GET /api/services/health`

## Next Integration Steps

1. replace CSV-backed inventory with runtime service adapters per managed system
2. add per-service telemetry collectors
3. introduce controlled write actions only with explicit governance approval
