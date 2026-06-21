import { Hono } from "hono";
import type postgres from "postgres";
import { getProject, getWikiPage, getWikiPages, listProjects } from "../db/index.js";

export function createPublicRoutes(sql: postgres.Sql) {
  const app = new Hono();

  app.get("/health", (c) => c.json({ ok: true, version: "0.1.0" }));

  app.get("/api/repos", async (c) => {
    const projects = await listProjects(sql);
    const pagesPerProject = await Promise.all(
      projects.map(async (p) => {
        const pages = await getWikiPages(sql, p.id);
        return {
          id: p.id,
          name: p.name,
          path: p.remote_url ?? p.id,
          storagePath: p.id,
          remoteUrl: p.remote_url,
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
    const tree = (meta.moduleTree ?? []) as Array<{
      name: string;
      slug: string;
      files?: string[];
      children?: unknown[];
    }>;

    interface GraphNode {
      id: string;
      label: string;
      type: "module";
    }
    interface GraphEdge {
      id: string;
      source: string;
      target: string;
      type: "parent" | "reference";
    }

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const seen = new Set<string>();

    function walk(node: (typeof tree)[number], parentId?: string) {
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
      for (const child of (node.children ?? []) as typeof tree) {
        walk(child, node.slug);
      }
    }
    for (const root of tree) {
      walk(root);
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        if (a.id.includes(b.id) || b.id.includes(a.id)) {
          edges.push({
            id: `${a.id}<->${b.id}`,
            source: a.id,
            target: b.id,
            type: "reference",
          });
        }
      }
    }

    return c.json({ nodes, edges });
  });

  app.get("/api/repo/:id/process", async (c) => {
    return c.json([]);
  });

  app.get("/api/repo/:id/symbol/:symbol", async (c) => {
    return c.json(null, 404);
  });

  app.get("/api/repo/:id/impact", async (c) => {
    return c.json([]);
  });

  return app;
}
