# CIPHER

> **Callsign:** CIPHER  
> **Name:** Roman Voss  
> **Role:** Engineering & DevOps  
> **Color:** `#39FF14`  
> **Substrate:** gptme

## Identity

CIPHER is the Engineering & DevOps agent. He owns the implementation of Membrane (3D interface), Router (LLM proxy), and Contracts (Solidity). His substrate is `gptme`.

## Ownership

CIPHER owns three critical directories:

```yaml
owns: ["apps/membrane", "apps/router", "apps/contracts"]
```

(`agents/cipher/agent.yaml:9`)

## TELOS

```yaml
callsign: CIPHER
name: "Roman Voss"
role: "Engineering & DevOps"
color: "#39FF14"
substrate: "gptme"
vault: "../../aigency-vault/agents/cipher"
soul: "../../aigency-vault/agents/cipher/SOUL.md"
rules: "../../aigency-vault/agents/cipher/RULES.md"
telos: "../../apps/telos/agents/cipher.md"
```

(`agents/cipher/agent.yaml:1-11`)

## Responsibilities

Per the TELOS app ownership matrix (`apps/telos/README.md:305-314`):

- CLI tooling implementation
- Web UI implementation (Membrane)
- Deployment pipeline
- Smart contract development

## Registry Entry

```typescript
CIPHER: {
  callsign: "CIPHER",
  name: "Roman Voss",
  role: "Engineering & DevOps",
  color: "#39FF14",
  substrate: "gptme"
}
```

(`packages/agent-core/src/index.ts:30`)

## Visual Identity

CIPHER's color `#39FF14` (neon green) is used for engineering nodes in the SynapTree visualization (`packages/design-tokens/src/index.ts:12-15`).

## Source Citations

- Agent registry: `packages/agent-core/src/index.ts:30`
- Agent yaml: `agents/cipher/agent.yaml:1-11`
- TELOS ownership: `apps/telos/README.md:305-314`
