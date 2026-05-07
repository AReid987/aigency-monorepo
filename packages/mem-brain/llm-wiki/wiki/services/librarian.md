# LIBRARIAN

> **Confidence:** 0.95
> **Last confirmed:** 2026-05-03
> **Sources:** `apps/docs/02-deep-dive/apps/librarian.md`, `packages/vault-tools/src/lint.ts`, `packages/vault-tools/src/compile.ts`
> **Supersedes:** N/A
> **Related:** [../services/oracle.md](../services/oracle.md), [../services/contracts.md](../services/contracts.md), [../architecture/overview.md](../architecture/overview.md)

---

## Summary

**LIBRARIAN** (Ren Nakamura) is the knowledge graph curator service. It runs on a schedule to lint the vault, compile raw session notes into wiki articles, and notify ORACLE when Harvest Moon conditions are met.

## Overview

| Property | Value |
|----------|-------|
| Package | `@aigency/librarian` |
| Role | Knowledge Graph Curator |
| Color | `#FF6D00` |
| Substrate | ZeroClaw |
| Workflow | lint → harvest-check → compile → flush |

## Workflow

```
Librarian starts
  → lint pass
    → isHarvestReady?
      → Yes: Notify ORACLE (timeline event)
      → No: Skip harvest
    → compile pass
      → flush pass (placeholder)
        → Exit
```

## Lint Pass

Delegated to `@aigency/vault-tools` (`packages/vault-tools/src/lint.ts`).

### LintResult

```typescript
interface LintResult {
  healthScore: number;      // 0–100
  wikiDensity: number;      // 0.0–1.0
  vaultAgeDays: number;
  isHarvestReady: boolean;
  breakdown: {
    totalRawFiles: number;
    totalWikiFiles: number;
    staleSoulFiles: string[];
    missingRulesFiles: string[];
    agentsWithoutWiki: string[];
  };
}
```

### Health Score Calculation

Starting from 100, deductions apply:

| Issue | Deduction |
|-------|-----------|
| Missing SOUL.md | -5 per agent |
| Missing RULES.md | -5 per agent |
| Agent has raw but no wiki | -3 per agent |
| Wiki density < 0.5 | -20 |
| Wiki density < 0.7 | -10 |

### Harvest Thresholds

```typescript
const isHarvestReady =
  healthScore >= 85 &&      // minHealthScore
  wikiDensity >= 0.70 &&     // minWikiDensity
  vaultAgeDays >= 90;        // minVaultAgeDays
```

These match the on-chain constants in `HarvestMoon.sol`.

## Compile Pass

Transforms raw session notes into polished wiki articles using an LLM (`packages/vault-tools/src/compile.ts`):

1. Read `agents/<callsign>/raw/*.md` and `_global/raw/*.md`
2. Skip files that already have a compiled wiki counterpart
3. Send raw content to LLM with system prompt
4. Write result to `wiki/*.md`

### LLM Backends

| Backend | Endpoint | Use Case |
|---------|----------|----------|
| `mlx` / `llama_cpp` | `http://localhost:8080/v1/chat/completions` | Local inference |
| `claude` | Anthropic API | Heavy compilation tasks |
| `openai` | OpenAI API | Cloud fallback |

### System Prompt

> You are the LIBRARIAN (Ren Nakamura), knowledge graph curator for Aigency. Your task: transform a raw session note into a polished wiki article. Extract key decisions, patterns, and insights. Write in clear, direct prose — no fluff. Preserve all technical specifics. Format with ## headers, no bullet dumps. Output markdown only.

## Flush Pass

Syncs session logs to SurrealDB's `timeline` table. Currently a placeholder:
```typescript
export async function flush(config: VaultConfig): Promise<{ flushed: number }> {
  console.warn("[flush] Not yet implemented — requires @aigency/surreal");
  return { flushed: 0 };
}
```

## Vault Configuration

```typescript
interface VaultConfig {
  vaultRoot: string;
  llmBackend: "mlx" | "llama_cpp" | "claude" | "openai";
  mlxEndpoint?: string;
  tailnetNodes?: string[];
  compilationModel?: string;
  lintThresholds: {
    minHealthScore: number;   // 85
    minWikiDensity: number;   // 0.70
    minVaultAgeDays: number;  // 90
  };
}
```

Default config loads from `<vaultRoot>/config/vault.json`.
