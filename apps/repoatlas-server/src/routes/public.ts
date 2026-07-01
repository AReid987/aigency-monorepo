import { Hono } from "hono";
import type postgres from "postgres";
import { getProject, getWikiPage, getWikiPages, listProjects } from "../db/index.js";

interface ModuleTreeNode {
  name: string;
  slug: string;
  files?: string[];
  children?: ModuleTreeNode[];
}

interface GraphNode {
  id: string;
  label: string;
  type: "module";
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: "parent" | "import" | "reference";
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function collectFiles(n: ModuleTreeNode): string[] {
  const own = n.files ?? [];
  const child = (n.children ?? []).flatMap(collectFiles);
  return [...own, ...child];
}

function flattenTree(nodes: ModuleTreeNode[]): ModuleTreeNode[] {
  const out: ModuleTreeNode[] = [];
  for (const n of nodes) {
    out.push(n);
    if (n.children) {
      out.push(...flattenTree(n.children));
    }
  }
  return out;
}

function normalizeModuleFiles(
  tree: ModuleTreeNode[],
  moduleFiles: Record<string, string[]> = {}
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const n of flattenTree(tree)) {
    const byName = moduleFiles[n.name];
    const bySlug = moduleFiles[n.slug];
    const bySlugName = moduleFiles[slugify(n.name)];
    map.set(n.slug, byName ?? bySlug ?? bySlugName ?? collectFiles(n));
  }
  return map;
}

function buildGraph(
  tree: ModuleTreeNode[],
  moduleFiles: Record<string, string[]> = {}
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  const filesByModule = normalizeModuleFiles(tree, moduleFiles);

  function walk(node: ModuleTreeNode, parentId?: string) {
    if (seen.has(node.slug)) {
      return;
    }
    seen.add(node.slug);
    nodes.push({ id: node.slug, label: node.name, type: "module" });
    if (parentId) {
      edges.push({
        id: `${parentId}->${node.slug}`,
        source: parentId,
        target: node.slug,
        type: "parent",
      });
    }
    for (const child of node.children ?? []) {
      walk(child, node.slug);
    }
  }
  for (const root of tree) {
    walk(root);
  }

  // Lightweight cross-module relationship inference from shared file-name tokens.
  const moduleIds = nodes.map((n) => n.id);
  const pairKey = (a: string, b: string) => (a < b ? `${a}<->${b}` : `${b}<->${a}`);
  const seenPairs = new Set<string>();

  for (let i = 0; i < moduleIds.length; i++) {
    for (let j = i + 1; j < moduleIds.length; j++) {
      const a = moduleIds[i];
      const b = moduleIds[j];
      const key = pairKey(a, b);
      if (seenPairs.has(key)) {
        continue;
      }

      const filesA = filesByModule.get(a) ?? [];
      const filesB = filesByModule.get(b) ?? [];
      const nameA = a.replace(/^other-/, "");
      const nameB = b.replace(/^other-/, "");

      const aUsesB = filesA.some((f) => f.toLowerCase().includes(nameB) && nameB.length > 2);
      const bUsesA = filesB.some((f) => f.toLowerCase().includes(nameA) && nameA.length > 2);

      if (aUsesB || bUsesA) {
        seenPairs.add(key);
        edges.push({
          id: `${aUsesB ? a : b}->${aUsesB ? b : a}`,
          source: aUsesB ? a : b,
          target: aUsesB ? b : a,
          type: aUsesB && bUsesA ? "reference" : "import",
        });
      }
    }
  }

  return { nodes, edges };
}

export function createPublicRoutes(sql: postgres.Sql) {
  const app = new Hono();

  app.get("/health", (c) => c.json({ ok: true, version: "0.1.0" }));

  app.get("/api/repos", async (c) => {
    const projects = await listProjects(sql);
    const pagesPerProject = await Promise.all(
      projects.map(async (p) => {
        const pages = await getWikiPages(sql, p.id);
        const meta = (p.meta ?? {}) as Record<string, unknown>;
        const remoteUrl =
          p.remote_url ?? (typeof meta.remoteUrl === "string" ? meta.remoteUrl : undefined);
        return {
          id: p.id,
          name: p.name,
          path: remoteUrl ?? p.id,
          storagePath: p.id,
          remoteUrl,
          indexedAt: p.indexed_at?.toISOString() ?? new Date().toISOString(),
          lastCommit: p.last_commit ?? "unknown",
          stats: p.stats,
          hasData: pages.length > 0,
          wikiCount: pages.length,
        };
      })
    );
    return c.json({ projects: pagesPerProject });
  });

  app.get("/api/repo/:id/meta", async (c) => {
    const id = c.req.param("id");
    const project = await getProject(sql, id);
    if (!project) {
      return c.json({ error: "Not found" }, 404);
    }
    const meta = (project.meta ?? {}) as Record<string, unknown>;
    return c.json({
      fromCommit: meta.fromCommit ?? project.last_commit ?? "unknown",
      generatedAt:
        meta.generatedAt ?? project.indexed_at?.toISOString() ?? new Date().toISOString(),
      model: meta.model ?? "unknown",
      moduleFiles: meta.moduleFiles ?? {},
      ...meta,
    });
  });

  app.get("/api/repo/:id/tree", async (c) => {
    const id = c.req.param("id");
    const project = await getProject(sql, id);
    if (!project) {
      return c.json({ error: "Not found" }, 404);
    }
    const meta = (project.meta ?? {}) as Record<string, unknown>;
    const tree = meta.moduleTree ?? [];
    return c.json(tree);
  });

  app.get("/api/repo/:id/wiki", async (c) => {
    const id = c.req.param("id");
    const pages = await getWikiPages(sql, id);
    return c.json(pages);
  });

  app.get("/api/repo/:id/wiki/:slug", async (c) => {
    const id = c.req.param("id");
    const slug = c.req.param("slug");
    const page = await getWikiPage(sql, id, slug);
    if (!page) {
      return c.json({ error: "Not found" }, 404);
    }
    return c.json(page);
  });

  app.get("/api/repo/:id/search", async (c) => {
    const id = c.req.param("id");
    const query = c.req.query("q")?.toLowerCase() ?? "";
    const pages = await getWikiPages(sql, id);
    const filtered = pages
      .filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.slug.toLowerCase().includes(query) ||
          p.markdown.toLowerCase().includes(query)
      )
      .slice(0, 30)
      .map((p) => ({
        slug: p.slug,
        title: p.title,
        excerpt: p.markdown.slice(0, 200).replace(/\n/g, " "),
        score: 0,
      }));
    return c.json(filtered);
  });

  app.get("/api/repo/:id/graph", async (c) => {
    const id = c.req.param("id");
    const project = await getProject(sql, id);
    if (!project) {
      return c.json({ error: "Not found" }, 404);
    }
    const meta = (project.meta ?? {}) as Record<string, unknown>;
    const tree = (meta.moduleTree ?? []) as ModuleTreeNode[];
    const moduleFiles = (meta.moduleFiles ?? {}) as Record<string, string[]>;
    return c.json(buildGraph(tree, moduleFiles));
  });

  app.get("/api/repo/:id/process", async (c) => {
    const id = c.req.param("id");
    const project = await getProject(sql, id);
    if (!project) {
      return c.json({ error: "Not found" }, 404);
    }
    const pages = await getWikiPages(sql, id);
    const meta = (project.meta ?? {}) as Record<string, unknown>;
    const tree = (meta.moduleTree ?? []) as ModuleTreeNode[];
    const moduleCount = flattenTree(tree).length;

    const steps = [
      {
        step: 1,
        title: "Repository Ingest",
        status: "done" as const,
        detail: `Indexed ${project.last_commit ?? "unknown commit"}`,
      },
      {
        step: 2,
        title: "Parse Modules",
        status: "done" as const,
        detail: `${moduleCount} modules parsed`,
      },
      {
        step: 3,
        title: "Build Graph",
        status: "done" as const,
        detail: "Module tree + inferred import/reference edges",
      },
      {
        step: 4,
        title: "Generate Wiki",
        status: pages.length > 0 ? ("done" as const) : ("error" as const),
        detail: `${pages.length} wiki pages available`,
      },
      {
        step: 5,
        title: "Impact Analysis",
        status: moduleCount > 1 ? ("done" as const) : ("pending" as const),
        detail: "Blast radius computed from graph edges",
      },
    ];
    return c.json(steps);
  });

  app.get("/api/repo/:id/symbol/:symbol", async (c) => {
    const id = c.req.param("id");
    const symbol = c.req.param("symbol");
    const project = await getProject(sql, id);
    if (!project) {
      return c.json({ error: "Not found" }, 404);
    }

    const pages = await getWikiPages(sql, id);
    const matches = pages.filter(
      (p) =>
        p.slug.toLowerCase().includes(symbol.toLowerCase()) ||
        p.title.toLowerCase().includes(symbol.toLowerCase()) ||
        p.markdown.toLowerCase().includes(symbol.toLowerCase())
    );

    if (matches.length === 0) {
      return c.json(null, 404);
    }

    const best = matches[0];
    const references = matches.slice(1, 6).map((p) => ({
      file: `${p.slug}.md`,
      line: 1,
    }));

    return c.json({
      name: best.title,
      file: `${best.slug}.md`,
      lines: [1, best.markdown.split("\n").length],
      references,
      summary:
        best.markdown
          .replace(/^#.+\n?/m, "")
          .replace(/\n+/g, " ")
          .slice(0, 240)
          .trim() || `Wiki page for ${best.title}`,
    });
  });

  app.get("/api/repo/:id/impact", async (c) => {
    const id = c.req.param("id");
    const symbol = c.req.query("symbol")?.toLowerCase() ?? "";
    const project = await getProject(sql, id);
    if (!project) {
      return c.json({ error: "Not found" }, 404);
    }

    const meta = (project.meta ?? {}) as Record<string, unknown>;
    const tree = (meta.moduleTree ?? []) as ModuleTreeNode[];
    const moduleFiles = (meta.moduleFiles ?? {}) as Record<string, string[]>;
    const graph = buildGraph(tree, moduleFiles);

    // Find the module most closely matching the symbol.
    const target = graph.nodes.find(
      (n) => n.id === symbol || n.label.toLowerCase().includes(symbol) || symbol.includes(n.id)
    );

    if (!target || symbol.length === 0) {
      return c.json([]);
    }

    const targetId = target.id;
    const targetLabel = target.label;
    const impacted = new Map<
      string,
      { file: string; symbol: string; reason: string; distance: number }
    >();

    function visit(nodeId: string, distance: number, visited: Set<string>) {
      if (distance > 2 || visited.has(nodeId)) {
        return;
      }
      visited.add(nodeId);
      for (const edge of graph.edges) {
        if (edge.source === nodeId) {
          const neighbor = edge.target;
          if (neighbor === targetId) {
            continue;
          }
          const reason =
            edge.type === "parent"
              ? `Child module of ${targetLabel}`
              : edge.type === "import"
                ? `Imports / uses ${targetLabel}`
                : `Bidirectional references with ${targetLabel}`;
          const existing = impacted.get(neighbor);
          if (!existing || distance < existing.distance) {
            const label = graph.nodes.find((n) => n.id === neighbor)?.label ?? neighbor;
            impacted.set(neighbor, {
              file: `${neighbor}.md`,
              symbol: label,
              reason,
              distance,
            });
          }
          visit(neighbor, distance + 1, new Set(visited));
        } else if (edge.target === nodeId && edge.type === "reference") {
          const neighbor = edge.source;
          if (neighbor === targetId) {
            continue;
          }
          const label = graph.nodes.find((n) => n.id === neighbor)?.label ?? neighbor;
          impacted.set(neighbor, {
            file: `${neighbor}.md`,
            symbol: label,
            reason: `Bidirectional references with ${targetLabel}`,
            distance,
          });
          visit(neighbor, distance + 1, new Set(visited));
        }
      }
    }

    visit(targetId, 1, new Set());

    const entries = Array.from(impacted.values())
      .sort((a, b) => a.distance - b.distance)
      .map((entry) => ({
        file: entry.file,
        symbol: entry.symbol,
        risk: entry.distance === 1 ? ("high" as const) : ("medium" as const),
        reason: entry.reason,
      }));

    return c.json(entries);
  });

  return app;
}
