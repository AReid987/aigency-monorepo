// LIBRARIAN — Ren Nakamura — Knowledge Graph Curator
// Runs on a schedule (via cron / GitHub Actions).
// Workflow: lint → if harvest-ready, notify ORACLE → compile raw/ → flush to SurrealDB

import { lint, compile, loadConfig } from "@aigency/vault-tools";
import { SurrealClient } from "@aigency/surreal";
import { join } from "node:path";

async function main() {
  const vaultRoot = process.env.VAULT_ROOT ?? join(process.cwd(), "../../aigency-vault");
  const config = loadConfig(vaultRoot);

  console.log("[LIBRARIAN] Running lint pass...");
  const result = lint(config);

  console.log(`[LIBRARIAN] Health: ${result.healthScore}/100 | Wiki density: ${(result.wikiDensity * 100).toFixed(1)}% | Age: ${result.vaultAgeDays}d`);
  console.log(`[LIBRARIAN] Harvest ready: ${result.isHarvestReady ? "✦ YES" : "no"}`);

  if (result.isHarvestReady) {
    console.log("[LIBRARIAN] ✦ HARVEST MOON CONDITIONS MET — notifying ORACLE");
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

  console.log("[LIBRARIAN] Running compile pass...");
  const compileResult = await compile(config);
  console.log(`[LIBRARIAN] Compile: ${compileResult.compiled} compiled, ${compileResult.skipped} skipped`);
}

main().catch(console.error);
