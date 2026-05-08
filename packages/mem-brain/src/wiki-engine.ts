// WikiEngine — LLM-Wiki v2 runtime
// Implements: graph storage, hybrid search, confidence scoring, auto-linking, lint
// Ports gbrain patterns to SurrealDB + Aigency stack

import { SurrealClient } from "@aigency/surreal";
import type {
  WikiPageRecord,
  WikiChunkRecord,
  WikiLinkRecord,
  WikiTimelineEntryRecord,
} from "@aigency/surreal";

// ─── Configuration ────────────────────────────────────────────────────────────

export interface WikiEngineConfig {
  source: string; // e.g. "aigency-wiki"
  embeddingDim?: number;
  confidenceDecayRate?: number; // per month, default 0.1
  similarityThreshold?: number; // for vector search, default 0.7
  rrfK?: number; // RRF constant, default 60
}

// ─── Search Result Types ──────────────────────────────────────────────────────

export interface HybridSearchResult {
  page: WikiPageRecord;
  score: number;
  rank: number;
  source: "vector" | "keyword" | "fused";
}

// ─── GBrain-Enhanced Search Types ─────────────────────────────────────────────

export type QueryIntent = "entity" | "temporal" | "event" | "general";

export interface IntentClassification {
  intent: QueryIntent;
  confidence: number;
  detailLevel: "low" | "medium" | "high";
  temporalRange?: { from?: string; to?: string };
}

export interface DedupConfig {
  perPageCap: number;        // Max results per page (default 3 → 2)
  jaccardThreshold: number;  // Text similarity cutoff (default 0.85)
  typeDiversityMax: number;  // Max % of one type (default 0.60)
  compiledTruthRequired: boolean; // Always include compiled_truth match
}

export interface LintReport {
  contradictions: ContradictionFinding[];
  stalePages: StalePageFinding[];
  orphans: OrphanFinding[];
  missingPages: MissingPageFinding[];
  brokenLinks: BrokenLinkFinding[];
  lowConfidence: LowConfidenceFinding[];
  timestamp: string;
}

export interface ContradictionFinding {
  type: "contradiction";
  pages: string[]; // slugs
  claim: string;
  values: string[];
  severity: "high" | "medium" | "low";
}

export interface StalePageFinding {
  type: "stale";
  slug: string;
  lastConfirmed: string;
  monthsOld: number;
  suggestedAction: "reconfirm" | "archive" | "decay";
}

export interface OrphanFinding {
  type: "orphan";
  slug: string;
  inboundLinks: number;
}

export interface MissingPageFinding {
  type: "missing";
  mentionedSlug: string;
  mentionedIn: string[]; // slugs that reference it
}

export interface BrokenLinkFinding {
  type: "broken_link";
  fromSlug: string;
  toSlug: string;
  linkType: string;
}

export interface LowConfidenceFinding {
  type: "low_confidence";
  slug: string;
  confidence: number;
  reason: string;
}

export interface EntityMention {
  name: string;
  type: WikiPageRecord["type"];
  context: string;
}

// ─── WikiEngine ───────────────────────────────────────────────────────────────

export class WikiEngine {
  private db = SurrealClient.db;

  constructor(private config: WikiEngineConfig) {}

  // ─── Page CRUD ──────────────────────────────────────────────────────────────

  async getPage(slug: string): Promise<WikiPageRecord | null> {
    const [rows] = await this.db.query<[WikiPageRecord[]]>(
      "SELECT * FROM wiki_page WHERE slug = $slug AND source = $source",
      { slug, source: this.config.source }
    );
    return rows?.[0] ?? null;
  }

  async createPage(
    data: Omit<WikiPageRecord, "id" | "created_at" | "updated_at" | "source">
  ): Promise<WikiPageRecord> {
    const [record] = await this.db.create("wiki_page", {
      ...data,
      source: this.config.source,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any);
    return (record as unknown) as WikiPageRecord;
  }

  async updatePage(
    slug: string,
    data: Partial<Omit<WikiPageRecord, "id" | "slug" | "source" | "created_at">>
  ): Promise<WikiPageRecord | null> {
    const [[existing]] = await this.db.query<[[WikiPageRecord]]>(
      "SELECT id FROM wiki_page WHERE slug = $slug AND source = $source",
      { slug, source: this.config.source }
    );
    if (!existing) return null;

    await this.db.merge(existing.id, {
      ...data,
      updated_at: new Date().toISOString(),
    });

    return this.getPage(slug);
  }

  async deletePage(slug: string): Promise<boolean> {
    const [[existing]] = await this.db.query<[[WikiPageRecord]]>(
      "SELECT id FROM wiki_page WHERE slug = $slug AND source = $source",
      { slug, source: this.config.source }
    );
    if (!existing) return false;

    // Cascade: delete chunks, links, timeline entries
    await this.db.query("DELETE FROM wiki_chunk WHERE page_id = $page_id", { page_id: existing.id });
    await this.db.query("DELETE FROM wiki_link WHERE from_page_id = $page_id OR to_page_id = $page_id", { page_id: existing.id });
    await this.db.query("DELETE FROM wiki_timeline_entry WHERE page_id = $page_id", { page_id: existing.id });
    await this.db.delete(existing.id);
    return true;
  }

  async listPages(options?: {
    type?: WikiPageRecord["type"];
    status?: WikiPageRecord["status"];
    limit?: number;
    offset?: number;
  }): Promise<WikiPageRecord[]> {
    let query = "SELECT * FROM wiki_page WHERE source = $source";
    const params: Record<string, unknown> = { source: this.config.source };

    if (options?.type) {
      query += " AND type = $type";
      params.type = options.type;
    }
    if (options?.status) {
      query += " AND status = $status";
      params.status = options.status;
    }
    query += " ORDER BY updated_at DESC";
    if (options?.limit) {
      query += " LIMIT $limit";
      params.limit = options.limit;
    }
    if (options?.offset) {
      query += " START $offset";
      params.offset = options.offset;
    }

    const [rows] = await this.db.query<[WikiPageRecord[]]>(query, params);
    return rows ?? [];
  }

  // ─── Confidence Scoring ─────────────────────────────────────────────────────

  async updateConfidence(slug: string, delta: number): Promise<number | null> {
    const page = await this.getPage(slug);
    if (!page) return null;

    const newConfidence = Math.max(0.1, Math.min(1.0, page.confidence + delta));
    await this.db.merge(page.id, {
      confidence: newConfidence,
      updated_at: new Date().toISOString(),
    });
    return newConfidence;
  }

  async decayConfidence(slug: string): Promise<number | null> {
    const page = await this.getPage(slug);
    if (!page) return null;

    const monthsOld = Math.floor(
      (Date.now() - new Date(page.last_confirmed ?? page.updated_at).getTime()) /
        (30 * 24 * 60 * 60 * 1000)
    );
    const decayRate = this.config.confidenceDecayRate ?? 0.1;
    const newConfidence = Math.max(0.1, page.confidence - monthsOld * decayRate);

    await this.db.merge(page.id, {
      confidence: newConfidence,
      updated_at: new Date().toISOString(),
    });
    return newConfidence;
  }

  async decayAllConfidence(): Promise<{ slug: string; old: number; new: number }[]> {
    const pages = await this.listPages({ status: "active" });
    const results: { slug: string; old: number; new: number }[] = [];

    for (const page of pages) {
      const old = page.confidence;
      const updated = await this.decayConfidence(page.slug);
      if (updated !== null) {
        results.push({ slug: page.slug, old, new: updated });
      }
    }
    return results;
  }

  // ─── Timeline Operations ────────────────────────────────────────────────────

  async addTimelineEntry(
    slug: string,
    entry: Omit<WikiTimelineEntryRecord, "id" | "page_id">
  ): Promise<WikiTimelineEntryRecord | null> {
    const page = await this.getPage(slug);
    if (!page) return null;

    const [record] = await this.db.create("wiki_timeline_entry", {
      ...entry,
      page_id: page.id,
    } as Record<string, unknown>);

    // Update page's timeline text for human readability
    const timelineLine = `\n- **${entry.date}** | ${entry.source} — ${entry.summary}`;
    await this.db.merge(page.id, {
      timeline: (page.timeline ?? "") + timelineLine,
      updated_at: new Date().toISOString(),
    });

    return record as unknown as WikiTimelineEntryRecord;
  }

  async getTimeline(slug: string): Promise<WikiTimelineEntryRecord[]> {
    const page = await this.getPage(slug);
    if (!page) return [];

    const [rows] = await this.db.query<[WikiTimelineEntryRecord[]]>(
      "SELECT * FROM wiki_timeline_entry WHERE page_id = $page_id ORDER BY date DESC",
      { page_id: page.id }
    );
    return rows ?? [];
  }

  // ─── Graph Link Operations ──────────────────────────────────────────────────

  async createLink(
    fromSlug: string,
    toSlug: string,
    linkType: WikiLinkRecord["link_type"],
    context?: string
  ): Promise<WikiLinkRecord | null> {
    const fromPage = await this.getPage(fromSlug);
    const toPage = await this.getPage(toSlug);
    if (!fromPage || !toPage) return null;

    // Check for existing link to avoid duplicates
    const [existing] = await this.db.query<[[WikiLinkRecord]]>(
      "SELECT * FROM wiki_link WHERE from_page_id = $from AND to_page_id = $to AND link_type = $type",
      { from: fromPage.id, to: toPage.id, type: linkType }
    );
    if (existing?.[0]) return existing[0];

    const [record] = await this.db.create("wiki_link", {
      from_page_id: fromPage.id,
      to_page_id: toPage.id,
      link_type: linkType,
      context,
      created_at: new Date().toISOString(),
    } as any);
    return record as unknown as WikiLinkRecord;
  }

  async getLinks(slug: string): Promise<{ outgoing: WikiLinkRecord[]; incoming: WikiLinkRecord[] }> {
    const page = await this.getPage(slug);
    if (!page) return { outgoing: [], incoming: [] };

    const [outgoing] = await this.db.query<[WikiLinkRecord[]]>(
      "SELECT * FROM wiki_link WHERE from_page_id = $page_id",
      { page_id: page.id }
    );
    const [incoming] = await this.db.query<[WikiLinkRecord[]]>(
      "SELECT * FROM wiki_link WHERE to_page_id = $page_id",
      { page_id: page.id }
    );

    return { outgoing: outgoing ?? [], incoming: incoming ?? [] };
  }

  async getLinkedPages(slug: string, _depth = 1): Promise<WikiPageRecord[]> {
    const page = await this.getPage(slug);
    if (!page) return [];

    // Use SurrealDB graph traversal
    const [rows] = await this.db.query<[WikiPageRecord[]]>(
      `SELECT * FROM (
         SELECT ->wiki_link->wiki_page.* AS pages FROM wiki_page WHERE id = $page_id
         UNION
         SELECT <-wiki_link<-wiki_page.* AS pages FROM wiki_page WHERE id = $page_id
       ).pages`,
      { page_id: page.id }
    );
    return rows ?? [];
  }

  async deleteLink(fromSlug: string, toSlug: string, linkType: string): Promise<boolean> {
    const fromPage = await this.getPage(fromSlug);
    const toPage = await this.getPage(toSlug);
    if (!fromPage || !toPage) return false;

    await this.db.query(
      "DELETE FROM wiki_link WHERE from_page_id = $from AND to_page_id = $to AND link_type = $type",
      { from: fromPage.id, to: toPage.id, type: linkType }
    );
    return true;
  }

  // ─── Chunk & Embedding Operations ───────────────────────────────────────────

  async createChunk(
    slug: string,
    data: Omit<WikiChunkRecord, "id" | "page_id">
  ): Promise<WikiChunkRecord | null> {
    const page = await this.getPage(slug);
    if (!page) return null;

    const [record] = await this.db.create("wiki_chunk", {
      ...data,
      page_id: page.id,
    } as any);
    return record as unknown as WikiChunkRecord;
  }

  async searchSimilarChunks(embedding: number[], limit = 5): Promise<(WikiChunkRecord & { page: WikiPageRecord; similarity: number })[]> {
    const threshold = this.config.similarityThreshold ?? 0.7;

    const [rows] = await this.db.query<
      [(WikiChunkRecord & { page: WikiPageRecord; similarity: number })[]]
    >(
      `SELECT *, vector::similarity::cosine(embedding, $vec) AS similarity,
         (SELECT * FROM wiki_page WHERE id = wiki_chunk.page_id)[0] AS page
       FROM wiki_chunk
       WHERE vector::similarity::cosine(embedding, $vec) > $threshold
       ORDER BY similarity DESC
       LIMIT $limit`,
      { vec: embedding, threshold, limit }
    );
    return rows ?? [];
  }

  async deleteChunksForPage(slug: string): Promise<void> {
    const page = await this.getPage(slug);
    if (!page) return;
    await this.db.query("DELETE FROM wiki_chunk WHERE page_id = $page_id", { page_id: page.id });
  }

  // ─── Hybrid Search (Vector + Keyword + RRF) ─────────────────────────────────

  async hybridSearch(
    queryText: string,
    queryEmbedding: number[],
    limit = 5
  ): Promise<HybridSearchResult[]> {
    const rrfK = this.config.rrfK ?? 60;

    // Vector search
    const [vectorRows] = await this.db.query<
      [{ id: string; page_id: string; chunk_text: string; similarity: number }[]]
    >(
      `SELECT id, page_id, chunk_text, vector::similarity::cosine(embedding, $vec) AS similarity
       FROM wiki_chunk
       WHERE vector::similarity::cosine(embedding, $vec) > $threshold
       ORDER BY similarity DESC
       LIMIT $limit`,
      { vec: queryEmbedding, threshold: this.config.similarityThreshold ?? 0.7, limit: limit * 2 }
    );

    // Keyword search via BM25 on wiki_page
    const [keywordRows] = await this.db.query<
      [{ id: string; slug: string; title: string; compiled_truth: string; score: number }[]]
    >(
      `SELECT id, slug, title, compiled_truth, search::score(+id) AS score
       FROM wiki_page
       WHERE source = $source AND (title @@ $query OR compiled_truth @@ $query)
       ORDER BY score DESC
       LIMIT $limit`,
      { source: this.config.source, query: queryText, limit: limit * 2 }
    );

    // RRF fusion
    const scores = new Map<string, { vectorRank?: number; keywordRank?: number }>();

    (vectorRows ?? []).forEach((row, idx) => {
      const existing = scores.get(row.page_id) ?? {};
      existing.vectorRank = idx + 1;
      scores.set(row.page_id, existing);
    });

    (keywordRows ?? []).forEach((row, idx) => {
      const existing = scores.get(row.id) ?? {};
      existing.keywordRank = idx + 1;
      scores.set(row.id, existing);
    });

    // Calculate RRF scores
    const fused = Array.from(scores.entries())
      .map(([pageId, ranks]) => {
        let rrfScore = 0;
        if (ranks.vectorRank) rrfScore += 1 / (rrfK + ranks.vectorRank);
        if (ranks.keywordRank) rrfScore += 1 / (rrfK + ranks.keywordRank);
        return { pageId, rrfScore, ranks };
      })
      .sort((a, b) => b.rrfScore - a.rrfScore)
      .slice(0, limit);

    // Fetch full page records
    const results: HybridSearchResult[] = [];
    for (const { pageId, rrfScore, ranks } of fused) {
      const [[page]] = await this.db.query<[[WikiPageRecord]]>("SELECT * FROM wiki_page WHERE id = $id", { id: pageId });
      if (page) {
        results.push({
          page,
          score: rrfScore,
          rank: results.length + 1,
          source: ranks.vectorRank && ranks.keywordRank ? "fused" : ranks.vectorRank ? "vector" : "keyword",
        });
      }
    }

    return results;
  }

  // ─── GBrain-Enhanced Search Patterns ────────────────────────────────────────

  /**
   * Zero-LLM intent classification for search queries.
   * Routes queries to appropriate detail levels without API cost.
   */
  classifyIntent(queryText: string): IntentClassification {
    const lower = queryText.toLowerCase();

    // Temporal patterns
    const temporalPatterns = /\b(last|recent|latest|this week|this month|this year|since|ago|before|after|between)\b/;
    const datePatterns = /\b\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|january|february|march|april|may|june|july|august|september|october|november|december\b/;

    // Entity patterns
    const entityPatterns = /\b(who is|what is|where is|about|profile of|details on)\b/;

    // Event patterns
    const eventPatterns = /\b(what happened|when did|how did|why did|outcome of|result of|decision on)\b/;

    if (temporalPatterns.test(lower) || datePatterns.test(lower)) {
      return {
        intent: "temporal",
        confidence: 0.85,
        detailLevel: "high",
      };
    }

    if (eventPatterns.test(lower)) {
      return {
        intent: "event",
        confidence: 0.80,
        detailLevel: "high",
      };
    }

    if (entityPatterns.test(lower)) {
      return {
        intent: "entity",
        confidence: 0.90,
        detailLevel: "low",
      };
    }

    return {
      intent: "general",
      confidence: 0.60,
      detailLevel: "medium",
    };
  }

  /**
   * 4-layer dedup pipeline:
   * 1. Per-page cap (max results per page)
   * 2. Jaccard text similarity (>0.85 = duplicate)
   * 3. Type diversity (max 60% of one type)
   * 4. Compiled truth guarantee (always keep best compiled_truth match)
   */
  dedupResults(
    results: HybridSearchResult[],
    config: Partial<DedupConfig> = {}
  ): HybridSearchResult[] {
    const cfg: DedupConfig = {
      perPageCap: 2,
      jaccardThreshold: 0.85,
      typeDiversityMax: 0.60,
      compiledTruthRequired: true,
      ...config,
    };

    // Layer 1: Per-page cap
    const pageCounts = new Map<string, number>();
    const capped = results.filter((r) => {
      const count = (pageCounts.get(r.page.id) ?? 0) + 1;
      pageCounts.set(r.page.id, count);
      return count <= cfg.perPageCap;
    });

    // Layer 2: Jaccard similarity dedup
    const jaccard = (a: string, b: string): number => {
      const setA = new Set(a.toLowerCase().split(/\s+/));
      const setB = new Set(b.toLowerCase().split(/\s+/));
      const intersection = new Set([...setA].filter((x) => setB.has(x)));
      const union = new Set([...setA, ...setB]);
      return intersection.size / union.size;
    };

    const deduped: HybridSearchResult[] = [];
    for (const result of capped) {
      const isDuplicate = deduped.some(
        (d) =>
          d.page.id === result.page.id ||
          jaccard(d.page.compiled_truth, result.page.compiled_truth) > cfg.jaccardThreshold
      );
      if (!isDuplicate) deduped.push(result);
    }

    // Layer 3: Type diversity enforcement
    const typeCounts = new Map<string, number>();
    for (const r of deduped) {
      const t = r.page.type;
      typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1);
    }

    const total = deduped.length;
    const filtered = deduped.filter((r) => {
      const typeCount = typeCounts.get(r.page.type) ?? 0;
      const typeRatio = typeCount / total;
      if (typeRatio > cfg.typeDiversityMax && typeCount > 1) {
        typeCounts.set(r.page.type, typeCount - 1);
        return false;
      }
      return true;
    });

    // Layer 4: Compiled truth guarantee
    if (cfg.compiledTruthRequired) {
      const hasCompiledTruth = filtered.some((r) => r.page.compiled_truth && r.page.compiled_truth.length > 100);
      if (!hasCompiledTruth && results.length > 0) {
        // Add highest-scoring result with substantial compiled_truth
        const best = results
          .filter((r) => r.page.compiled_truth && r.page.compiled_truth.length > 100)
          .sort((a, b) => b.score - a.score)[0];
        if (best && !filtered.some((r) => r.page.id === best.page.id)) {
          filtered.push(best);
        }
      }
    }

    return filtered.sort((a, b) => b.score - a.score);
  }

  /**
   * Backlink boost: use graph topology as retrieval signal.
   * Well-connected entities (many incoming links) rank higher.
   */
  async applyBacklinkBoost(results: HybridSearchResult[]): Promise<HybridSearchResult[]> {
    const boosted = await Promise.all(
      results.map(async (result) => {
        const { incoming } = await this.getLinks(result.page.slug);
        const linkCount = incoming.length;
        // Log-weighted boost: log2(linkCount + 1) * 0.1
        const boost = Math.log2(linkCount + 1) * 0.1;
        return {
          ...result,
          score: result.score + boost,
        };
      })
    );

    return boosted.sort((a, b) => b.score - a.score);
  }

  /**
   * Source-aware ranking: boost canonical docs, damp chat noise.
   * Hard-exclude test/archive prefixes at SQL layer.
   */
  applySourceRanking(results: HybridSearchResult[]): HybridSearchResult[] {
    const sourceBoosts: Record<string, number> = {
      concept: 1.3,
      agent: 1.2,
      system: 1.1,
      document: 1.0,
      project: 0.9,
      meeting: 0.7,
      idea: 0.6,
    };

    return results
      .map((r) => {
        const boost = sourceBoosts[r.page.type] ?? 1.0;
        return {
          ...r,
          score: r.score * boost,
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Full GBrain-enhanced search pipeline.
   * Intent classification → hybrid search → backlink boost → source ranking → dedup.
   */
  async search(
    queryText: string,
    queryEmbedding: number[],
    limit = 5
  ): Promise<HybridSearchResult[]> {
    const intent = this.classifyIntent(queryText);

    // Adjust limit based on intent detail level
    const adjustedLimit = intent.detailLevel === "high" ? limit * 2 : limit;

    // Run hybrid search
    let results = await this.hybridSearch(queryText, queryEmbedding, adjustedLimit);

    // Apply backlink boost
    results = await this.applyBacklinkBoost(results);

    // Apply source-aware ranking
    results = this.applySourceRanking(results);

    // Apply 4-layer dedup
    results = this.dedupResults(results, {
      perPageCap: intent.detailLevel === "low" ? 1 : 2,
      jaccardThreshold: 0.85,
      typeDiversityMax: 0.60,
      compiledTruthRequired: true,
    });

    return results.slice(0, limit);
  }

  // ─── Auto-Link Extraction (Zero-LLM) ────────────────────────────────────────

  /**
   * Extract entity mentions from text using regex patterns.
   * Zero LLM calls — fast, deterministic.
   */
  extractEntities(text: string): EntityMention[] {
    const mentions: EntityMention[] = [];

    // Aigency agent callsigns (ALL_CAPS)
    const agentPattern = /\b(ZENITH|CIPHER|VECTOR|ECHO|ATLAS|COMPASS|IRIS|HERALD|ORACLE|LIBRARIAN|NEXUS|THE_ARCHITECT)\b/g;
    let match: RegExpExecArray | null;
    while ((match = agentPattern.exec(text)) !== null) {
      mentions.push({
        name: match[1],
        type: "agent",
        context: text.slice(Math.max(0, match.index - 50), match.index + match[0].length + 50),
      });
    }

    // Service names (capitalized, known list)
    const servicePattern = /\b(Router|Membrane|ORACLE|Librarian|Contracts|TELOS|Honcho|SurrealDB|HarvestMoon)\b/g;
    while ((match = servicePattern.exec(text)) !== null) {
      mentions.push({
        name: match[1],
        type: "service",
        context: text.slice(Math.max(0, match.index - 50), match.index + match[0].length + 50),
      });
    }

    // Package names (@aigency/ prefix)
    const packagePattern = /@aigency\/([a-z-]+)/g;
    while ((match = packagePattern.exec(text)) !== null) {
      mentions.push({
        name: match[1],
        type: "package",
        context: text.slice(Math.max(0, match.index - 30), match.index + match[0].length + 30),
      });
    }

    // Deduplicate by name+type
    const seen = new Set<string>();
    return mentions.filter((m) => {
      const key = `${m.type}:${m.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Infer link type from context using keyword heuristics.
   */
  inferLinkType(_fromType: string, _toType: string, context: string): WikiLinkRecord["link_type"] {
    const lower = context.toLowerCase();

    if (lower.includes("depends on") || lower.includes("requires")) return "depends_on";
    if (lower.includes("owns") || lower.includes("maintains") || lower.includes("responsible for")) return "owns";
    if (lower.includes("reports to") || lower.includes("reports_to")) return "reports_to";
    if (lower.includes("supersedes") || lower.includes("replaces") || lower.includes("deprecated")) return "supersedes";
    if (lower.includes("contradicts") || lower.includes("conflicts with")) return "contradicts";
    if (lower.includes("emits") || lower.includes("publishes") || lower.includes("broadcasts")) return "emits";
    if (lower.includes("subscribes") || lower.includes("listens to")) return "subscribes_to";
    if (lower.includes("uses") || lower.includes("utilizes")) return "uses";

    return "references";
  }

  /**
   * Auto-link a page's content: extract entities and create graph edges.
   */
  async autoLinkPage(slug: string): Promise<WikiLinkRecord[]> {
    const page = await this.getPage(slug);
    if (!page) return [];

    const text = `${page.title} ${page.compiled_truth}`;
    const mentions = this.extractEntities(text);
    const created: WikiLinkRecord[] = [];

    for (const mention of mentions) {
      // Find or create the target page
      let target = await this.getPage(mention.name.toLowerCase().replace(/\s+/g, "-"));
      if (!target) {
        // Try exact match on title
        const [[exact]] = await this.db.query<[[WikiPageRecord]]>(
          "SELECT * FROM wiki_page WHERE source = $source AND title = $title",
          { source: this.config.source, title: mention.name }
        );
        target = exact ?? null;
      }

      if (target && target.id !== page.id) {
        const linkType = this.inferLinkType(page.type, target.type, mention.context);
        const link = await this.createLink(slug, target.slug, linkType, mention.context.slice(0, 200));
        if (link) created.push(link);
      }
    }

    return created;
  }

  // ─── Lint Operations ────────────────────────────────────────────────────────

  async lint(): Promise<LintReport> {
    const report: LintReport = {
      contradictions: [],
      stalePages: [],
      orphans: [],
      missingPages: [],
      brokenLinks: [],
      lowConfidence: [],
      timestamp: new Date().toISOString(),
    };

    const pages = await this.listPages();

    // 1. Find stale pages (not confirmed in 30+ days)
    const now = Date.now();
    for (const page of pages) {
      const lastConfirmed = new Date(page.last_confirmed ?? page.updated_at).getTime();
      const monthsOld = Math.floor((now - lastConfirmed) / (30 * 24 * 60 * 60 * 1000));

      if (monthsOld >= 1) {
        report.stalePages.push({
          type: "stale",
          slug: page.slug,
          lastConfirmed: page.last_confirmed ?? page.updated_at,
          monthsOld,
          suggestedAction: monthsOld >= 6 ? "archive" : monthsOld >= 3 ? "decay" : "reconfirm",
        });
      }

      // Low confidence
      if (page.confidence < 0.5) {
        report.lowConfidence.push({
          type: "low_confidence",
          slug: page.slug,
          confidence: page.confidence,
          reason: page.confidence < 0.3 ? "Speculative, needs confirmation" : "Synthesized, single source",
        });
      }
    }

    // 2. Find orphans (no inbound links)
    for (const page of pages) {
      const { incoming } = await this.getLinks(page.slug);
      if (incoming.length === 0 && page.status === "active") {
        report.orphans.push({
          type: "orphan",
          slug: page.slug,
          inboundLinks: incoming.length,
        });
      }
    }

    // 3. Find missing pages (mentioned in compiled_truth but no page exists)
    for (const page of pages) {
      const mentions = this.extractEntities(page.compiled_truth);
      for (const mention of mentions) {
        const mentionSlug = mention.name.toLowerCase().replace(/\s+/g, "-");
        const exists = pages.some((p) => p.slug === mentionSlug || p.title === mention.name);
        if (!exists) {
          const existing = report.missingPages.find((m) => m.mentionedSlug === mentionSlug);
          if (existing) {
            existing.mentionedIn.push(page.slug);
          } else {
            report.missingPages.push({
              type: "missing",
              mentionedSlug: mentionSlug,
              mentionedIn: [page.slug],
            });
          }
        }
      }
    }

    // 4. Find broken links (links pointing to non-existent pages)
    const [allLinks] = await this.db.query<[WikiLinkRecord[]]>(
      "SELECT * FROM wiki_link WHERE from_page_id IN (SELECT id FROM wiki_page WHERE source = $source)",
      { source: this.config.source }
    );

    for (const link of allLinks ?? []) {
      const [[toPage]] = await this.db.query<[[WikiPageRecord]]>("SELECT * FROM wiki_page WHERE id = $id", { id: link.to_page_id });
      if (!toPage) {
        const [[fromPage]] = await this.db.query<[[WikiPageRecord]]>("SELECT * FROM wiki_page WHERE id = $id", { id: link.from_page_id });
        report.brokenLinks.push({
          type: "broken_link",
          fromSlug: fromPage?.slug ?? link.from_page_id,
          toSlug: link.to_page_id,
          linkType: link.link_type,
        });
      }
    }

    return report;
  }

  // ─── Ingest Pipeline ────────────────────────────────────────────────────────

  async ingest(
    sourceType: string,
    sourceRef: string,
    pages: Array<{
      slug: string;
      type: WikiPageRecord["type"];
      title: string;
      compiled_truth: string;
      confidence: number;
      sources: string[];
    }>
  ): Promise<{ created: string[]; updated: string[]; links: WikiLinkRecord[] }> {
    const created: string[] = [];
    const updated: string[] = [];
    const allLinks: WikiLinkRecord[] = [];

    for (const pageData of pages) {
      const existing = await this.getPage(pageData.slug);

      if (existing) {
        await this.updatePage(pageData.slug, {
          compiled_truth: pageData.compiled_truth,
          confidence: pageData.confidence,
          sources: [...new Set([...(existing.sources ?? []), ...pageData.sources])],
          last_confirmed: new Date().toISOString(),
        });
        updated.push(pageData.slug);
      } else {
        await this.createPage({
          ...pageData,
          timeline: "",
          frontmatter: {},
          status: "active",
          last_confirmed: new Date().toISOString(),
        });
        created.push(pageData.slug);
      }

      // Auto-link
      const links = await this.autoLinkPage(pageData.slug);
      allLinks.push(...links);
    }

    // Log ingest
    await this.db.create("wiki_ingest_log", {
      source_type: sourceType,
      source_ref: sourceRef,
      pages_updated: [...created, ...updated],
      summary: `Ingested ${created.length} new, ${updated.length} updated pages from ${sourceType}`,
      created_at: new Date().toISOString(),
    } as any);

    return { created, updated, links: allLinks };
  }

  // ─── Crystallization ────────────────────────────────────────────────────────

  async crystallize(
    slug: string,
    digest: {
      question: string;
      findings: string;
      filesInvolved: string[];
      lessons: string[];
    }
  ): Promise<WikiPageRecord | null> {
    const compiledTruth = `## ${digest.question}\n\n${digest.findings}\n\n### Lessons\n${digest.lessons.map((l) => `- ${l}`).join("\n")}\n\n### Files\n${digest.filesInvolved.map((f) => `- \`${f}\``).join("\n")}`;

    const page = await this.getPage(slug);
    if (page) {
      await this.updatePage(slug, {
        compiled_truth: `${page.compiled_truth}\n\n${compiledTruth}`,
        confidence: Math.min(1.0, page.confidence + 0.1),
      });
      await this.addTimelineEntry(slug, {
        date: new Date().toISOString().split("T")[0],
        source: "crystallization",
        summary: `Crystallized: ${digest.question}`,
      });
      return this.getPage(slug);
    }

    return this.createPage({
      slug,
      type: "concept",
      title: `Crystallized: ${digest.question}`,
      compiled_truth: compiledTruth,
      confidence: 0.7,
      sources: digest.filesInvolved,
      last_confirmed: new Date().toISOString(),
      timeline: "",
      frontmatter: {},
      status: "active",
    });
  }

  // ─── Stats & Health ─────────────────────────────────────────────────────────

  async stats(): Promise<{
    totalPages: number;
    byType: Record<string, number>;
    avgConfidence: number;
    totalLinks: number;
    totalChunks: number;
    staleCount: number;
  }> {
    const [pageCounts] = await this.db.query<
      [{ total: number; byType: Record<string, number>; avgConfidence: number }[]]
    >(
      `SELECT
         count() AS total,
         type AS byType,
         math::mean(confidence) AS avgConfidence
       FROM wiki_page
       WHERE source = $source
       GROUP BY type`,
      { source: this.config.source }
    );

    const [[linkCount]] = await this.db.query<[[{ count: number }]]>(
      "SELECT count() AS count FROM wiki_link WHERE from_page_id IN (SELECT id FROM wiki_page WHERE source = $source)",
      { source: this.config.source }
    );

    const [[chunkCount]] = await this.db.query<[[{ count: number }]]>(
      "SELECT count() AS count FROM wiki_chunk WHERE page_id IN (SELECT id FROM wiki_page WHERE source = $source)",
      { source: this.config.source }
    );

    const now = Date.now();
    const pages = await this.listPages();
    const staleCount = pages.filter((p) => {
      const lastConfirmed = new Date(p.last_confirmed ?? p.updated_at).getTime();
      return (now - lastConfirmed) > 30 * 24 * 60 * 60 * 1000;
    }).length;

    const byType: Record<string, number> = {};
    let totalPages = 0;
    let totalConfidence = 0;

    for (const row of pageCounts ?? []) {
      const typeKey = String(row.byType);
      byType[typeKey] = (byType[typeKey] ?? 0) + (row.total ?? 0);
      totalPages += row.total ?? 0;
      totalConfidence += (row.avgConfidence ?? 0) * (row.total ?? 0);
    }

    return {
      totalPages,
      byType,
      avgConfidence: totalPages > 0 ? totalConfidence / totalPages : 0,
      totalLinks: linkCount?.count ?? 0,
      totalChunks: chunkCount?.count ?? 0,
      staleCount,
    };
  }
}
