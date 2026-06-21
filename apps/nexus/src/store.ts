import { create } from "zustand";
import type { ProjectInfo } from "./data/gitnexus";

export interface BackendStatus {
  online: boolean;
  version?: string;
  lastChecked: number;
}

export interface NexusState {
  projects: ProjectInfo[];
  currentRepo: string | null;
  meta: import("./data/gitnexus.js").MetaData | null;
  tree: import("./data/gitnexus.js").ModuleNode[] | null;
  pages: import("./data/gitnexus.js").WikiPage[];
  currentSlug: string | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  backend: BackendStatus;
  dataSource: "backend" | "static";
  chatOpen: boolean;
  selectedSymbol: string | null;
  setProjects: (p: ProjectInfo[]) => void;
  setCurrentRepo: (r: string | null) => void;
  setMeta: (m: import("./data/gitnexus.js").MetaData) => void;
  setTree: (t: import("./data/gitnexus.js").ModuleNode[]) => void;
  setPages: (p: import("./data/gitnexus.js").WikiPage[]) => void;
  setCurrentSlug: (s: string | null) => void;
  setSearchQuery: (q: string) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  setBackend: (b: BackendStatus) => void;
  setDataSource: (d: "backend" | "static") => void;
  setChatOpen: (v: boolean) => void;
  setSelectedSymbol: (s: string | null) => void;
}

function initialRepo(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return localStorage.getItem("aig-nexus:repo");
  } catch {
    return null;
  }
}

export const useNexusStore = create<NexusState>((set) => ({
  projects: [],
  currentRepo: initialRepo(),
  meta: null,
  tree: null,
  pages: [],
  currentSlug: null,
  searchQuery: "",
  isLoading: true,
  error: null,
  backend: { online: false, lastChecked: 0 },
  dataSource: "static",
  chatOpen: false,
  selectedSymbol: null,
  setProjects: (p) => set({ projects: p }),
  setCurrentRepo: (r) => {
    if (typeof window !== "undefined" && r) {
      try {
        localStorage.setItem("aig-nexus:repo", r);
      } catch {
        // ignore
      }
    }
    set({ currentRepo: r });
  },
  setMeta: (m) => set({ meta: m }),
  setTree: (t) => set({ tree: t }),
  setPages: (p) => set({ pages: p }),
  setCurrentSlug: (s) => set({ currentSlug: s }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setLoading: (v) => set({ isLoading: v }),
  setError: (e) => set({ error: e }),
  setBackend: (b) => set({ backend: b }),
  setDataSource: (d) => set({ dataSource: d }),
  setChatOpen: (v) => set({ chatOpen: v }),
  setSelectedSymbol: (s) => set({ selectedSymbol: s }),
}));
