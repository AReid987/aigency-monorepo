// ORACLE — Sable Quinn — Persistent Memory Agent
// Responsibilities:
//   1. Bootstrap SurrealDB schema on startup (idempotent DEFINE statements)
//   2. Seed initial agent records for all 11 agents
//   3. Subscribe to lint_run timeline events → submit metrics to HarvestMoon.sol
//   4. Serve the Honcho workspace for cross-agent peer identity

import { AGENT_REGISTRY } from "@aigency/agent-core";
import { SurrealClient } from "@aigency/surreal";

async function main() {
  console.log("[ORACLE] Initializing...");

  await SurrealClient.connect({
    url: process.env.SURREAL_URL ?? "ws://localhost:8000/rpc",
    namespace: process.env.SURREAL_NS ?? "aigency",
    database: process.env.SURREAL_DB ?? "mem_brain",
    username: process.env.SURREAL_USER ?? "root",
    password: process.env.SURREAL_PASS ?? "root",
  });

  // Bootstrap: ensure all 11 agent records exist
  const db = SurrealClient.db;
  for (const [callsign, identity] of Object.entries(AGENT_REGISTRY)) {
    await db.query(
      `INSERT INTO agent (id, callsign, name, role, color, substrate, status, soul_hash, created_at, updated_at)
       VALUES ($id, $callsign, $name, $role, $color, $substrate, 'standby', 'pending', time::now(), time::now())
       ON DUPLICATE KEY UPDATE updated_at = time::now()`,
      {
        id: `agent:${callsign.toLowerCase()}`,
        callsign,
        name: identity.name,
        role: identity.role,
        color: identity.color,
        substrate: identity.substrate,
      }
    );
  }

  console.log("[ORACLE] Agent records bootstrapped.");
  console.log("[ORACLE] Ready. Listening for lint_run events...");

  // TODO: subscribe to lint_run events → submitMetrics to HarvestMoon.sol
  // LIVE.onEvent("lint_run", async (action, event) => { ... })
}

main().catch(console.error);
