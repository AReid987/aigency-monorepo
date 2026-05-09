# @aigency/surreal

> SurrealDB 3.0 client, schema utilities, and LIVE query helpers for Aigency.

## Overview

Thin wrapper around the SurrealDB JavaScript SDK with:

- Singleton connection manager (`SurrealClient`)
- LIVE query subscription helpers (`LIVE.subscribe`, `LIVE.onEvent`, `LIVE.onAgentStatus`)
- Type-safe record definitions for ORACLE + LLM-Wiki v2 + agent memory

## Usage

```typescript
import { SurrealClient } from "@aigency/surreal";

const db = await SurrealClient.connect({
  url: "ws://localhost:8000/rpc",
  namespace: "aigency",
  database: "mem_brain",
  username: "root",
  password: "root",
});

// Use the singleton db reference
const records = await SurrealClient.db.query("SELECT * FROM agent");
```

## Commands

```bash
pnpm test          # run tests
pnpm test:coverage # run tests with coverage
pnpm typecheck     # TypeScript check
pnpm build         # build with tsup
```
