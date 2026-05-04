# Vault Tools

`@aigency/vault-tools` provides lint, compile, and flush utilities for the Aigency knowledge vault. It is a TypeScript port of the original Python scripts from `aigency-vault/scripts/`.

## Overview

| Property | Value |
|----------|-------|
| Package | `@aigency/vault-tools` |
| Binaries | `vault-lint`, `vault-compile`, `vault-flush` |
| Purpose | Vault health scoring, wiki compilation, timeline syncing |

## Exports

```typescript
export { compile } from "./compile.js";
export { lint, type LintResult } from "./lint.js";
export { flush } from "./flush.js";
export type { VaultConfig } from "./config.js";
```

(`packages/vault-tools/src/index.ts:1-7`)

## Lint

Computes a vault health score and wiki density for the HarvestMoon.sol oracle feed (`packages/vault-tools/src/lint.ts:28-93`).

### LintResult

```typescript
export interface LintResult {
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

(`packages/vault-tools/src/lint.ts:8-20`)

### Health Score Algorithm

Starting from 100:

| Issue | Deduction |
|-------|-----------|
| Missing `SOUL.md` | -5 per agent |
| Missing `RULES.md` | -5 per agent |
| Raw files exist but no wiki | -3 per agent |
| Wiki density < 0.5 | -20 |
| Wiki density < 0.7 | -10 |

(`packages/vault-tools/src/lint.ts:62-68`)

### Wiki Density

```typescript
const wikiDensity = totalRaw > 0 ? Math.min(totalWiki / totalRaw, 1.0) : 0;
```

Ratio of compiled wiki files to raw session notes. Capped at 1.0 (`packages/vault-tools/src/lint.ts:59`).

### Vault Age

```typescript
const genesis = new Date("2026-04-07");
const vaultAgeDays = Math.floor((Date.now() - genesis.getTime()) / 86400000);
```

(`packages/vault-tools/src/lint.ts:71-72`)

### Harvest Readiness

```typescript
const isHarvestReady =
  healthScore >= t.minHealthScore &&      // 85
  wikiDensity >= t.minWikiDensity &&       // 0.70
  vaultAgeDays >= t.minVaultAgeDays;       // 90
```

(`packages/vault-tools/src/lint.ts:75-78`)

These match the on-chain constants in `HarvestMoon.sol` (`apps/contracts/src/HarvestMoon.sol:24-28`).

## Compile

Transforms raw session notes into polished wiki articles using an LLM (`packages/vault-tools/src/compile.ts:54-87`).

### Workflow

1. Read `agents/<callsign>/raw/*.md` and `_global/raw/*.md`
2. Skip if compiled wiki already exists
3. Send raw content to LLM
4. Write result to `wiki/*.md`

### LLM Backends

| Backend | Endpoint |
|---------|----------|
| `mlx` / `llama_cpp` | `http://localhost:8080/v1/chat/completions` |
| `claude` | Anthropic API |
| `openai` | OpenAI API |

(`packages/vault-tools/src/compile.ts:17-52`)

### System Prompt

```
You are the LIBRARIAN (Ren Nakamura), knowledge graph curator for Aigency.
Your task: transform a raw session note into a polished wiki article.
- Extract key decisions, patterns, and insights
- Write in clear, direct prose — no fluff
- Preserve all technical specifics
- Format with ## headers, no bullet dumps
- Output markdown only
```

(`packages/vault-tools/src/compile.ts:9-15`)

## Flush

Syncs session logs to SurrealDB's `timeline` table. Currently a placeholder:

```typescript
export async function flush(config: VaultConfig): Promise<{ flushed: number }> {
  console.warn("[flush] Not yet implemented — requires @aigency/surreal");
  return { flushed: 0 };
}
```

(`packages/vault-tools/src/flush.ts:7-15`)

Planned implementation:
1. Walk `agents/<callsign>/session-logs/*.md`
2. Parse frontmatter for `event_type`, `agent`, `summary`, `metadata`
3. INSERT INTO timeline with deduplication on file hash

## Configuration

```typescript
export interface VaultConfig {
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

(`packages/vault-tools/src/config.ts:4-15`)

Default config loads from `<vaultRoot>/config/vault.json` or falls back to built-in defaults (`packages/vault-tools/src/config.ts:27-33`).

## Binaries

```json
{
  "bin": {
    "vault-compile": "./dist/bin/compile.js",
    "vault-lint": "./dist/bin/lint.js",
    "vault-flush": "./dist/bin/flush.js"
  }
}
```

(`packages/vault-tools/package.json:16-20`)

## Source Citations

- Lint implementation: `packages/vault-tools/src/lint.ts:1-93`
- Compile implementation: `packages/vault-tools/src/compile.ts:1-87`
- Flush placeholder: `packages/vault-tools/src/flush.ts:1-15`
- Configuration: `packages/vault-tools/src/config.ts:1-33`
- Package config: `packages/vault-tools/package.json:1-39`
