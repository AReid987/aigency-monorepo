import { describe, it, expect, beforeEach, vi } from "vitest";
import { WikiEngine } from "./wiki-engine.js";
import { SurrealClient } from "@aigency/surreal";

// Mock SurrealDB client
const mockDb = {
  query: vi.fn(),
  create: vi.fn(),
  merge: vi.fn(),
  delete: vi.fn(),
  subscribeLive: vi.fn(),
  kill: vi.fn(),
};

vi.mock("@aigency/surreal", () => ({
  SurrealClient: {
    get db() {
      return mockDb;
    },
  },
}));

describe("WikiEngine", () => {
  const config = { source: "test-wiki", embeddingDim: 1536 };
  let engine: WikiEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new WikiEngine(config);
  });

  describe("Page CRUD", () => {
    it("should get a page by slug", async () => {
      const mockPage = {
        id: "wiki_page:test-page",
        slug: "test-page",
        source: "test-wiki",
        type: "concept",
        title: "Test Page",
        compiled_truth: "This is a test.",
        timeline: "",
        frontmatter: {},
        confidence: 0.8,
        last_confirmed: "2026-05-01",
        sources: ["apps/docs/test.md"],
        status: "active",
        created_at: "2026-05-01T00:00:00Z",
        updated_at: "2026-05-01T00:00:00Z",
      };

      mockDb.query.mockResolvedValueOnce([[mockPage]]);

      const page = await engine.getPage("test-page");
      expect(page).toEqual(mockPage);
      expect(mockDb.query).toHaveBeenCalledWith(
        "SELECT * FROM wiki_page WHERE slug = $slug AND source = $source",
        { slug: "test-page", source: "test-wiki" }
      );
    });

    it("should return null for non-existent page", async () => {
      mockDb.query.mockResolvedValueOnce([[]]);
      const page = await engine.getPage("missing");
      expect(page).toBeNull();
    });

    it("should create a page", async () => {
      const mockPage = {
        id: "wiki_page:new-page",
        slug: "new-page",
        source: "test-wiki",
        type: "concept",
        title: "New Page",
        compiled_truth: "Content",
        timeline: "",
        frontmatter: {},
        confidence: 0.7,
        last_confirmed: "2026-05-01",
        sources: ["source.md"],
        status: "active",
        created_at: expect.any(String),
        updated_at: expect.any(String),
      };

      mockDb.create.mockResolvedValueOnce([mockPage]);

      const page = await engine.createPage({
        slug: "new-page",
        type: "concept",
        title: "New Page",
        compiled_truth: "Content",
        confidence: 0.7,
        last_confirmed: "2026-05-01",
        sources: ["source.md"],
        status: "active",
      });

      expect(page).toBeDefined();
      expect(mockDb.create).toHaveBeenCalledWith("wiki_page", expect.objectContaining({
        slug: "new-page",
        source: "test-wiki",
      }));
    });

    it("should update a page", async () => {
      const existing = { id: "wiki_page:update-me", slug: "update-me" };
      mockDb.query.mockResolvedValueOnce([[existing]]);
      mockDb.merge.mockResolvedValueOnce(undefined);
      mockDb.query.mockResolvedValueOnce([[{ ...existing, confidence: 0.9 }]]);

      const page = await engine.updatePage("update-me", { confidence: 0.9 });
      expect(page).toBeDefined();
      expect(mockDb.merge).toHaveBeenCalledWith("wiki_page:update-me", expect.objectContaining({ confidence: 0.9 }));
    });

    it("should delete a page and cascade", async () => {
      const existing = { id: "wiki_page:delete-me", slug: "delete-me" };
      mockDb.query.mockResolvedValueOnce([[existing]]);
      mockDb.query.mockResolvedValueOnce([]);
      mockDb.query.mockResolvedValueOnce([]);
      mockDb.query.mockResolvedValueOnce([]);
      mockDb.delete.mockResolvedValueOnce(undefined);

      const result = await engine.deletePage("delete-me");
      expect(result).toBe(true);
      expect(mockDb.delete).toHaveBeenCalledWith("wiki_page:delete-me");
    });
  });

  describe("Confidence Scoring", () => {
    it("should update confidence with delta", async () => {
      const mockPage = {
        id: "wiki_page:conf",
        slug: "conf",
        confidence: 0.5,
        last_confirmed: "2026-05-01",
        updated_at: "2026-05-01",
      };
      mockDb.query.mockResolvedValueOnce([[mockPage]]);
      mockDb.merge.mockResolvedValueOnce(undefined);

      const newConfidence = await engine.updateConfidence("conf", 0.2);
      expect(newConfidence).toBe(0.7);
    });

    it("should cap confidence at 1.0", async () => {
      const mockPage = {
        id: "wiki_page:conf",
        slug: "conf",
        confidence: 0.9,
        last_confirmed: "2026-05-01",
        updated_at: "2026-05-01",
      };
      mockDb.query.mockResolvedValueOnce([[mockPage]]);
      mockDb.merge.mockResolvedValueOnce(undefined);

      const newConfidence = await engine.updateConfidence("conf", 0.2);
      expect(newConfidence).toBe(1.0);
    });

    it("should decay confidence based on age", async () => {
      const oldDate = new Date();
      oldDate.setMonth(oldDate.getMonth() - 3);

      const mockPage = {
        id: "wiki_page:old",
        slug: "old",
        confidence: 0.9,
        last_confirmed: oldDate.toISOString(),
        updated_at: oldDate.toISOString(),
      };
      mockDb.query.mockResolvedValueOnce([[mockPage]]);
      mockDb.merge.mockResolvedValueOnce(undefined);

      const newConfidence = await engine.decayConfidence("old");
      expect(newConfidence).toBeLessThan(0.9);
      expect(newConfidence).toBeGreaterThanOrEqual(0.1);
    });
  });

  describe("Auto-Link Extraction", () => {
    it("should extract agent callsigns", () => {
      const text = "ZENITH and CIPHER discussed the architecture with ORACLE.";
      const mentions = engine.extractEntities(text);

      // ORACLE matches both agent and service patterns (dedup is per type)
      expect(mentions.length).toBeGreaterThanOrEqual(3);
      expect(mentions.map((m) => m.name)).toContain("ZENITH");
      expect(mentions.map((m) => m.name)).toContain("CIPHER");
      expect(mentions.map((m) => m.name)).toContain("ORACLE");
      expect(mentions.filter((m) => m.type === "agent").map((m) => m.name)).toContain("ORACLE");
    });

    it("should extract service names", () => {
      const text = "The Router sends requests to SurrealDB via the Membrane.";
      const mentions = engine.extractEntities(text);

      const services = mentions.filter((m) => m.type === "service");
      expect(services.map((m) => m.name)).toContain("Router");
      expect(services.map((m) => m.name)).toContain("SurrealDB");
    });

    it("should extract package names", () => {
      const text = "Use @aigency/agent-core and @aigency/surreal for the integration.";
      const mentions = engine.extractEntities(text);

      const packages = mentions.filter((m) => m.type === "package");
      expect(packages.map((m) => m.name)).toContain("agent-core");
      expect(packages.map((m) => m.name)).toContain("surreal");
    });

    it("should deduplicate mentions", () => {
      const text = "ZENITH said something, then ZENITH said something else.";
      const mentions = engine.extractEntities(text);
      expect(mentions.filter((m) => m.name === "ZENITH")).toHaveLength(1);
    });
  });

  describe("Link Type Inference", () => {
    it("should infer depends_on from context", () => {
      const type = engine.inferLinkType("service", "package", "The Router depends on @aigency/surreal");
      expect(type).toBe("depends_on");
    });

    it("should infer uses from context", () => {
      const type = engine.inferLinkType("agent", "service", "ORACLE uses the Router for routing");
      expect(type).toBe("uses");
    });

    it("should default to references", () => {
      const type = engine.inferLinkType("concept", "concept", "Some generic text without keywords");
      expect(type).toBe("references");
    });
  });

  describe("Hybrid Search", () => {
    it("should perform RRF fusion", async () => {
      const vectorResults = [
        { id: "chunk:1", page_id: "wiki_page:a", chunk_text: "foo", similarity: 0.9 },
        { id: "chunk:2", page_id: "wiki_page:b", chunk_text: "bar", similarity: 0.8 },
      ];

      const keywordResults = [
        { id: "wiki_page:b", slug: "b", title: "B", compiled_truth: "bar content", score: 0.85 },
        { id: "wiki_page:c", slug: "c", title: "C", compiled_truth: "baz content", score: 0.75 },
      ];

      const pageA = { id: "wiki_page:a", slug: "a", title: "A", type: "concept", confidence: 0.8, compiled_truth: "foo" };
      const pageB = { id: "wiki_page:b", slug: "b", title: "B", type: "concept", confidence: 0.8, compiled_truth: "bar" };
      const pageC = { id: "wiki_page:c", slug: "c", title: "C", type: "concept", confidence: 0.8, compiled_truth: "baz" };

      mockDb.query
        .mockResolvedValueOnce([vectorResults])
        .mockResolvedValueOnce([keywordResults])
        .mockResolvedValueOnce([[pageB]])
        .mockResolvedValueOnce([[pageA]])
        .mockResolvedValueOnce([[pageC]]);

      const results = await engine.hybridSearch("test query", [0.1, 0.2, 0.3], 5);

      expect(results).toHaveLength(3);
      // Page B appears in both vector and keyword, so it should rank highest
      expect(results[0].page.id).toBe("wiki_page:b");
      expect(results[0].source).toBe("fused");
    });
  });

  describe("Lint", () => {
    it("should detect stale pages", async () => {
      const oldDate = new Date();
      oldDate.setMonth(oldDate.getMonth() - 2);

      const pages = [
        {
          id: "wiki_page:stale",
          slug: "stale",
          source: "test-wiki",
          type: "concept",
          title: "Stale",
          compiled_truth: "Old content",
          confidence: 0.8,
          last_confirmed: oldDate.toISOString(),
          updated_at: oldDate.toISOString(),
          status: "active",
        },
      ];

      mockDb.query
        .mockResolvedValueOnce([pages])       // listPages
        .mockResolvedValueOnce([[pages[0]]])   // getPage inside getLinks
        .mockResolvedValueOnce([[]])           // getLinks outgoing
        .mockResolvedValueOnce([[]])           // getLinks incoming
        .mockResolvedValueOnce([[]]);          // allLinks

      const report = await engine.lint();
      expect(report.stalePages).toHaveLength(1);
      expect(report.stalePages[0].slug).toBe("stale");
    });

    it("should detect low confidence pages", async () => {
      const pages = [
        {
          id: "wiki_page:low",
          slug: "low",
          source: "test-wiki",
          type: "concept",
          title: "Low Confidence",
          compiled_truth: "Speculative",
          confidence: 0.3,
          last_confirmed: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: "active",
        },
      ];

      mockDb.query
        .mockResolvedValueOnce([pages])       // listPages
        .mockResolvedValueOnce([[pages[0]]])   // getPage inside getLinks
        .mockResolvedValueOnce([[]])           // getLinks outgoing
        .mockResolvedValueOnce([[]])           // getLinks incoming
        .mockResolvedValueOnce([[]]);          // allLinks

      const report = await engine.lint();
      expect(report.lowConfidence).toHaveLength(1);
      expect(report.lowConfidence[0].slug).toBe("low");
    });

    it("should detect orphans", async () => {
      const pages = [
        {
          id: "wiki_page:orphan",
          slug: "orphan",
          source: "test-wiki",
          type: "concept",
          title: "Orphan",
          compiled_truth: "No links",
          confidence: 0.8,
          last_confirmed: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: "active",
        },
      ];

      mockDb.query
        .mockResolvedValueOnce([pages])       // listPages
        .mockResolvedValueOnce([[pages[0]]])   // getPage inside getLinks
        .mockResolvedValueOnce([[]])           // getLinks outgoing
        .mockResolvedValueOnce([[]])           // getLinks incoming
        .mockResolvedValueOnce([[]]);          // allLinks

      const report = await engine.lint();
      expect(report.orphans).toHaveLength(1);
      expect(report.orphans[0].slug).toBe("orphan");
    });
  });

  describe("Ingest Pipeline", () => {
    it("should ingest new pages and auto-link", async () => {
      mockDb.query.mockResolvedValueOnce([[]]); // getPage for new-page
      mockDb.create.mockResolvedValueOnce([{ id: "wiki_page:new-page", slug: "new-page" }]);
      mockDb.query.mockResolvedValueOnce([[]]); // getPage for ZENITH (no match)
      mockDb.query.mockResolvedValueOnce([[]]); // exact title match
      mockDb.create.mockResolvedValueOnce([{ id: "wiki_link:1" }]);
      mockDb.create.mockResolvedValueOnce([{ id: "wiki_ingest_log:1" }]);

      const result = await engine.ingest("docs", "apps/docs/architecture.md", [
        {
          slug: "new-page",
          type: "concept",
          title: "New Page",
          compiled_truth: "ZENITH owns this architecture.",
          confidence: 0.8,
          sources: ["apps/docs/architecture.md"],
        },
      ]);

      expect(result.created).toContain("new-page");
      expect(mockDb.create).toHaveBeenCalledWith("wiki_page", expect.any(Object));
    });
  });

  describe("Crystallization", () => {
    it("should crystallize into a new page", async () => {
      mockDb.query.mockResolvedValueOnce([[]]); // getPage returns null
      mockDb.create.mockResolvedValueOnce([
        {
          id: "wiki_page:crystallized-test",
          slug: "crystallized-test",
          title: "Crystallized: How does routing work?",
        },
      ]);

      const page = await engine.crystallize("crystallized-test", {
        question: "How does routing work?",
        findings: "The Router uses a scoring algorithm.",
        filesInvolved: ["packages/router/src/index.ts"],
        lessons: ["Always validate input"],
      });

      expect(page).toBeDefined();
      expect(mockDb.create).toHaveBeenCalledWith(
        "wiki_page",
        expect.objectContaining({
          slug: "crystallized-test",
          title: "Crystallized: How does routing work?",
        })
      );
    });
  });
});
