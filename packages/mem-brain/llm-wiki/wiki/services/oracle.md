# ORACLE

> **Confidence:** 0.95
> **Last confirmed:** 2026-05-03
> **Sources:** `apps/docs/02-deep-dive/apps/oracle.md`, `apps/oracle/src/index.ts`
> **Supersedes:** N/A
> **Related:** [../architecture/data-layer.md](../architecture/data-layer.md), [../services/librarian.md](../services/librarian.md), [../agents/registry.md](../agents/registry.md)

---

## Summary

**ORACLE** (Sable Quinn) is the persistent memory agent service. It bootstraps SurrealDB schema, seeds agent records, and serves as the bridge between off-chain vault metrics and on-chain `HarvestMoon.sol` quality gates.

## Overview

| Property | Value |
|----------|-------|
| Package | `@aigency/oracle` |
| Role | Persistent Memory Agent |
| Color | `#1A237E` |
| Substrate | Letta/MemGPT |
| Dependencies | `@aigency/agent-core`, `@aigency/mem-brain`, `@aigency/surreal`, `@aigency/honcho`, `@aigency/vault-tools` |

## Responsibilities

1. **Bootstrap SurrealDB** — idempotent agent record insertion on startup
2. **Seed agents** — create all 11 `agent` records from `AGENT_REGISTRY`
3. **Subscribe to events** — listen for `lint_run` timeline events
4. **Honcho workspace** — initialize peer identity layer

## Bootstrap Flow

1. ORACLE starts
2. Connect to SurrealDB (`ws://localhost:8000/rpc` by default)
3. Iterate `AGENT_REGISTRY`
4. `INSERT INTO agent ... ON DUPLICATE KEY UPDATE`
5. Log "Ready"
6. Listen for `lint_run` LIVE queries

## Agent Record Schema

Each agent record follows `AgentRecord` (`packages/surreal/src/types.ts`):

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | `agent:<callsign>` |
| `callsign` | AgentCallsign | Canonical identifier |
| `name` | string | Human-readable name |
| `role` | string | Functional role |
| `color` | string | Hex color for UI |
| `substrate` | string | Runtime engine |
| `status` | enum | active / standby / offline / dreaming |
| `soul_hash` | string | SHA-256 of SOUL.md content |
| `created_at` | datetime | Record creation |
| `updated_at` | datetime | Last update |

## Connection to HarvestMoon

ORACLE is the intended off-chain submitter for `HarvestMoon.sol` metrics:

1. LIBRARIAN runs lint → inserts `lint_run` timeline event
2. ORACLE receives event via LIVE SELECT
3. ORACLE calls `submitMetrics(healthScore, wikiDensity, ageDays)` on HarvestMoon.sol
4. If `isHarvestReady()`, contract emits `HarvestConditionsMet`

This flow is TODO in the current implementation.

## Honcho Integration

- `getPeer("ORACLE")` — get or create Honcho peer record
- `startSession("ORACLE", metadata)` — begin a new session
- `dream("ORACLE", query)` — trigger async background inference

## MemBrain Usage

ORACLE imports `@aigency/mem-brain` for:
- `getActiveDirectives()` — fetch active work items
- `createDirective(data)` — insert new directive
- `searchPatterns(embedding)` — vector similarity search
- `logEvent(type, agent, summary)` — audit logging
- `oracleDream(query)` — Honcho dream wrapper
