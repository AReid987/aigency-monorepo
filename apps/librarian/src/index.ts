// LIBRARIAN — Ren Nakamura — Knowledge Graph Curator
// Runs on a schedule (via cron / GitHub Actions).
// Workflow: lint → if harvest-ready, notify ORACLE → compile raw/ → flush to SurrealDB

import { join } from "node:path";
import { SurrealClient } from "@aigency/surreal";
import { compile, lint, loadConfig } from "@aigency/vault-tools";

async function main() {
  const vaultRoot = process.env.VAULT_ROOT ?? join(process.cwd(), "../../aigency-vault");
  const config = loadConfig(vaultRoot);
  const result = lint(config);

  if (result.isHarvestReady) {
    // TODO: emit timeline event → ORACLE subscribes via LIVE query → submits to HarvestMoon.sol
    await SurrealClient.connect({
      url: process.env.SURREAL_URL ?? "ws://localhost:8000/rpc",
      namespace: "aigency",
      database: "mem_brain",
      username: process.env.SURREAL_USER ?? "root",
      password: process.env.SURREAL_PASS ?? "root",
    });
    await SurrealClient.db.create("timeline", {
      event_type: "lint_run",
      agent: "LIBRARIAN",
      summary: "Harvest moon conditions met",
      metadata: {
        health_score: result.healthScore,
        wiki_density: result.wikiDensity,
        vault_age_days: result.vaultAgeDays,
      },
      created_at: new Date().toISOString(),
    });
  }
  await compile(config);
}

main().catch(console.error);
