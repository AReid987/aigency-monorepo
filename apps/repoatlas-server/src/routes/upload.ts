import { Hono } from "hono";
import type postgres from "postgres";
import { randomUUID } from "node:crypto";
import { createSyncJob, finishSyncJob, getProject, upsertProject } from "../db/index.js";
import { ingestGitnexusTarball } from "../lib/extract.js";
import { config } from "../lib/config.js";

function bearerToken(c: { req: { header(name: string): string | undefined } }): string | undefined {
  const auth = c.req.header("Authorization") ?? "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1];
}

export function createUploadRoutes(sql: postgres.Sql) {
  const app = new Hono();

  app.use("/api/projects/*", async (c, next) => {
    if (bearerToken(c) !== config.apiToken) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    return next();
  });

  app.post("/api/projects", async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const id = typeof body.id === "string" && body.id.length > 0 ? body.id : randomUUID();
    const name = typeof body.name === "string" && body.name.length > 0 ? body.name : id;
    const remoteUrl = typeof body.remoteUrl === "string" ? body.remoteUrl : null;

    await upsertProject(sql, {
      id,
      name,
      remote_url: remoteUrl,
      last_commit: null,
      indexed_at: new Date(),
      meta: {},
      stats: {},
    });

    return c.json({ id, name }, 201);
  });

  app.post("/api/projects/:id/sync", async (c) => {
    const id = c.req.param("id");
    const existing = await getProject(sql, id);
    if (!existing) {
      return c.json({ error: "Project not found. Create it first via POST /api/projects" }, 404);
    }

    const form = await c.req.formData();
    const file = form.get("tarball");
    if (!(file instanceof File)) {
      return c.json({ error: "Missing tarball field" }, 400);
    }

    const jobId = await createSyncJob(sql, id, "running", { source: "upload", filename: file.name });

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await ingestGitnexusTarball(sql, id, buffer);
      await finishSyncJob(sql, jobId, "success", result);
      return c.json({ ok: true, projectId: id, ...result });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await finishSyncJob(sql, jobId, "failed", {}, message);
      return c.json({ error: message }, 500);
    }
  });

  return app;
}
