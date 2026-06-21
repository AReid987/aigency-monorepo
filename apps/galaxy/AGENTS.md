# @aigency/galaxy

> Galaxy orchestrator — bridges Hermes (VPS CEO) and OMP (MacBook CTO) for venture lifecycle management.

## Architecture

```
User (Telegram/Discord)
  ↓
Hermes (VPS) — always-on orchestrator, 70+ tools, cron, memory
  ↓ SSH + JSONL
OMP (MacBook) — coding engine, LSP/DAP, gstack/PAUL/CARL skills
  ↓ results
Hermes → User
```

## Key Classes

- **GalaxyOrchestrator** — Core bridge: venture management, task delegation, result reporting
- **GalaxyConfig** — Zod-validated config from env vars
- **createGalaxy()** — Factory that wires Hermes + OMP + Orchestrator

## CLI

```bash
galaxy status              # Check connectivity
galaxy venture list        # List ventures
galaxy venture create <id> <name>
galaxy task <venture-id> <task>
galaxy chat <message>      # Direct to OMP
```

## Environment

See `.env.example` for all configuration options.

## Relationship to Aigency Executives

Galaxy runs parallel to the 10-executive system. It's used:
1. To help build the executive system itself (OMP as CTO)
2. As a complementary orchestrator for venture-specific work
3. As the bridge between always-on services (VPS) and local coding (MacBook)
