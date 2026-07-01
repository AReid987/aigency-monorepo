export interface ModuleNode {
  name: string;
  slug: string;
  files: string[];
  children?: ModuleNode[];
}

export interface MetaData {
  fromCommit: string;
  generatedAt: string;
  model: string;
  moduleFiles: Record<string, string[]>;
}

export interface WikiPage {
  slug: string;
  title: string;
  markdown: string;
  generatedAt?: string;
}

export interface ProjectInfo {
  id: string;
  name: string;
  path: string;
  storagePath: string;
  remoteUrl?: string;
  indexedAt: string;
  lastCommit: string;
  stats?: {
    files?: number;
    nodes?: number;
    edges?: number;
    communities?: number;
    processes?: number;
    embeddings?: number;
  };
  hasData: boolean;
  wikiCount: number;
}

interface ProjectManifest {
  projects: ProjectInfo[];
}
const REPOATLAS_URL =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_REPOATLAS_API_URL ??
      process.env.NEXT_PUBLIC_GITNEXUS_BACKEND_URL ??
      "https://repoatlas-server.onrender.com")
    : "https://repoatlas-server.onrender.com";

const metaCache = new Map<string, MetaData>();
const treeCache = new Map<string, ModuleNode[]>();
const pagesCache = new Map<string, Map<string, WikiPage>>();

function wikiBase(repoId: string): string {
  return `/.gitnexus/repos/${encodeURIComponent(repoId)}/wiki`;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function titleFromSlug(slug: string): string {
  return slug
    .replace(/^other-/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function loadStaticManifest(): Promise<ProjectManifest> {
  const res = await fetch("/.gitnexus/projects.json");
  if (!res.ok) {
    return { projects: [] };
  }
  return (await res.json()) as ProjectManifest;
}

export async function loadProjectsManifest(): Promise<
  ProjectManifest & { source: "backend" | "static" }
> {
  if (REPOATLAS_URL) {
    try {
      const res = await fetch(`${REPOATLAS_URL}/api/repos`);
      if (res.ok) {
        const fromBackend = (await res.json()) as ProjectManifest;
        if (fromBackend.projects.some((p) => p.hasData)) {
          return { ...fromBackend, source: "backend" };
        }
        // Backend is alive but empty — fall through to static bundle so the
        // deployed UI is never stuck on "No projects".
      }
    } catch {
      // fall through to static manifest
    }
  }

  const fromStatic = await loadStaticManifest();
  return { ...fromStatic, source: "static" };
}

export async function loadRepoMeta(repoId: string): Promise<MetaData> {
  const cached = metaCache.get(repoId);
  if (cached) {
    return cached;
  }

  if (REPOATLAS_URL) {
    const res = await fetch(`${REPOATLAS_URL}/api/repo/${encodeURIComponent(repoId)}/meta`);
    if (res.ok) {
      const meta = (await res.json()) as MetaData;
      metaCache.set(repoId, meta);
      return meta;
    }
  }

  const res = await fetch(`${wikiBase(repoId)}/meta.json`);
  if (!res.ok) {
    throw new Error(`Failed to load meta.json for ${repoId}`);
  }
  const meta = (await res.json()) as MetaData;
  metaCache.set(repoId, meta);
  return meta;
}

export async function loadRepoTree(repoId: string): Promise<ModuleNode[]> {
  const cached = treeCache.get(repoId);
  if (cached) {
    return cached;
  }

  if (REPOATLAS_URL) {
    const res = await fetch(`${REPOATLAS_URL}/api/repo/${encodeURIComponent(repoId)}/tree`);
    if (res.ok) {
      const tree = (await res.json()) as ModuleNode[];
      treeCache.set(repoId, tree);
      return tree;
    }
  }

  const res = await fetch(`${wikiBase(repoId)}/module_tree.json`);
  if (!res.ok) {
    throw new Error(`Failed to load module_tree.json for ${repoId}`);
  }
  const tree = (await res.json()) as ModuleNode[];
  treeCache.set(repoId, tree);
  return tree;
}

export async function loadRepoWikiPage(repoId: string, slug: string): Promise<WikiPage | null> {
  let repoCache = pagesCache.get(repoId);
  if (!repoCache) {
    repoCache = new Map();
    pagesCache.set(repoId, repoCache);
  }
  const cached = repoCache.get(slug);
  if (cached) {
    return cached;
  }

  if (REPOATLAS_URL) {
    const res = await fetch(
      `${REPOATLAS_URL}/api/repo/${encodeURIComponent(repoId)}/wiki/${encodeURIComponent(slug)}`
    );
    if (res.ok) {
      const page = (await res.json()) as WikiPage;
      repoCache.set(slug, page);
      return page;
    }
  }

  const res = await fetch(`${wikiBase(repoId)}/${encodeURIComponent(slug)}.md`);
  if (!res.ok) {
    return null;
  }
  const markdown = await res.text();
  const page: WikiPage = { slug, title: titleFromSlug(slug), markdown };
  repoCache.set(slug, page);
  return page;
}

export async function loadAllRepoWikiPages(repoId: string): Promise<WikiPage[]> {
  if (REPOATLAS_URL) {
    const res = await fetch(`${REPOATLAS_URL}/api/repo/${encodeURIComponent(repoId)}/wiki`);
    if (res.ok) {
      return (await res.json()) as WikiPage[];
    }
  }

  const tree = await loadRepoTree(repoId);
  const slugs = collectSlugs(tree);
  const pages = await Promise.all(slugs.map((s) => loadRepoWikiPage(repoId, s)));
  return pages.filter(Boolean) as WikiPage[];
}

function collectSlugs(nodes: ModuleNode[]): string[] {
  const out: string[] = [];
  for (const n of nodes) {
    out.push(n.slug);
    if (n.children) {
      out.push(...collectSlugs(n.children));
    }
  }
  return out;
}

function collectFiles(n: ModuleNode): string[] {
  const own = n.files ?? [];
  const child = (n.children ?? []).flatMap(collectFiles);
  return [...own, ...child];
}

// Aigency OKLCH semantic signal colors — resolved from design tokens at runtime.
// Using CSS variable strings lets canvas.css/design-tokens.css drive the palette,
// so category colors have semantic meaning and stay consistent across the UI.
const AIGENCY_AGENT: Record<string, string> = {
  zenith: "var(--aig-signal-conditional)",
  cipher: "var(--aig-signal-go)",
  echo: "var(--aig-signal-avoid)",
  vector: "var(--aig-signal-highlight)",
  atlas: "var(--aig-signal-conditional)",
  oracle: "var(--aig-signal-highlight)",
  librarian: "var(--aig-signal-conditional)",
  herald: "var(--aig-signal-conditional)",
  iris: "var(--aig-signal-highlight)",
  compass: "var(--aig-signal-go)",
  architect: "var(--aig-signal-conditional)",
};

export function getAgentColor(name: string): string {
  const key = slugify(name);
  return AIGENCY_AGENT[key] || "var(--aig-foreground-muted)";
}

export function getCategoryColor(cat: ReturnType<typeof getModuleCategory>): string {
  return {
    package: "var(--aig-signal-highlight)",
    app: "var(--aig-signal-conditional)",
    agent: "var(--aig-signal-go)",
    other: "var(--aig-foreground-muted)",
  }[cat];
}

export function getCategorySignal(cat: ReturnType<typeof getModuleCategory>): string {
  return {
    package: "highlight",
    app: "conditional",
    agent: "go",
    other: "muted",
  }[cat];
}

export function getRiskColor(risk: "low" | "medium" | "high"): string {
  return {
    low: "var(--aig-signal-go)",
    medium: "var(--aig-signal-conditional)",
    high: "var(--aig-signal-avoid)",
  }[risk];
}

export function getModuleCategory(slug: string): "package" | "app" | "agent" | "other" {
  if (slug.startsWith("other-apps-")) {
    return "app";
  }
  if (slug.startsWith("other-agents-")) {
    return "agent";
  }
  if (slug.endsWith("-worker")) {
    return "agent";
  }
  if (
    ["agent-core", "design-tokens", "honcho", "membrain", "surreal", "vault-tools"].includes(slug)
  ) {
    return "package";
  }
  if (["membrane", "router", "telos", "contracts", "librarian", "oracle"].includes(slug)) {
    return "app";
  }
  if (["dashboard-ui", "terminal-ui-tui"].includes(slug)) {
    return "app";
  }
  if (slug === "shared-utilities") {
    return "package";
  }
  return "other";
}

export function getCategoryLabel(cat: ReturnType<typeof getModuleCategory>): string {
  return { package: "Package", app: "App", agent: "Agent", other: "Other" }[cat];
}

export interface StaticImpactEntry {
  file: string;
  symbol: string;
  risk: "low" | "medium" | "high";
  reason: string;
}

export interface StaticSymbolContext {
  name: string;
  file: string;
  lines: [number, number];
  references: { file: string; line: number }[];
  summary: string;
}

function flattenModuleTree(nodes: ModuleNode[]): ModuleNode[] {
  const out: ModuleNode[] = [];
  for (const n of nodes) {
    out.push(n);
    if (n.children) {
      out.push(...flattenModuleTree(n.children));
    }
  }
  return out;
}

function normalizeStaticFiles(
  tree: ModuleNode[],
  moduleFiles: Record<string, string[]> = {}
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const n of flattenModuleTree(tree)) {
    const byName = moduleFiles[n.name];
    const bySlug = moduleFiles[n.slug];
    const bySlugName = moduleFiles[slugify(n.name)];
    const own = n.files ?? [];
    const child = (n.children ?? []).flatMap(collectFiles);
    map.set(n.slug, byName ?? bySlug ?? bySlugName ?? [...own, ...child]);
  }
  return map;
}

function buildStaticEdges(tree: ModuleNode[], moduleFiles: Record<string, string[]> = {}) {
  const filesByModule = normalizeStaticFiles(tree, moduleFiles);
  const nodes = flattenModuleTree(tree);
  const edges: { source: string; target: string; type: "parent" | "import" | "reference" }[] = [];
  const pairKey = (a: string, b: string) => (a < b ? `${a}<->${b}` : `${b}<->${a}`);
  const seenPairs = new Set<string>();

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const key = pairKey(a.slug, b.slug);
      if (seenPairs.has(key)) {
        continue;
      }

      const filesA = filesByModule.get(a.slug) ?? [];
      const filesB = filesByModule.get(b.slug) ?? [];
      const nameA = a.slug.replace(/^other-/, "");
      const nameB = b.slug.replace(/^other-/, "");

      const aUsesB = filesA.some((f) => f.toLowerCase().includes(nameB) && nameB.length > 2);
      const bUsesA = filesB.some((f) => f.toLowerCase().includes(nameA) && nameA.length > 2);

      if (aUsesB || bUsesA) {
        seenPairs.add(key);
        edges.push({
          source: aUsesB ? a.slug : b.slug,
          target: aUsesB ? b.slug : a.slug,
          type: aUsesB && bUsesA ? "reference" : "import",
        });
      }
    }
  }

  return { nodes, edges };
}

export function computeStaticImpact(
  symbol: string,
  tree: ModuleNode[],
  moduleFiles: Record<string, string[]> = {}
): StaticImpactEntry[] {
  if (!symbol || !tree.length) {
    return [];
  }
  const { nodes, edges } = buildStaticEdges(tree, moduleFiles);
  const target = nodes.find(
    (n) =>
      n.slug === symbol ||
      slugify(n.name) === slugify(symbol) ||
      n.name.toLowerCase().includes(symbol.toLowerCase()) ||
      symbol.toLowerCase().includes(n.slug)
  );
  if (!target) {
    return [];
  }

  const targetSlug = target.slug;
  const targetName = target.name;
  const impacted = new Map<string, StaticImpactEntry & { distance: number }>();

  function visit(nodeId: string, distance: number, visited: Set<string>) {
    if (distance > 2 || visited.has(nodeId)) {
      return;
    }
    visited.add(nodeId);
    for (const edge of edges) {
      if (edge.source === nodeId) {
        const neighbor = edge.target;
        if (neighbor === targetSlug) {
          continue;
        }
        const reason =
          edge.type === "import"
            ? `Imports / uses ${targetName}`
            : `Bidirectional references with ${targetName}`;
        const existing = impacted.get(neighbor);
        if (!existing || distance < existing.distance) {
          const label = nodes.find((n) => n.slug === neighbor)?.name ?? neighbor;
          impacted.set(neighbor, {
            file: `${neighbor}.md`,
            symbol: label,
            risk: distance === 1 ? "high" : "medium",
            reason,
            distance,
          });
        }
        visit(neighbor, distance + 1, new Set(visited));
      } else if (edge.target === nodeId && edge.type === "reference") {
        const neighbor = edge.source;
        if (neighbor === targetSlug) {
          continue;
        }
        const label = nodes.find((n) => n.slug === neighbor)?.name ?? neighbor;
        impacted.set(neighbor, {
          file: `${neighbor}.md`,
          symbol: label,
          risk: distance === 1 ? "high" : "medium",
          reason: `Bidirectional references with ${targetName}`,
          distance,
        });
        visit(neighbor, distance + 1, new Set(visited));
      }
    }
  }

  visit(targetSlug, 1, new Set());

  return Array.from(impacted.values()).sort((a, b) => a.distance - b.distance);
}

export function computeStaticSymbolContext(
  symbol: string,
  pages: WikiPage[]
): StaticSymbolContext | null {
  if (!symbol || pages.length === 0) {
    return null;
  }
  const q = symbol.toLowerCase();
  const matches = pages.filter(
    (p) =>
      p.slug.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.markdown.toLowerCase().includes(q)
  );
  if (matches.length === 0) {
    return null;
  }
  const best = matches[0];
  const references = matches.slice(1, 6).map((p) => ({ file: `${p.slug}.md`, line: 1 }));
  return {
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
  };
}
