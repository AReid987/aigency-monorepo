// vault-tools/lint.ts — port of lint.py
// Computes lint health score and wiki density for HarvestMoon.sol oracle feed.

import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { VaultConfig } from "./config.js";

export interface LintResult {
  healthScore: number; // 0–100
  wikiDensity: number; // 0.0–1.0
  vaultAgeDays: number;
  isHarvestReady: boolean;
  breakdown: {
    totalRawFiles: number;
    totalWikiFiles: number;
    staleSoulFiles: string[];
    missingRulesFiles: string[];
    agentsWithoutWiki: string[];
  };
}

function countMarkdownFiles(dir: string): number {
  if (!existsSync(dir)) {
    return 0;
  }
  return readdirSync(dir, { recursive: true }).filter(
    (f) => typeof f === "string" && f.endsWith(".md")
  ).length;
}

export function lint(config: VaultConfig): LintResult {
  const agentsDir = join(config.vaultRoot, "agents");
  const agents = existsSync(agentsDir)
    ? readdirSync(agentsDir).filter((d) => statSync(join(agentsDir, d)).isDirectory())
    : [];

  let totalRaw = 0;
  let totalWiki = 0;
  const staleSoul: string[] = [];
  const missingRules: string[] = [];
  const noWiki: string[] = [];

  for (const agent of agents) {
    const agentDir = join(agentsDir, agent);
    const rawCount = countMarkdownFiles(join(agentDir, "raw"));
    const wikiCount = countMarkdownFiles(join(agentDir, "wiki"));
    totalRaw += rawCount;
    totalWiki += wikiCount;

    if (!existsSync(join(agentDir, "SOUL.md"))) {
      staleSoul.push(agent);
    }
    if (!existsSync(join(agentDir, "RULES.md"))) {
      missingRules.push(agent);
    }
    if (wikiCount === 0 && rawCount > 0) {
      noWiki.push(agent);
    }
  }

  const globalRaw = countMarkdownFiles(join(config.vaultRoot, "_global", "raw"));
  const globalWiki = countMarkdownFiles(join(config.vaultRoot, "_global", "wiki"));
  totalRaw += globalRaw;
  totalWiki += globalWiki;

  const wikiDensity = totalRaw > 0 ? Math.min(totalWiki / totalRaw, 1.0) : 0;

  // Health score: starts at 100, deductions for issues
  let healthScore = 100;
  healthScore -= staleSoul.length * 5;
  healthScore -= missingRules.length * 5;
  healthScore -= noWiki.length * 3;
  if (wikiDensity < 0.5) {
    healthScore -= 20;
  } else if (wikiDensity < 0.7) {
    healthScore -= 10;
  }
  healthScore = Math.max(0, Math.min(100, healthScore));

  // Vault age from genesis date
  const genesis = new Date("2026-04-07");
  const vaultAgeDays = Math.floor((Date.now() - genesis.getTime()) / 86400000);

  const { lintThresholds: t } = config;
  const isHarvestReady =
    healthScore >= t.minHealthScore &&
    wikiDensity >= t.minWikiDensity &&
    vaultAgeDays >= t.minVaultAgeDays;

  return {
    healthScore,
    wikiDensity,
    vaultAgeDays,
    isHarvestReady,
    breakdown: {
      totalRawFiles: totalRaw,
      totalWikiFiles: totalWiki,
      staleSoulFiles: staleSoul,
      missingRulesFiles: missingRules,
      agentsWithoutWiki: noWiki,
    },
  };
}
