# ZENITH

> **Callsign:** ZENITH  
> **Name:** Newton Hughes  
> **Role:** Chief of Staff & Orchestrator  
> **Color:** `#00E5CC`  
> **Substrate:** OpenClaw

## Identity

ZENITH is the Chief of Staff and Orchestrator of Aigency's Core Exec Squad. He coordinates the other 7 executive agents (CIPHER, VECTOR, ECHO, ATLAS, COMPASS, IRIS, HERALD) plus the infrastructure agents (ORACLE, LIBRARIAN).

## Critical Naming Rule

ZENITH has an identical twin: **NEXUS** (Marcus Hale), who runs the Agile Squad. NEXUS is **not** in this monorepo's `agents/` directory. They are separate entities. Do not conflate them (`CLAUDE.md:64-67`).

## TELOS

ZENITH's identity document lives at `apps/telos/agents/zenith.md` (currently a skeleton draft). The `agent.yaml` links to it:

```yaml
callsign: ZENITH
name: "Newton Hughes"
role: "Chief of Staff & Orchestrator"
color: "#00E5CC"
substrate: "OpenClaw"
vault: "../../aigency-vault/agents/zenith"
soul: "../../aigency-vault/agents/zenith/SOUL.md"
rules: "../../aigency-vault/agents/zenith/RULES.md"
twin: NEXUS
twin_note: "Identical twins. ZENITH runs the Core Exec Squad. NEXUS runs the Agile Squad."
telos: "../../apps/telos/agents/zenith.md"
```

(`agents/zenith/agent.yaml:1-12`)

## Responsibilities

Per the TELOS app ownership matrix (`apps/telos/README.md:305-314`):

- Squad alignment on TELOS priorities
- Review cadence for all agent TELOS files
- Orchestration of cross-agent projects

## Registry Entry

```typescript
ZENITH: {
  callsign: "ZENITH",
  name: "Newton Hughes",
  role: "Chief of Staff & Orchestrator",
  color: "#00E5CC",
  substrate: "OpenClaw"
}
```

(`packages/agent-core/src/index.ts:28`)

## Visual Identity

ZENITH's color `#00E5CC` (turquoise) flows into the Membrane via `agentColor("zenith")` (`packages/design-tokens/src/index.ts:12-15`).

## Source Citations

- Agent registry: `packages/agent-core/src/index.ts:28`
- Agent yaml: `agents/zenith/agent.yaml:1-12`
- Twin rule: `CLAUDE.md:64-67`
- TELOS ownership: `apps/telos/README.md:305-314`
