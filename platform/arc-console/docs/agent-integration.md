# Agent Integration

## Agent Model

Managed agents:

- Axis
- Forge
- Sentinel
- Warden
- Cline

The current model is exposed from `server/services/systemRegistry.js` and returned by `GET /api/agents`.

## Fields

- `status`
- `currentTask`
- `pipelineStage`
- `role`

## Planned Evolution

- wire agent state to governed runtime sources
- connect agent activity to control-plane logs and health signals
- keep all agent control actions approval-gated
