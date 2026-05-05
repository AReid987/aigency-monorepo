# Integrations — Aigency Platform

> **Confidence:** 1.0 (canonical source)  
> **Last confirmed:** 2026-05-03  
> **Sources:** `raw/aigency-specs/integrations-spec.md`  
> **Related:** [../org/agent-network.md](../org/agent-network.md), [memory-tiers.md](./memory-tiers.md)

---

## Overview

The Aigency platform integrates with external services across four categories. All integrations follow a consistent pattern:
- OAuth connections managed by Nebula AI
- API calls proxy through SimpleLLMRouter where applicable
- Credentials stored as environment variables, never hardcoded
- Agents never call provider APIs directly

---

## 1. AI / LLM Provider Integrations

All LLM calls route through SimpleLLMRouter v2 at `http://localhost:8080`.

| Provider | Models | Usage | Auth |
|----------|--------|-------|------|
| Anthropic | claude-3-5-sonnet, claude-3-opus | Complex logic, state machines | API key via env |
| Google Gemini | gemini-2.5-pro | Architecture, large-context synthesis | API key via env |
| Moonshot Kimi | kimi-latest | Active coding, code review sweeps | API key via env |
| OpenAI | gpt-4o, gpt-4o-mini | Overflow routing, embeddings | API key via env |
| Qwen / Roo | qwen-coder | Quota overflow buffer | API key via env |
| Letta | Internal | Stateful memory agent at :8283 | Local server |

### Routing Rules

```
Complex logic / security / state machines  -->  Anthropic (Claude)
Architecture / planning / synthesis        -->  Google Gemini 2.5 Pro
Active coding / multi-step execution       -->  Moonshot Kimi
Quota overflow                             -->  Qwen / Roo / iFlow
Embeddings / fast lookups                  -->  OpenAI
```

---

## 2. Developer Tooling

### GitHub

| Property | Value |
|----------|-------|
| Account | AReid987 |
| Auth | OAuth (connected via Nebula) |
| Usage | Source control, CI/CD, issue tracking, PR reviews |
| Agent | github-agent (Nebula) |

**Workflows:**
- All code changes via PR — no direct pushes to main
- CI runs on every PR: lint, typecheck, CodeQL security scan
- Dependabot monitors dependency updates
- Kimi Code CLI performs pre-merge code review sweeps

### Linear

| Property | Value |
|----------|-------|
| Account | read.musik@gmail.com |
| Auth | OAuth (connected via Nebula) |
| Usage | Sprint tracking, backlog management |
| Agent | linear-oauth-agent (Nebula) |

### Notion

| Property | Value |
|----------|-------|
| Account | read.musik@gmail.com |
| Auth | OAuth (connected via Nebula) |
| Usage | Strategy docs, OKRs, long-form documentation |
| Agent | notion-agent (Nebula) |

---

## 3. Communication

### Telegram

| Property | Value |
|----------|-------|
| Handle | @ReidTheArchitect |
| Auth | Bot token via env |
| Usage | Primary async interface between Antonio and AI agents |
| Agent | telegram-agent (Nebula) |

**Patterns:**
- Agent blockers -> Telegram message to @ReidTheArchitect
- NEXUS trading alerts -> Telegram notifications
- Sprint status updates -> Telegram digest

### Discord

| Property | Value |
|----------|-------|
| Server | Aigency |
| Auth | Bot token via env |
| Usage | Community communication, alpha signal monitoring |
| Agent | discord-solana-alpha-monitor (NEXUS) |

### Gmail

| Property | Value |
|----------|-------|
| Account | read.musik@gmail.com |
| Auth | OAuth (connected via Nebula) |
| Usage | External communications, verification emails |
| Agent | gmail-agent (Nebula) |

---

## 4. Data & Infrastructure

### Supabase

| Property | Value |
|----------|-------|
| Account | Aigency |
| Auth | Management API OAuth |
| Usage | Primary database for all Aigency platform products |

**Conventions:**
- Row-level security (RLS) enabled on all tables
- All migrations version-controlled in repo
- No direct DB access from agent code — always via API layer

### Google Workspace

| Service | Usage |
|---------|-------|
| Google Docs | Collaborative documentation |
| Google Sheets | Data tracking and metrics |
| Google Drive | File storage and sharing |

---

## Integration Patterns

1. **Never direct API calls** — Always route through SimpleLLMRouter or dedicated agent
2. **Environment variables only** — No credentials in code
3. **OAuth via Nebula** — Nebula AI manages all OAuth flows
4. **Audit all integrations** — Every external call logged

---

## Related Pages

- [../org/agent-network.md](../org/agent-network.md) — Which agents use which integrations
- [memory-tiers.md](./memory-tiers.md) — Letta/SimpleLLMRouter integration for memory
- [../squads/nexus-trading.md](../squads/nexus-trading.md) — Discord/Telegram integration for trading alerts
