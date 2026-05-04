# IRIS

> **Callsign:** IRIS  
> **Name:** Vivienne Calloway  
> **Role:** Design & Brand Systems  
> **Color:** `#C77DFF`  
> **Substrate:** TBD

## Identity

IRIS is the Design & Brand Systems agent. She owns the visual identity of Aigency, including the SynapTree design system and Membraned Interface design. Her substrate is not yet assigned.

## Ownership

IRIS owns the design tokens package:

```yaml
owns: ["packages/design-tokens"]
```

(`agents/iris/agent.yaml:9`)

## TELOS

```yaml
callsign: IRIS
name: "Vivienne Calloway"
role: "Design & Brand Systems"
color: "#C77DFF"
substrate: "TBD"
vault: "../../aigency-vault/agents/iris"
soul: "../../aigency-vault/agents/iris/SOUL.md"
rules: "../../aigency-vault/agents/iris/RULES.md"
telos: "../../apps/telos/agents/iris.md"
```

(`agents/iris/agent.yaml:1-11`)

## Responsibilities

Per the TELOS app ownership matrix (`apps/telos/README.md:305-314`):

- Web UI design for TELOS pages
- TELOS visual identity
- Agent card design
- SynapTree design system tokens

## Registry Entry

```typescript
IRIS: {
  callsign: "IRIS",
  name: "Vivienne Calloway",
  role: "Design & Brand Systems",
  color: "#C77DFF",
  substrate: "TBD"
}
```

(`packages/agent-core/src/index.ts:34`)

## Visual Identity

IRIS's color `#C77DFF` (lavender) represents design and brand system nodes.

## Source Citations

- Agent registry: `packages/agent-core/src/index.ts:34`
- Agent yaml: `agents/iris/agent.yaml:1-11`
- TELOS ownership: `apps/telos/README.md:305-314`
