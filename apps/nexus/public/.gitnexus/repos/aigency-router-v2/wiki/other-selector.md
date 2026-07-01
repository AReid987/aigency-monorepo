# Selector — Package & Tests

## Overview
This module groups the **Selector Worker** package metadata and its unit tests. The runtime source is documented under [Selector Worker](selector-worker.md); this page covers the package configuration and test suite.

## File Overview

| File | Purpose |
|------|---------|
| `workers/selector/package.json` | Package manifest for `@aigency/selector`. |
| `workers/selector/src/index.test.ts` | Unit tests for the Selector III worker registration and `selector::classify`. |

## Package Configuration (`package.json`)
- **Name**: `@aigency/selector`
- **Runtime**: Node.js with TypeScript via `--experimental-strip-types` and `--experimental-transform-types`.
- **Dependencies**
  - `iii-sdk` – III engine SDK.
  - `ollama` – optional small language model client.
- **Scripts**
  - `dev` – run the worker with `node --experimental-strip-types src/index.ts`.
  - `test` – run `index.test.ts` with Node's built-in test runner and module mocks.

## Test Suite (`src/index.test.ts`)
The tests use Node's native `node:test` runner with module mocks for `iii-sdk`, `selector-factory`, `slm-selector`, and `telemetry`.

### Covered behavior
- `classify` with `HeuristicSelector` returns `source: 'heuristic'` and includes `classification`, `confidence`, `model`, and `latencyMs`.
- `classify` with `SLMSelector` returns `source: 'slm'`.
- `status` returns a healthy payload with `slmAvailable` and `model` fields.
- Payload shape validation for optional fields (`enforce_json`, `max_tokens`).

### Running the tests
```bash
pnpm --filter @aigency/selector test
```

## Integration Points
- **Selector Worker runtime**: see [Selector Worker](selector-worker.md).
- **Shared modules**: tests mock `workers/shared/selector-factory.ts`, `slm-selector.ts`, and `telemetry.ts`.
