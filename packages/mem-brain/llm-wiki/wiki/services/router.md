# LLM Router

> **Confidence:** 0.95
> **Last confirmed:** 2026-05-03
> **Sources:** `apps/docs/02-deep-dive/apps/router.md`, `apps/router/src/router.ts`, `apps/router/src/server.ts`
> **Supersedes:** N/A
> **Related:** [../architecture/overview.md](../architecture/overview.md), [../agents/registry.md](../agents/registry.md)

---

## Summary

The **LLM Router** (`@aigency/router`) is an OpenAI-compatible HTTP proxy that routes chat completion requests to optimal LLM providers based on request complexity, quota preservation, and rate-limit state. It is the central inference gateway for all Aigency agents.

## Overview

| Property | Value |
|----------|-------|
| Package | `@aigency/router` |
| Port | 8402 |
| Protocol | OpenAI-compatible `/v1/chat/completions` |
| Classification | 8-dimension scoring |
| Fallback | Automatic chain of up to 3 models |

## Request Classification

`classifyRequest()` scores across 8 dimensions:

| Dimension | Points | Trigger |
|-----------|--------|---------|
| Token count | 0-3 | > 500 chars (medium), > 2000 (long) |
| Code presence | 0-2 | Code blocks, inline code |
| Reasoning keywords | 0-3 | analyze, compare, evaluate, step by step... |
| Math/calculation | 0-2 | Equations, formulas, calculate |
| Multi-turn | 0-2 | > 2 messages (1 pt), > 5 (2 pts) |
| Question complexity | 0-2 | how/why/explain + ? |
| Technical domain | 0-2 | algorithm, database, security... |
| Creative task | 0-1 | write, create, generate, draft |

Score maps to tier:
- `score >= 10` → REASONING
- `score >= 6` → COMPLEX
- `score >= 3` → MEDIUM
- else → SIMPLE

## Routing Decision

`routeRequest()` selects the best model using **quota preservation**:
1. Filter out rate-limited models
2. Filter by tier compatibility
3. Sort by: quota size (largest first), then exact tier match
4. Select top model; build fallback chain from next 3 best

Quota ranking: `huge` > `large` > `medium` > `small` > `tiny`

## Rate Limit Tracking

`RateLimitTracker` maintains `modelId → expiryTimestamp`. Cooldown defaults to 60 seconds. On HTTP 429, the model is marked rate-limited and the next fallback is tried.

## Quota Tracking

`QuotaTracker` persists daily/monthly counters to disk:
- Auto-saves every 5 minutes
- Resets daily counters after 24h
- Resets monthly counters after 30 days
- Alerts at 80% (warning) and 95% (critical)

## Server Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Status + provider/model counts |
| `/v1/models` | GET | OpenAI-compatible model list |
| `/v1/chat/completions` | POST | Main routing endpoint |

Request handler flow:
1. Read request body
2. Classify request
3. Route to optimal model
4. Try fallback chain on failure
5. Stream successful response
6. Return 502 if all models fail

## Configuration System

Layered configuration with Zod validation:
1. Load YAML config file (`providers.yaml`)
2. Validate with Zod schemas
3. Apply environment variable overrides (`PROVIDER_*_API_KEY`)
4. Filter out providers missing API keys
5. Return singleton via `getConfig()`

## Default Providers

| Provider | Models | Base URL |
|----------|--------|----------|
| Mistral | `mistral-large-latest`, `mistral-small-latest` | `https://api.mistral.ai/v1` |
| Groq | `llama-3.3-70b-versatile`, `llama-3.1-8b-instant` | `https://api.groq.com/openai/v1` |
| Gemini | `gemini-2.0-flash-exp`, `gemini-1.5-flash`, `gemini-1.5-pro` | `https://generativelanguage.googleapis.com/v1beta` |
| Cerebras | `llama-3.3-70b`, `llama-3.1-8b` | `https://api.cerebras.ai/v1` |
| OpenRouter | `google/gemini-2.0-flash-exp:free`, `meta-llama/llama-3.1-8b-instruct:free` | `https://openrouter.ai/api/v1` |
| VoidAI | `void-1` | `https://api.voidai.com/v1` |
| z.ai | `z-coder` | `https://api.z.ai/v1` |
| Kimi | `moonshot-v1-128k` | `https://api.moonshot.cn/v1` |

## Error Handling

| Status | Retry? |
|--------|--------|
| 429 (Rate Limit) | Yes + mark rate-limited |
| 500+ | Yes |
| 400 (Bad Request) | No |

Timeout: 3 minutes.
