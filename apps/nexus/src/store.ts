import { create } from "zustand";
import type { MetaData, ModuleNode, WikiPage } from "./data/gitnexus.js";

interface NexusState {
  meta: MetaData | null;
  tree: ModuleNode[] | null;
  pages: WikiPage[];
  currentSlug: string | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  setMeta: (m: MetaData) => void;
  setTree: (t: ModuleNode[]) => void;
  setPages: (p: WikiPage[]) => void;
  setCurrentSlug: (s: string | null) => void;
  setSearchQuery: (q: string) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
}

export const useNexusStore = create<NexusState>((set) => ({
  meta: null,
  tree: null,
  pages: [],
  currentSlug: null,
  searchQuery: "",
  isLoading: true,
  error: null,

  setMeta: (m) => set({ meta: m }),
  setTree: (t) => set({ tree: t }),
  setPages: (p) => set({ pages: p }),
  setCurrentSlug: (s) => set({ currentSlug: s }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setLoading: (v) => set({ isLoading: v }),
  setError: (e) => set({ error: e }),
}));
