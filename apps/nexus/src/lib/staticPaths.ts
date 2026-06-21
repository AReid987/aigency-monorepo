import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

interface ProjectManifest {
  projects: { id: string; hasData?: boolean }[];
}

interface ModuleNode {
  slug: string;
  children?: ModuleNode[];
}

function collectSlugs(nodes: ModuleNode[]): string[] {
  return nodes.flatMap((n) => [n.slug, ...collectSlugs(n.children ?? [])]);
}

export function getAllWikiSlugs(): string[] {
  const manifestPath = join(process.cwd(), "public", ".gitnexus", "projects.json");
  if (!existsSync(manifestPath)) return [];

  let manifest: ProjectManifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as ProjectManifest;
  } catch {
    return [];
  }

  const slugs = new Set<string>();
  for (const project of manifest.projects) {
    if (!project.hasData) continue;
    const treePath = join(process.cwd(), "public", ".gitnexus", "repos", project.id, "wiki", "module_tree.json");
    if (!existsSync(treePath)) continue;
    try {
      const tree = JSON.parse(readFileSync(treePath, "utf-8")) as ModuleNode[];
      for (const slug of collectSlugs(tree)) {
        slugs.add(slug);
      }
    } catch {
      // ignore malformed tree
    }
  }

  return Array.from(slugs);
}
