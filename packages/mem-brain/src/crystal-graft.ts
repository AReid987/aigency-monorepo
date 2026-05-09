// CrystalGraft — Cryptographically-signed, portable knowledge graph snapshots
// The viral knowledge-sharing primitive of the Aigency ecosystem.
// Ports: Aigency Core Mem_Brain v1 Crystal Graft concept to the monorepo.

import { SurrealClient } from "@aigency/surreal";
import type { WikiChunkRecord, WikiLinkRecord, WikiPageRecord } from "@aigency/surreal";

export interface GraftMetrics {
  lintHealthScore: number; // 0-100
  wikiDensity: number; // ratio of wiki files to raw files
  vaultAgeDays: number;
  totalPages: number;
  totalLinks: number;
  avgConfidence: number;
  orphanCount: number;
  staleCount: number;
}

export interface GraftManifest {
  version: string;
  vaultGenesis: string; // ISO date
  harvestDate: string;
  metrics: GraftMetrics;
  librarianHash: string; // SHA-256 of lint report
  sourceSnapshot: string; // SurrealDB export CID
  includedAgents: string[];
  excludedPrefixes: string[];
}

export interface HarvestThresholds {
  minLintHealthScore: number;
  minWikiDensity: number;
  minVaultAgeDays: number;
}

export const DEFAULT_THRESHOLDS: HarvestThresholds = {
  minLintHealthScore: 85,
  minWikiDensity: 0.7,
  minVaultAgeDays: 90,
};

export class CrystalGraft {
  constructor(
    private thresholds: HarvestThresholds = DEFAULT_THRESHOLDS,
    private db = SurrealClient.db
  ) {}

  // ─── Harvest Readiness ───────────────────────────────────────────────────────

  async checkReadiness(): Promise<{
    ready: boolean;
    metrics: GraftMetrics;
    failures: string[];
  }> {
    const metrics = await this.calculateMetrics();
    const failures: string[] = [];

    if (metrics.lintHealthScore < this.thresholds.minLintHealthScore) {
      failures.push(
        `Lint health score ${metrics.lintHealthScore.toFixed(1)} below threshold ${this.thresholds.minLintHealthScore}`
      );
    }
    if (metrics.wikiDensity < this.thresholds.minWikiDensity) {
      failures.push(
        `Wiki density ${metrics.wikiDensity.toFixed(2)} below threshold ${this.thresholds.minWikiDensity}`
      );
    }
    if (metrics.vaultAgeDays < this.thresholds.minVaultAgeDays) {
      failures.push(
        `Vault age ${metrics.vaultAgeDays} days below threshold ${this.thresholds.minVaultAgeDays}`
      );
    }

    return {
      ready: failures.length === 0,
      metrics,
      failures,
    };
  }

  // ─── Metrics Calculation ─────────────────────────────────────────────────────

  async calculateMetrics(): Promise<GraftMetrics> {
    const [pageStats] = await this.db.query<
      [{ count: number; avgConfidence: number; oldest: string }[]]
    >(
      `SELECT
        count() AS count,
        math::mean(confidence) AS avgConfidence,
        min(created_at) AS oldest
       FROM wiki_page
       WHERE status = 'active'`
    );

    const stats = pageStats?.[0] ?? {
      count: 0,
      avgConfidence: 0,
      oldest: new Date().toISOString(),
    };

    const [[linkCount]] = await this.db.query<[[{ count: number }]]>(
      "SELECT count() AS count FROM wiki_link"
    );

    const [[orphanCount]] = await this.db.query<[[{ count: number }]]>(
      `SELECT count() AS count FROM wiki_page WHERE status = 'active'
       AND id NOT IN (SELECT to_page_id FROM wiki_link)`
    );

    const [[staleCount]] = await this.db.query<[[{ count: number }]]>(
      `SELECT count() AS count FROM wiki_page
       WHERE status = 'active'
       AND (last_confirmed ?? updated_at) < (time::now() - 30d)`
    );

    const totalPages = stats.count ?? 0;
    const totalLinks = linkCount?.count ?? 0;
    const orphanCountVal = orphanCount?.count ?? 0;
    const staleCountVal = staleCount?.count ?? 0;

    // Calculate lint health score
    const issueCount = orphanCountVal + staleCountVal;
    const lintHealthScore =
      totalPages > 0 ? Math.max(0, 100 - (issueCount / totalPages) * 100) : 100;

    // Calculate wiki density (wiki pages / total knowledge items)
    const [[chunkCount]] = await this.db.query<[[{ count: number }]]>(
      "SELECT count() AS count FROM wiki_chunk"
    );
    const totalItems = totalPages + (chunkCount?.count ?? 0);
    const wikiDensity = totalItems > 0 ? totalPages / totalItems : 0;

    // Calculate vault age
    const oldestDate = new Date(stats.oldest ?? new Date());
    const vaultAgeDays = Math.floor((Date.now() - oldestDate.getTime()) / (24 * 60 * 60 * 1000));

    return {
      lintHealthScore,
      wikiDensity,
      vaultAgeDays,
      totalPages,
      totalLinks,
      avgConfidence: stats.avgConfidence ?? 0,
      orphanCount: orphanCountVal,
      staleCount: staleCountVal,
    };
  }

  // ─── Graft Generation ────────────────────────────────────────────────────────

  async generateGraft(
    options: {
      includeAgents?: string[];
      excludePrefixes?: string[];
      version?: string;
    } = {}
  ): Promise<GraftManifest | null> {
    const readiness = await this.checkReadiness();
    if (!readiness.ready) {
      return null;
    }

    const { metrics } = readiness;
    const now = new Date().toISOString();

    // Get vault genesis date
    const [[genesis]] = await this.db.query<[[{ oldest: string }]]>(
      "SELECT min(created_at) AS oldest FROM wiki_page"
    );

    // Calculate librarian hash (SHA-256 of lint report)
    const lintReport = JSON.stringify(readiness.failures);
    const librarianHash = await this.sha256(lintReport);

    // Build manifest
    const manifest: GraftManifest = {
      version: options.version ?? "1.0.0",
      vaultGenesis: genesis?.oldest ?? now,
      harvestDate: now,
      metrics,
      librarianHash,
      sourceSnapshot: "pending-export", // Would be IPFS CID in production
      includedAgents: options.includeAgents ?? [],
      excludedPrefixes: options.excludePrefixes ?? ["test/", "archive/", ".raw/"],
    };

    // Log harvest event
    await this.db.create("timeline", {
      event_type: "graft_harvested",
      agent: "ORACLE",
      summary: `Crystal Graft harvested: v${manifest.version}, health ${metrics.lintHealthScore.toFixed(1)}`,
      metadata: {
        manifest,
        thresholds: this.thresholds,
      },
      created_at: now,
    } as Record<string, unknown>);

    return manifest;
  }

  // ─── Graft Export ────────────────────────────────────────────────────────────

  async exportSnapshot(): Promise<{
    pages: WikiPageRecord[];
    links: WikiLinkRecord[];
    chunks: WikiChunkRecord[];
  }> {
    const [pages] = await this.db.query<[WikiPageRecord[]]>(
      "SELECT * FROM wiki_page WHERE status = 'active'"
    );
    const [links] = await this.db.query<[WikiLinkRecord[]]>("SELECT * FROM wiki_link");
    const [chunks] = await this.db.query<[WikiChunkRecord[]]>("SELECT * FROM wiki_chunk");

    return {
      pages: pages ?? [],
      links: links ?? [],
      chunks: chunks ?? [],
    };
  }

  // ─── Validation ──────────────────────────────────────────────────────────────

  validateManifest(manifest: GraftManifest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!manifest.version) {
      errors.push("Missing version");
    }
    if (!manifest.vaultGenesis) {
      errors.push("Missing vaultGenesis");
    }
    if (!manifest.harvestDate) {
      errors.push("Missing harvestDate");
    }
    if (!manifest.librarianHash) {
      errors.push("Missing librarianHash");
    }

    if (manifest.metrics.lintHealthScore < this.thresholds.minLintHealthScore) {
      errors.push("Lint health score below threshold");
    }
    if (manifest.metrics.wikiDensity < this.thresholds.minWikiDensity) {
      errors.push("Wiki density below threshold");
    }
    if (manifest.metrics.vaultAgeDays < this.thresholds.minVaultAgeDays) {
      errors.push("Vault age below threshold");
    }

    return { valid: errors.length === 0, errors };
  }

  // ─── Utilities ───────────────────────────────────────────────────────────────

  private async sha256(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
}
