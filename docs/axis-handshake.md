# Axis Architecture Handshake

Workspace Root
/home/habib/workspace

Runtime Topology
IDE → Axis MCP Gateway → Local Axis Runtime (127.0.0.1:4010) → Workspace

Actor Model
Prime: Final authority
Axis: Architecture & boundaries
Warden: Governance & security policy
Sentinel: Oversight & runtime verification
Forge: Implementation executor

Allowed Execution Zones
/projects
/docs
/.gemini

Restricted Zones
/tmp
/system
external mounts

Security Posture
- Fail closed
- Directive-bound access
- Artifact writes restricted to approved roots

Evidence Requirements
All changes must include:
- file path
- diff or artifact output
- runtime validation