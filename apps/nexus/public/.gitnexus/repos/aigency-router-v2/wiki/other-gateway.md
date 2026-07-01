# Gateway — Package & Tests

## Overview
This module groups the **Gateway Worker** package metadata and its comprehensive test suite. The runtime source is documented under [Gateway Worker](gateway-worker.md); this page covers the package configuration and tests.

## File Overview

| File | Purpose |
|------|---------|
| `workers/gateway/package.json` | Package manifest for `@aigency/gateway`. |
| `workers/gateway/tsconfig.json` | TypeScript configuration extending the workspace root. |
| `workers/gateway/src/index.test.ts` | Tests for `routeLlm` wiring and `createGatewayWorker`. |
| `workers/gateway/src/http-handler.test.ts` | Tests for the OpenAI-compatible HTTP handler and SSE streaming. |
| `workers/gateway/src/provider-client.test.ts` | Tests for provider parsing, config lookup, and request construction. |
| `workers/gateway/src/failover.test.ts` | Tests for the `FailoverEngine` cooldown and retry logic. |
| `workers/gateway/src/streaming.test.ts` | Tests for streaming token delivery via III channels. |
| `workers/gateway/src/e2e.test.ts` | End-to-end test of the full routing pipeline with mocked dependencies. |

## Package Configuration (`package.json`)
- **Name**: `@aigency/gateway`
- **Runtime**: Node.js with `tsx` for TypeScript execution.
- **Dependencies**
  - `iii-sdk` – III engine SDK.
- **Scripts**
  - `dev` – run the worker with `tsx src/index.ts`.
  - `test` – run `index.test.ts`, `provider-client.test.ts`, `failover.test.ts`, and `streaming.test.ts` with `node --test`.

## Test Suite Highlights

### `provider-client.test.ts`
- `parseProviderModel` splits `provider/model` strings and handles missing slashes.
- `getProviderConfig` returns base URLs and env-var names for `groq`, `cerebras`, and `together`.
- `callProvider` builds correct headers, bodies, and handles streaming vs non-streaming responses.

### `failover.test.ts`
- `FailoverEngine` tries providers in order.
- Cooldowns are applied for `429` (60s), `403` (5min), and `500/503` (30s).
- `401` does not trigger cooldown because it indicates an invalid key.

### `streaming.test.ts`
- Streaming requests create an III channel and deliver SSE chunks.
- Mid-stream errors send an error chunk before closing the channel.
- Non-streaming requests return full content without a channel.

### `http-handler.test.ts`
- Validates the `/v1/chat/completions` endpoint shape.
- Verifies SSE headers and chunk encoding.
- Tests client disconnect handling.

### `e2e.test.ts`
- Mocks the full chain: HTTP request → brain classify → translator resolve → vault retrieve → provider call → SSE/JSON response.
- Ensures the gateway orchestrates all dependencies without real network calls.

## Running the Tests
```bash
pnpm --filter @aigency/gateway test
```

## Integration Points
- **Gateway Worker runtime**: see [Gateway Worker](gateway-worker.md).
- **Translator Worker**: mocked via `translator::resolve` in integration tests.
- **Vault Worker**: mocked via `vault::retrieve` in integration tests.
- **Brain Worker**: mocked via `brain::classify` for telemetry tests.
