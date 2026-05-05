# NEXUS Trading Intelligence Network

> **Confidence:** 0.9 (single source, not yet reinforced by activity)  
> **Last confirmed:** 2026-05-03  
> **Sources:** `raw/aigency-specs/org-agents.md`  
> **Related:** [../architecture/integrations.md](../architecture/integrations.md) (Discord, Telegram)

---

## Mission

The NEXUS Trading Intelligence Network monitors Solana meme coins and alpha signals across multiple social platforms. It scores signals, simulates trades, and evaluates strategies to generate actionable trading intelligence.

---

## Squad Members

| Agent | Role |
|-------|------|
| Meme Coin Intel Orchestrator | Master orchestrator for trading signals |
| Solana On-Chain Scanner | Real-time token monitoring |
| Alpha Signal Scorer | Signal scoring and tier classification |
| NEXUS Paper Trader | Simulated trade execution |
| NEXUS Strategy Evaluator | Performance analysis |
| NEXUS Market Regime Agent | Market regime classification |
| Discord Solana Alpha Monitor | Discord signal monitoring |
| Telegram Alpha Scout | Telegram signal monitoring |
| Reddit Solana Meme Scout | Reddit signal monitoring |
| Solana Social Scout | Twitter/X signal monitoring |

---

## Data Sources

| Source | Platform | Agent |
|--------|----------|-------|
| Discord alpha channels | Discord | Discord Solana Alpha Monitor |
| Telegram alpha groups | Telegram | Telegram Alpha Scout |
| Reddit meme coin subs | Reddit | Reddit Solana Meme Scout |
| Twitter/X crypto accounts | Twitter/X | Solana Social Scout |
| Solana blockchain | On-chain | Solana On-Chain Scanner |

---

## Signal Pipeline

```
Social monitors  -->  Raw signals
On-chain scanner  -->  Token metrics
        |
        v
Alpha Signal Scorer  -->  Tier classification (A/B/C)
        |
        v
Meme Coin Intel Orchestrator  -->  Consolidated intel
        |
        v
NEXUS Paper Trader  -->  Simulated execution
        |
        v
NEXUS Strategy Evaluator  -->  Performance report
```

---

## Alert Channels

- **Telegram:** Primary alerts to @ReidTheArchitect
- **Discord:** Community signal sharing
- **Internal:** Strategy reports logged to wiki

---

## Related Pages

- [../architecture/integrations.md](../architecture/integrations.md) — Discord and Telegram integration details
- [meta-code-squad.md](./meta-code-squad.md) — May build infrastructure for NEXUS
