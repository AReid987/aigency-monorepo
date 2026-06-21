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
      null)
    : null;

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

export async function loadProjectsManifest(): Promise<ProjectManifest> {
  if (REPOATLAS_URL) {
    try {
      const res = await fetch(`${REPOATLAS_URL}/api/repos`);
      if (res.ok) {
        return (await res.json()) as ProjectManifest;
      }
    } catch {
      // fall through to static manifest
    }
  }

  const res = await fetch("/.gitnexus/projects.json");
  if (!res.ok) {
    return { projects: [] };
  }
  return (await res.json()) as ProjectManifest;
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

const AIGENCY_ACCENT = "var(--aig-accent)";
const AIGENCY_GO = "var(--aig-signal-go)";
const AIGENCY_CONDITIONAL = "var(--aig-signal-conditional)";
const AIGENCY_AVOID = "var(--aig-signal-avoid)";
const AIGENCY_HIGHLIGHT = "var(--aig-signal-highlight)";
const AIGENCY_MUTED = "var(--aig-foreground-muted)";

export function getAgentColor(name: string): string {
  const map: Record<string, string> = {
    zenith: AIGENCY_ACCENT,
    cipher: AIGENCY_GO,
    echo: AIGENCY_AVOID,
    vector: AIGENCY_HIGHLIGHT,
    atlas: AIGENCY_CONDITIONAL,
    oracle: AIGENCY_HIGHLIGHT,
    librarian: AIGENCY_CONDITIONAL,
    herald: AIGENCY_ACCENT,
    iris: AIGENCY_HIGHLIGHT,
    compass: AIGENCY_GO,
    architect: AIGENCY_ACCENT,
  };
  const key = slugify(name);
  return map[key] || AIGENCY_MUTED;
}

export function getCategoryColor(cat: ReturnType<typeof getModuleCategory>): string {
  return {
    package: AIGENCY_HIGHLIGHT,
    app: AIGENCY_ACCENT,
    agent: AIGENCY_GO,
    other: AIGENCY_MUTED,
  }[cat];
}

export function getModuleCategory(slug: string): "package" | "app" | "agent" | "other" {
  if (slug.startsWith("other-apps-")) {
    return "app";
  }
  if (slug.startsWith("other-agents-")) {
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
  return "other";
}

export function getCategoryLabel(cat: ReturnType<typeof getModuleCategory>): string {
  return { package: "Package", app: "App", agent: "Agent", other: "Other" }[cat];
}
