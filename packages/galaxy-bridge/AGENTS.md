# @aigency/galaxy-bridge

> Reusable library for OMP RPC protocol communication.

## What It Provides

- **OmpRpcClient** — JSONL-framed RPC client for OMP's `--mode rpc`
- **SshOmpTransport** — SSH transport that connects to a remote MacBook
- **LocalOmpTransport** — Local process transport for same-machine testing
- **TaskDelegator** — High-level task delegation with skill injection, event collection, timeout enforcement

## Key Types

- `OmpRpcCommand` — All inbound command types (prompt, abort, set_model, set_todos, etc.)
- `OmpRpcFrame` — All outbound frame types (ready, response, agent events, subagent events)
- `TaskResult` — Aggregated result from a delegated task

## Usage

```typescript
import { SshOmpTransport, OmpRpcClient, TaskDelegator } from "@aigency/galaxy-bridge";

const transport = new SshOmpTransport({ host: "macbook-pro" });
transport.connect();

const client = new OmpRpcClient({ transport });
await client.waitForReady();

const delegator = new TaskDelegator(client);
const result = await delegator.delegate({
  task: "implement auth flow",
  ventureId: "notetaker-2026-001",
  skills: ["gstack", "paul", "carl"],
});
```

## Architecture

```
OmpRpcClient  ←→  OmpRpcTransport (SshOmpTransport | LocalOmpTransport)
     ↑
TaskDelegator  ←  high-level delegation with prompt construction
```
