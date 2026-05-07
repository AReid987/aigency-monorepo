# Contracts

> **Confidence:** 0.95
> **Last confirmed:** 2026-05-03
> **Sources:** `apps/docs/02-deep-dive/apps/contracts.md`, `apps/contracts/src/HarvestMoon.sol`
> **Supersedes:** N/A
> **Related:** [../services/librarian.md](../services/librarian.md), [../services/oracle.md](../services/oracle.md)

---

## Summary

Aigency's smart contracts live on **Base L2** (chain ID 8453) and provide on-chain quality gates for the knowledge vault. The primary contract is `HarvestMoon.sol`, which controls when a Crystal Graft (ERC-721 NFT) can be minted based on off-chain vault metrics.

## Overview

| Property | Value |
|----------|-------|
| Package | `@aigency/contracts` |
| Chain | Base L2 (8453) / Base Sepolia (84532) |
| Framework | Foundry |
| Primary Contract | `HarvestMoon.sol` |
| Token Standard | ERC-721 (planned: `AigencyGraft.sol`) |

## HarvestMoon.sol

Quality gate contract. Stores vault metrics submitted by ORACLE and determines whether minting conditions are met.

### State Variables

```solidity
address public immutable architect;
mapping(address => bool) public trustedSubmitters;

uint256 public lintHealthScore;   // 0–100
uint256 public wikiDensity;       // 0.00–1.00 (scaled ×1e4)
uint256 public vaultAgeDays;
uint256 public lastUpdated;
uint256 public lastHarvestAt;
uint256 public graftCount;
```

### Threshold Constants

```solidity
uint256 public constant LINT_THRESHOLD      = 85;    // ≥ 85/100
uint256 public constant DENSITY_THRESHOLD   = 7000;  // ≥ 0.70 (×1e4)
uint256 public constant AGE_THRESHOLD_DAYS  = 90;
uint256 public constant HARVEST_COOLDOWN    = 30 days;
uint256 public constant SUBMIT_TIMELOCK     = 24 hours;
```

These match the default lint thresholds in `@aigency/vault-tools`.

### Key Functions

#### `submitMetrics`

- Only callable by `trustedSubmitters`
- Validates `_lintScore <= 100` and `_wikiDensity <= 10000`
- Updates state and emits `MetricsSubmitted`
- If `isHarvestReady()`, emits `HarvestConditionsMet`

#### `isHarvestReady`

Returns `true` when ALL hold:
1. `lastUpdated != 0`
2. `block.timestamp >= lastUpdated + SUBMIT_TIMELOCK` (24h)
3. `block.timestamp >= lastHarvestAt + HARVEST_COOLDOWN` (30d)
4. `lintHealthScore >= LINT_THRESHOLD` (≥ 85)
5. `wikiDensity >= DENSITY_THRESHOLD` (≥ 7000)
6. `vaultAgeDays >= AGE_THRESHOLD_DAYS` (≥ 90)

#### `harvestGraft`

- Only callable by trusted submitters
- Requires `isHarvestReady()`
- Increments `graftCount`
- Emits `GraftHarvested(graftId, recipient, timestamp)`
- TODO: wire `AigencyGraft.mint()` after NFT deploy

### Events

```solidity
event MetricsSubmitted(uint256 lintScore, uint256 density, uint256 ageDays, uint256 timestamp);
event GraftHarvested(uint256 indexed graftId, address indexed recipient, uint256 timestamp);
event HarvestConditionsMet(uint256 timestamp);
```

### Access Control

- THE_ARCHITECT (deployer) sets trusted submitters via `setTrustedSubmitter`
- ORACLE and LIBRARIAN addresses are trusted submitters
- Trusted submitters can call `submitMetrics` and `harvestGraft`

## Future Contracts

| Contract | Standard | Purpose |
|----------|----------|---------|
| `AigencyGraft.sol` | ERC-721 | Crystal Graft NFT |
| `AigencyGraftAccess.sol` | ERC-20 | Access token for graft holders |

## Build Commands

```bash
pnpm --filter @aigency/contracts build          # forge build
pnpm --filter @aigency/contracts test           # forge test -vvv
pnpm --filter @aigency/contracts deploy:testnet # Base Sepolia
pnpm --filter @aigency/contracts deploy:mainnet # Base Mainnet
```

## On-Chain / Off-Chain Integration

```
LIBRARIAN → vault-tools/lint.ts → LintResult
  → timeline event (lint_run / harvest ready)
    → ORACLE → HarvestMoon.submitMetrics(score, density, age)
      → isHarvestReady()?
        → Yes: emit HarvestConditionsMet → harvestGraft()
```
