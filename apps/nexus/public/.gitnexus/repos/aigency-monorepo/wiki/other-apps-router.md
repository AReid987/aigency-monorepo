# Other — apps/router

# Aigency Router (`apps/router`)

## Overview
The **Router** app (`@aigency/router`) is an OpenAI-compatible HTTP proxy that routes chat-completion requests to the best available LLM provider. It supports quota-aware routing, local SLM fallback, agent-identity context, and automatic retries with a fallback chain.

## Key Files

| File | Responsibility |
|------|----------------|
| `src/server.ts` | HTTP server, `/v1/chat/completions` handler, streaming and non-streaming responses. |
| `src/router.ts` | Request classification, tier selection, model routing, and fallback chain logic. |
| `src/config/index.ts` | Singleton configuration loader with env overrides and API-key filtering. |
| `src/config/loader.ts` | YAML config file loading with environment fallback chain. |
| `src/config/schema.ts` | Zod schemas for providers, models, quotas, and app config. |
| `src/config/validator.ts` | Configuration validation with formatted error reporting. |
| `src/quota-tracker.ts` | Per-provider quota accounting and reset logic. |
| `src/cli.ts` | CLI entrypoint for starting the server. |

## Public Scripts

```bash
pnpm dev            # tsx watch src/server.ts
pnpm build          # tsup src/server.ts src/cli.ts
pnpm start          # node dist/server.js
pnpm test           # jest
pnpm typecheck      # tsc --noEmit
```

## Configuration Flow

1. `initializeConfig({ environment })` loads a YAML config file.
2. `validateConfigOrThrow` validates against the Zod schema.
3. `applyEnvOverrides` merges environment variables.
4. Providers without API keys are filtered out.
5. `getEnabledProviders()` returns the runtime provider list.

## Request Lifecycle

1. `handleChatCompletion` parses the incoming OpenAI-compatible request.
2. `classifyRequest` scores the prompt into a tier (`SIMPLE` → `REASONING`).
3. `routeRequest` selects the best model and fallback chain based on tier, quota, and rate-limit state.
4. `makeProviderRequest` calls the provider; if it fails with a retryable error, the next fallback is attempted.
5. The response is streamed or returned in full.

## Integration Points

* Consumes `@aigency/agent-core` for agent/routing context types.
* Configuration is loaded from `apps/router/config/providers.yaml` and `providers.development.yaml`.
* Used by the separate `aigency-router-v2` workers as a conceptual sibling; this app is the monorepo’s router implementation.
