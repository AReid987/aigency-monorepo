#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface RegistryEntry {
  name: string;
  path: string;
  storagePath: string;
  /** Committed data directory relative to this script for CI/cloud builds. */
  dataPath?: string;
  indexedAt: string;
  lastCommit: string;
  remoteUrl?: string;
  stats?: {
    files?: number;
    nodes?: number;
    edges?: number;
    communities?: number;
    processes?: number;
    embeddings?: number;
  };
}

interface ProjectInfo {
  id: string;
  name: string;
  path: string;
  storagePath: string;
  remoteUrl?: string;
  indexedAt: string;
  lastCommit: string;
  stats: RegistryEntry["stats"];
  hasData: boolean;
  wikiCount: number;
}

interface BackendProject {
  id: string;
  name: string;
  path?: string;
  storagePath?: string;
  remoteUrl?: string;
  indexedAt?: string;
  lastCommit?: string;
  stats?: RegistryEntry["stats"];
  hasData?: boolean;
  wikiCount?: number;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function copyRecursive(src: string, dest: string) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      // Skip macOS metadata files and the static single-file viewer's index.html
      // (we only need the data files, not the standalone viewer).
      if (entry.name === ".DS_Store" || entry.name === "index.html") {
        continue;
      }
      writeFileSync(destPath, readFileSync(srcPath));
    }
  }
}

async function fetchBackendProjects(): Promise<ProjectInfo[]> {
  const apiUrl =
    process.env.NEXT_PUBLIC_REPOATLAS_API_URL ??
    process.env.NEXT_PUBLIC_GITNEXUS_BACKEND_URL ??
    null;
  if (!apiUrl) {
    return [];
  }

  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, "")}/api/repos`);
    if (!res.ok) {
      console.warn(`[bundle-registry] Backend returned ${res.status}; skipping backend merge`);
      return [];
    }
    const json = (await res.json()) as { projects?: BackendProject[] };
    return (json.projects ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      path: p.path ?? p.id,
      storagePath: p.storagePath ?? p.id,
      remoteUrl: p.remoteUrl,
      indexedAt: p.indexedAt ?? new Date().toISOString(),
      lastCommit: p.lastCommit ?? "unknown",
      stats: p.stats ?? {},
      hasData: p.hasData ?? true,
      wikiCount: p.wikiCount ?? 0,
    }));
  } catch (err) {
    console.warn(
      `[bundle-registry] Failed to fetch backend projects: ${err instanceof Error ? err.message : String(err)}`
    );
    return [];
  }
}

async function main() {
  const registryPath = process.env.GITNEXUS_REGISTRY_PATH
    ? resolve(process.env.GITNEXUS_REGISTRY_PATH)
    : join(homedir(), ".gitnexus", "registry.json");

  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const outDir = resolve(scriptDir, "../public/.gitnexus");
  const reposDir = join(outDir, "repos");
  mkdirSync(outDir, { recursive: true });
  rmSync(reposDir, { recursive: true, force: true });
  mkdirSync(reposDir, { recursive: true });

  let entries: RegistryEntry[] = [];

  if (!existsSync(registryPath)) {
    console.warn(`[bundle-registry] Registry not found at ${registryPath}`);
  } else {
    const raw = readFileSync(registryPath, "utf-8");
    try {
      entries = JSON.parse(raw);
    } catch {
      console.error("[bundle-registry] Failed to parse registry.json");
      process.exit(1);
    }
  }

  // Deduplicate by slugified id, preferring the richer index.
  const byId = new Map<string, RegistryEntry[]>();
  for (const entry of entries) {
    const id = slugify(entry.name);
    const group = byId.get(id) ?? [];
    group.push(entry);
    byId.set(id, group);
  }

  const projects: ProjectInfo[] = [];

  for (const [id, group] of byId) {
    const picked = group.sort((a, b) => (b.stats?.files ?? 0) - (a.stats?.files ?? 0))[0];

    // Prefer a live local index; fall back to committed data so cloud builds
    // still ship a working static bundle when absolute storagePath does not exist.
    let sourceDir = picked.storagePath;
    if (!existsSync(join(sourceDir, "wiki", "module_tree.json")) && picked.dataPath) {
      const committed = resolve(scriptDir, picked.dataPath);
      if (existsSync(join(committed, "wiki", "module_tree.json"))) {
        sourceDir = committed;
      }
    }
    const wikiDir = join(sourceDir, "wiki");

    if (!existsSync(join(wikiDir, "module_tree.json"))) {
      console.warn(`[bundle-registry] Skipping ${picked.name}: no wiki data at ${sourceDir}`);
      continue;
    }

    if ((picked.stats?.files ?? 0) < 5) {
      continue;
    }

    const destDir = join(reposDir, id);
    mkdirSync(destDir, { recursive: true });

    // Copy wiki data.
    copyRecursive(wikiDir, join(destDir, "wiki"));

    // Copy top-level repo meta for stats.
    const repoMeta = join(sourceDir, "meta.json");
    if (existsSync(repoMeta)) {
      writeFileSync(join(destDir, "repo-meta.json"), readFileSync(repoMeta));
    }

    const wikiCount = readdirSync(join(destDir, "wiki")).filter((f) => f.endsWith(".md")).length;

    projects.push({
      id,
      name: picked.name,
      path: picked.path,
      storagePath: picked.storagePath,
      remoteUrl: picked.remoteUrl,
      indexedAt: picked.indexedAt,
      lastCommit: picked.lastCommit,
      stats: picked.stats,
      hasData: true,
      wikiCount,
    });

    if (group.length > 1) {
      const _skipped = group
        .filter((e) => e.path !== picked.path)
        .map((e) => e.path)
        .join(", ");
    }
  }

  // Merge in backend metadata (especially remoteUrl) when explicitly requested.
  // Without this flag the static bundle contains exactly what the registry
  // declares, avoiding stale projects from an earlier backend ingest.
  if (process.env.REPOATLAS_BUNDLE_BACKEND === "1") {
    const backendProjects = await fetchBackendProjects();
    const projectMap = new Map(projects.map((p) => [p.id, p]));
    for (const backend of backendProjects) {
      const existing = projectMap.get(backend.id);
      if (existing) {
        if (!existing.remoteUrl && backend.remoteUrl) {
          existing.remoteUrl = backend.remoteUrl;
        }
        if (!existing.hasData && backend.hasData) {
          existing.hasData = backend.hasData;
        }
      } else {
        projectMap.set(backend.id, backend);
        projects.push(backend);
      }
    }
  }

  writeFileSync(join(outDir, "projects.json"), JSON.stringify({ projects }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
