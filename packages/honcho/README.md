# @aigency/honcho

> Honcho peer/identity client for Aigency agents.

## Overview

Wraps the Honcho AI SDK to provide:

- Peer identity management (one peer per agent callsign)
- Session lifecycle (start, add messages)
- Background inference ("dreaming")

## Usage

```typescript
import { HonchoClient } from "@aigency/honcho";

const honcho = new HonchoClient({
  apiKey: "...",
  workspaceId: "aigency-dev",
});

const peer = await honcho.getPeer("atlas");
const session = await honcho.startSession("atlas", { mission: "mapping" });
await honcho.addMessage("atlas", session.id, "Hello", false);
```

## Commands

```bash
pnpm test          # run tests
pnpm test:coverage # run tests with coverage
pnpm typecheck     # TypeScript check
pnpm build         # build with tsup
```
