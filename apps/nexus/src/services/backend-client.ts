import type { MetaData, ModuleNode, WikiPage } from "../data/gitnexus";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_REPOATLAS_API_URL ??
  process.env.NEXT_PUBLIC_GITNEXUS_BACKEND_URL ??
  "http://localhost:4747";

async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export interface RepoInfo {
  id: string;
  name: string;
  path: string;
  commit: string;
  status: "indexing" | "ready" | "error";
}

export interface GraphNode {
  id: string;
  label: string;
  type: "module" | "file" | "symbol";
  x?: number;
  y?: number;
  size?: number;
  color?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: "import" | "call" | "reference";
}

export interface CodeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface SearchResult {
  slug: string;
  title: string;
  excerpt: string;
  score: number;
}

export interface SymbolContext {
  name: string;
  file: string;
  lines: [number, number];
  references: { file: string; line: number }[];
  summary: string;
}

export interface ImpactEntry {
  file: string;
  symbol: string;
  risk: "low" | "medium" | "high";
  reason: string;
}

export interface ProcessStep {
  step: number;
  title: string;
  status: "pending" | "running" | "done" | "error";
  detail?: string;
}

export async function checkBackend(): Promise<{ online: boolean; version?: string }> {
  const health = await safeFetch<{ version?: string; ok?: boolean }>(`${BACKEND_URL}/health`);
  return { online: Boolean(health), version: health?.version };
}

export async function listRepos(): Promise<RepoInfo[]> {
  return (await safeFetch<RepoInfo[]>(`${BACKEND_URL}/api/repos`)) ?? [];
}

export async function loadRepoMetaFromBackend(repo: string): Promise<MetaData | null> {
  return safeFetch<MetaData>(`${BACKEND_URL}/api/repo/${encodeURIComponent(repo)}/meta`);
}

export async function loadRepoTreeFromBackend(repo: string): Promise<ModuleNode[] | null> {
  return safeFetch<ModuleNode[]>(`${BACKEND_URL}/api/repo/${encodeURIComponent(repo)}/tree`);
}

export async function loadRepoWikiPagesFromBackend(repo: string): Promise<WikiPage[] | null> {
  return safeFetch<WikiPage[]>(`${BACKEND_URL}/api/repo/${encodeURIComponent(repo)}/wiki`);
}

export async function loadRepoGraph(repo: string): Promise<CodeGraph | null> {
  return safeFetch<CodeGraph>(`${BACKEND_URL}/api/repo/${encodeURIComponent(repo)}/graph`);
}

export async function searchRepo(repo: string, query: string): Promise<SearchResult[]> {
  return (
    (await safeFetch<SearchResult[]>(
      `${BACKEND_URL}/api/repo/${encodeURIComponent(repo)}/search?q=${encodeURIComponent(query)}`
    )) ?? []
  );
}

export async function getSymbolContext(
  repo: string,
  symbol: string
): Promise<SymbolContext | null> {
  return safeFetch<SymbolContext>(
    `${BACKEND_URL}/api/repo/${encodeURIComponent(repo)}/symbol/${encodeURIComponent(symbol)}`
  );
}

export async function getImpact(repo: string, symbol: string): Promise<ImpactEntry[]> {
  return (
    (await safeFetch<ImpactEntry[]>(
      `${BACKEND_URL}/api/repo/${encodeURIComponent(repo)}/impact?symbol=${encodeURIComponent(symbol)}`
    )) ?? []
  );
}

export async function getProcess(repo: string): Promise<ProcessStep[]> {
  return (
    (await safeFetch<ProcessStep[]>(
      `${BACKEND_URL}/api/repo/${encodeURIComponent(repo)}/process`
    )) ?? []
  );
}

export async function loadProjectData(repo: string): Promise<[MetaData, ModuleNode[], WikiPage[]]> {
  const [meta, tree, pages] = await Promise.all([
    loadRepoMetaFromBackend(repo),
    loadRepoTreeFromBackend(repo),
    loadRepoWikiPagesFromBackend(repo),
  ]);
  if (!meta || !tree || !pages) {
    throw new Error(`Backend returned incomplete data for ${repo}`);
  }
  return [meta, tree, pages];
}

export function backendBaseUrl(): string {
  return BACKEND_URL;
}
