# @aigency/vault-tools

> Vault compilation, linting, and flush utilities for Aigency Mem_Brain.

## Overview

TypeScript port of the original Python scripts:

- `compile` — raw content → wiki pages with LLM-assisted extraction
- `lint` — vault integrity check
- `flush` — session log → wiki extraction

## Usage

```typescript
import { compile, lint, flush, loadConfig } from "@aigency/vault-tools";

const config = loadConfig("./vault");
const result = await compile(config, "source.md");
```

## Commands

```bash
pnpm test          # run tests
pnpm test:coverage # run tests with coverage
pnpm typecheck     # TypeScript check
pnpm build         # build with tsup
```
