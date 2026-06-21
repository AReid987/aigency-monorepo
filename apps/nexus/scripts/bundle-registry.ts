#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface RegistryEntry {
  name: string;
  path: string;
  storagePath: string;
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
      if (entry.name === ".DS_Store" || entry.name === "index.html") continue;
      writeFileSync(destPath, readFileSync(srcPath));
    }
  }
}

function main() {
  const registryPath = process.env.GITNEXUS_REGISTRY_PATH
    ? resolve(process.env.GITNEXUS_REGISTRY_PATH)
    : join(homedir(), ".gitnexus", "registry.json");

  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const outDir = resolve(scriptDir, "../public/.gitnexus");
  const reposDir = join(outDir, "repos");
  mkdirSync(outDir, { recursive: true });
  mkdirSync(reposDir, { recursive: true });

  if (!existsSync(registryPath)) {
    console.warn(`[bundle-registry] Registry not found at ${registryPath}`);
    writeFileSync(join(outDir, "projects.json"), JSON.stringify({ projects: [] }, null, 2));
    return;
  }

  const raw = readFileSync(registryPath, "utf-8");
  let entries: RegistryEntry[];
  try {
    entries = JSON.parse(raw);
  } catch {
    console.error("[bundle-registry] Failed to parse registry.json");
    process.exit(1);
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
    const wikiDir = join(picked.storagePath, "wiki");

    if (!existsSync(join(wikiDir, "module_tree.json"))) {
      console.log(`[bundle-registry] skipping ${id}: no wiki/module_tree.json`);
      continue;
    }

    if ((picked.stats?.files ?? 0) < 5) {
      console.log(`[bundle-registry] skipping ${id}: only ${picked.stats?.files ?? 0} files`);
      continue;
    }

    const destDir = join(reposDir, id);
    mkdirSync(destDir, { recursive: true });

    // Copy wiki data.
    copyRecursive(wikiDir, join(destDir, "wiki"));

    // Copy top-level repo meta for stats.
    const repoMeta = join(picked.storagePath, "meta.json");
    if (existsSync(repoMeta)) {
      writeFileSync(join(destDir, "repo-meta.json"), readFileSync(repoMeta));
    }

    const wikiCount = readdirSync(join(destDir, "wiki"))
      .filter((f) => f.endsWith(".md")).length;

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
      const skipped = group
        .filter((e) => e.path !== picked.path)
        .map((e) => e.path)
        .join(", ");
      console.log(`[bundle-registry] deduped ${id}: kept ${picked.path}, skipped ${skipped}`);
    } else {
      console.log(`[bundle-registry] bundled ${id} (${wikiCount} wiki pages)`);
    }
  }

  writeFileSync(
    join(outDir, "projects.json"),
    JSON.stringify({ projects }, null, 2)
  );

  console.log(`[bundle-registry] ${projects.length} project(s) bundled to ${outDir}`);
}

main();
