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

let _meta: MetaData | null = null;
let _tree: ModuleNode[] | null = null;
let _pages: Map<string, WikiPage> | null = null;

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

export async function loadMeta(): Promise<MetaData> {
  if (_meta) {
    return _meta;
  }
  const res = await fetch("./.gitnexus/wiki/meta.json");
  if (!res.ok) {
    throw new Error("Failed to load meta.json");
  }
  _meta = (await res.json()) as MetaData;
  return _meta;
}

export async function loadModuleTree(): Promise<ModuleNode[]> {
  if (_tree) {
    return _tree;
  }
  const res = await fetch("./.gitnexus/wiki/module_tree.json");
  if (!res.ok) {
    throw new Error("Failed to load module_tree.json");
  }
  _tree = (await res.json()) as ModuleNode[];
  return _tree;
}

export async function loadWikiPage(slug: string): Promise<WikiPage | null> {
  const cached = _pages?.get(slug);
  if (cached) {
    return cached;
  }
  const fileName = `${slug}.md`;
  const res = await fetch(`./.gitnexus/wiki/${fileName}`);
  if (!res.ok) {
    return null;
  }
  const markdown = await res.text();
  const page: WikiPage = { slug, title: titleFromSlug(slug), markdown };
  if (!_pages) {
    _pages = new Map();
  }
  _pages.set(slug, page);
  return page;
}

export async function loadAllWikiPages(): Promise<WikiPage[]> {
  const tree = await loadModuleTree();
  const slugs = collectSlugs(tree);
  const pages = await Promise.all(slugs.map((s) => loadWikiPage(s)));
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

export function getAgentColor(name: string): string {
  const map: Record<string, string> = {
    zenith: "var(--accent-zenith)",
    cipher: "var(--accent-cipher)",
    echo: "var(--accent-echo)",
    vector: "var(--accent-vector)",
    atlas: "var(--accent-atlas)",
    oracle: "var(--accent-oracle)",
    librarian: "var(--accent-librarian)",
    herald: "var(--accent-herald)",
    iris: "var(--accent-iris)",
    compass: "var(--accent-compass)",
    architect: "#FFD700",
  };
  const key = slugify(name);
  return map[key] || "var(--text-secondary)";
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
