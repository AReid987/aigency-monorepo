import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

export interface ModuleNode {
  name: string;
  slug: string;
  files: string[];
  children?: ModuleNode[];
}

interface RepoMeta {
  repoPath: string;
  remoteUrl?: string;
  lastCommit?: string;
  indexedAt: string;
  stats: {
    files: number;
    nodes: number;
    modules: number;
  };
}

interface WikiMeta {
  fromCommit?: string;
  generatedAt: string;
  model: string;
  moduleFiles: Record<string, string[]>;
  moduleTree: ModuleNode[];
}

function run(cmd: string, args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { cwd }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(`${cmd} ${args.join(" ")} failed: ${stderr || err.message}`));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

async function gitTrackedFiles(cwd: string): Promise<string[]> {
  try {
    const out = await run("git", ["ls-files"], cwd);
    return out
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function gitRemote(cwd: string): Promise<string | undefined> {
  try {
    return await run("git", ["remote", "get-url", "origin"], cwd);
  } catch {
    return undefined;
  }
}

async function gitLastCommit(cwd: string): Promise<string | undefined> {
  try {
    return await run("git", ["rev-parse", "HEAD"], cwd);
  } catch {
    return undefined;
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function titleCase(name: string): string {
  return name.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function groupByTopLevel(files: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const f of files) {
    const parts = f.split("/");
    const top = parts.length > 1 ? parts[0] : "root";
    const existing = groups.get(top) ?? [];
    existing.push(f);
    groups.set(top, existing);
  }
  return groups;
}

function inferLanguage(file: string): string {
  if (file.endsWith(".ts") || file.endsWith(".tsx")) {
    return "typescript";
  }
  if (file.endsWith(".js") || file.endsWith(".jsx")) {
    return "javascript";
  }
  if (file.endsWith(".py")) {
    return "python";
  }
  if (file.endsWith(".go")) {
    return "go";
  }
  if (file.endsWith(".rs")) {
    return "rust";
  }
  if (file.endsWith(".md")) {
    return "markdown";
  }
  if (file.endsWith(".yml") || file.endsWith(".yaml")) {
    return "yaml";
  }
  if (file.endsWith(".json")) {
    return "json";
  }
  if (file.endsWith(".toml")) {
    return "toml";
  }
  return "";
}

function buildModuleTree(files: string[]): ModuleNode[] {
  const groups = groupByTopLevel(files);
  const roots: ModuleNode[] = [];

  for (const [top, topFiles] of groups) {
    const topNode: ModuleNode = {
      name: titleCase(top),
      slug: slugify(top),
      files: [],
      children: [],
    };

    const subGroups = new Map<string, string[]>();
    for (const f of topFiles) {
      const parts = f.split("/");
      if (parts.length > 2) {
        const sub = parts[1];
        const list = subGroups.get(sub) ?? [];
        list.push(f);
        subGroups.set(sub, list);
      } else {
        topNode.files.push(f);
      }
    }

    for (const [sub, subFiles] of subGroups) {
      topNode.children?.push({
        name: titleCase(sub),
        slug: slugify(`${top}-${sub}`),
        files: subFiles,
      });
    }

    if (topNode.children?.length === 0) {
      topNode.children = undefined;
    }
    roots.push(topNode);
  }

  return roots.sort((a, b) => a.name.localeCompare(b.name));
}

function moduleFilesMap(tree: ModuleNode[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  function walk(n: ModuleNode) {
    map[n.slug] = n.files ?? [];
    for (const c of n.children ?? []) {
      walk(c);
    }
  }
  for (const r of tree) {
    walk(r);
  }
  return map;
}

function collectAllFiles(n: ModuleNode): string[] {
  const own = n.files ?? [];
  const child = (n.children ?? []).flatMap(collectAllFiles);
  return [...own, ...child];
}

function generateWikiPage(node: ModuleNode): string {
  const allFiles = collectAllFiles(node);
  const languages = new Set(allFiles.map(inferLanguage).filter(Boolean));
  const filesByLang = new Map<string, string[]>();
  for (const f of allFiles) {
    const lang = inferLanguage(f) || "other";
    const list = filesByLang.get(lang) ?? [];
    list.push(f);
    filesByLang.set(lang, list);
  }

  let md = `# ${node.name}\n\n`;
  md += `**Slug:** \`${node.slug}\`  \n`;
  md += `**Files:** ${allFiles.length}  \n`;
  if (languages.size > 0) {
    md += `**Languages:** ${Array.from(languages).sort().join(", ")}  \n`;
  }
  md += "\n";

  if (allFiles.length === 0) {
    md += "_No tracked files in this module._\n";
    return md;
  }

  md += "## Files\n\n";
  for (const [lang, files] of filesByLang) {
    md += `### ${titleCase(lang)}\n\n`;
    for (const f of files.sort()) {
      md += `- \`${f}\`\n`;
    }
    md += "\n";
  }

  if (node.children && node.children.length > 0) {
    md += "## Sub-modules\n\n";
    for (const c of node.children) {
      md += `- [${c.name}](/wiki/${c.slug})\n`;
    }
    md += "\n";
  }

  md += "## Summary\n\n";
  md += `This module contains ${allFiles.length} tracked file${allFiles.length === 1 ? "" : "s"}`;
  if (node.children && node.children.length > 0) {
    md += ` across ${node.children.length} sub-module${node.children.length === 1 ? "" : "s"}`;
  }
  md += ".\n";
  return md;
}

export async function analyzeAndBuildWiki(
  cwd: string,
  options: { projectId?: string; projectName?: string } = {}
): Promise<{ projectId: string }> {
  const files = await gitTrackedFiles(cwd);
  if (files.length === 0) {
    throw new Error("No git-tracked files found. Ensure this is a git repository with commits.");
  }

  const tree = buildModuleTree(files);
  const moduleFiles = moduleFilesMap(tree);
  const [remoteUrl, lastCommit] = await Promise.all([gitRemote(cwd), gitLastCommit(cwd)]);
  const indexedAt = new Date().toISOString();

  const projectId = options.projectId ?? slugify(basename(cwd));
  const projectName = options.projectName ?? projectId;

  const meta: RepoMeta = {
    repoPath: cwd,
    remoteUrl,
    lastCommit,
    indexedAt,
    stats: {
      files: files.length,
      nodes: tree.length + tree.reduce((acc, n) => acc + (n.children?.length ?? 0), 0),
      modules: tree.length,
    },
  };

  const wikiMeta: WikiMeta = {
    fromCommit: lastCommit,
    generatedAt: indexedAt,
    model: "repoatlas-local",
    moduleFiles,
    moduleTree: tree,
  };

  const gitnexusDir = join(cwd, ".gitnexus");
  const wikiDir = join(gitnexusDir, "wiki");
  await mkdir(wikiDir, { recursive: true });

  await writeFile(join(gitnexusDir, "meta.json"), JSON.stringify(meta, null, 2));
  await writeFile(join(wikiDir, "meta.json"), JSON.stringify(wikiMeta, null, 2));
  await writeFile(join(wikiDir, "module_tree.json"), JSON.stringify(tree, null, 2));

  async function writeNodePages(node: ModuleNode) {
    const md = generateWikiPage(node);
    await writeFile(join(wikiDir, `${node.slug}.md`), md);
    await Promise.all((node.children ?? []).map(writeNodePages));
  }
  await Promise.all(tree.map(writeNodePages));

  // Also emit the static bundle layout used by the deployed Nexus UI when the
  // backend is offline: /.gitnexus/projects.json + /repos/<id>/wiki/...
  const staticRepoDir = join(gitnexusDir, "repos", projectId);
  const staticWikiDir = join(staticRepoDir, "wiki");
  await mkdir(staticWikiDir, { recursive: true });

  await writeFile(join(staticRepoDir, "meta.json"), JSON.stringify(meta, null, 2));
  await writeFile(join(staticWikiDir, "meta.json"), JSON.stringify(wikiMeta, null, 2));
  await writeFile(join(staticWikiDir, "module_tree.json"), JSON.stringify(tree, null, 2));

  async function writeStaticNodePages(node: ModuleNode) {
    const md = generateWikiPage(node);
    await writeFile(join(staticWikiDir, `${node.slug}.md`), md);
    await Promise.all((node.children ?? []).map(writeStaticNodePages));
  }
  await Promise.all(tree.map(writeStaticNodePages));

  const manifest = {
    projects: [
      {
        id: projectId,
        name: projectName,
        path: cwd,
        storagePath: staticRepoDir,
        remoteUrl,
        indexedAt,
        lastCommit: lastCommit ?? null,
        stats: meta.stats,
        hasData: true,
        wikiCount: tree.length,
      },
    ],
  };
  await writeFile(join(gitnexusDir, "projects.json"), JSON.stringify(manifest, null, 2));

  return { projectId };
}
