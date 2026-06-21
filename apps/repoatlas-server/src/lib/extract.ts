import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, extname, join, relative } from "node:path";
import type postgres from "postgres";
import { x } from "tar";
import {
  type DbWikiPage,
  deleteWikiPagesNotIn,
  upsertProject,
  upsertWikiPage,
} from "../db/index.js";

export interface GitnexusMeta {
  repoPath?: string;
  remoteUrl?: string;
  lastCommit?: string;
  indexedAt?: string;
  stats?: Record<string, unknown>;
}

export function extractTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1].trim() ?? "Untitled";
}

export async function ingestGitnexusTarball(
  sql: postgres.Sql,
  projectId: string,
  tarballBuffer: Buffer
): Promise<{ projectName: string; wikiCount: number }> {
  const extractDir = mkdtempSync(join(tmpdir(), "repoatlas-"));

  try {
    const tarPath = join(extractDir, "upload.tar.gz");
    writeFileSync(tarPath, tarballBuffer);

    const gitnexusDir = join(extractDir, "gitnexus");
    mkdirSync(gitnexusDir, { recursive: true });
    await x({ file: tarPath, cwd: gitnexusDir, strip: 1 });

    const meta = readJson<GitnexusMeta>(join(gitnexusDir, "meta.json")) ?? {};
    const wikiDir = join(gitnexusDir, "wiki");
    const wikiMeta = readJson<Record<string, unknown>>(join(wikiDir, "meta.json")) ?? {};
    const moduleTreePath = join(wikiDir, "module_tree.json");
    const moduleTree = readJson<unknown>(moduleTreePath);
    const mergedMeta = { ...wikiMeta, ...(moduleTree ? { moduleTree } : {}) };

    const projectName = meta.repoPath ? basename(meta.repoPath) : projectId;

    await upsertProject(sql, {
      id: projectId,
      name: projectName,
      remote_url: meta.remoteUrl ?? null,
      last_commit: meta.lastCommit ?? null,
      indexed_at: meta.indexedAt ? new Date(meta.indexedAt) : new Date(),
      meta: mergedMeta as Record<string, unknown>,
      stats: (meta.stats ?? {}) as Record<string, unknown>,
    });

    const pages: DbWikiPage[] = [];
    if (exists(wikiDir)) {
      for (const file of walkMarkdown(wikiDir)) {
        const rel = relative(wikiDir, file);
        const slug = rel.replace(/\.md$/i, "");
        if (slug === "index" || slug === "meta") {
          continue;
        }
        const markdown = readFileSync(file, "utf-8");
        pages.push({
          slug: slug.replace(/\\/g, "/"),
          title: extractTitle(markdown),
          markdown,
          generated_at: meta.indexedAt ? new Date(meta.indexedAt) : new Date(),
        });
      }
    }

    for (const page of pages) {
      await upsertWikiPage(sql, projectId, page);
    }

    await deleteWikiPagesNotIn(
      sql,
      projectId,
      pages.map((p) => p.slug)
    );

    return { projectName, wikiCount: pages.length };
  } finally {
    rmSync(extractDir, { recursive: true, force: true });
  }
}

function readJson<T>(path: string): T | null {
  try {
    const raw = readFileSync(path, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function exists(path: string): boolean {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
}

function* walkMarkdown(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkMarkdown(path);
    } else if (entry.isFile() && extname(entry.name).toLowerCase() === ".md") {
      yield path;
    }
  }
}
