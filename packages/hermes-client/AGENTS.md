# @aigency/hermes-client

> Client SDK for Hermes Agent (Nous Research) HTTP API.

## What It Provides

- **HermesClient** — Typed wrapper for Hermes API endpoints
- Messaging (send/receive across 20 platforms)
- Tools (list, filter by toolset)
- Memory (FTS5 search, store)
- Skills (list, enable/disable)
- Cron (create/list/pause/delete jobs)
- Delegation (spawn subagents)
- Chat (direct prompts)

## Key Types

- `HermesPlatform` — 20 supported platforms (telegram, discord, slack, etc.)
- `HermesCronJob` — Cron job definition
- `HermesMemoryEntry` — Memory search result
- `HermesSkill` — Skill metadata

## Usage

```typescript
import { HermesClient } from "@aigency/hermes-client";

const hermes = new HermesClient({
  baseUrl: "http://galaxy-oracle:8080",
  apiKey: process.env.HERMES_API_KEY,
});

// Send a message
await hermes.sendMessage({
  platform: "telegram",
  target: "@user",
  message: "Auth flow complete. $4.56 spent.",
});

// Search memory
const results = await hermes.searchMemory({ query: "NoteTaker auth" });

// Create a cron job
await hermes.createCronJob({
  name: "daily-review",
  schedule: "0 9 * * *",
  prompt: "Review all active ventures and report status.",
  deliveryPlatform: "telegram",
});
```
