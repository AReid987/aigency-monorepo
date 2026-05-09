import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Sidebar } from "./components/Sidebar.js";
import { TopBar } from "./components/TopBar.js";
import { loadAllWikiPages, loadMeta, loadModuleTree } from "./data/gitnexus.js";
import { useNexusStore } from "./store.js";
import { GraphView } from "./views/GraphView.js";
import { OverviewView } from "./views/OverviewView.js";
import { SearchView } from "./views/SearchView.js";
import { WikiView } from "./views/WikiView.js";

export function App() {
  const setMeta = useNexusStore((s) => s.setMeta);
  const setTree = useNexusStore((s) => s.setTree);
  const setPages = useNexusStore((s) => s.setPages);
  const setLoading = useNexusStore((s) => s.setLoading);
  const setError = useNexusStore((s) => s.setError);
  useLocation();

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        setLoading(true);
        const [meta, tree, pages] = await Promise.all([
          loadMeta(),
          loadModuleTree(),
          loadAllWikiPages(),
        ]);
        if (cancelled) {
          return;
        }
        setMeta(meta);
        setTree(tree);
        setPages(pages);
        setError(null);
      } catch (e) {
        if (cancelled) {
          return;
        }
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [setMeta, setTree, setPages, setLoading, setError]);

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", overflow: "hidden" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar />
        <main
          style={{
            flex: 1,
            overflow: "auto",
            padding: "24px 32px",
            background: "var(--canvas)",
          }}
        >
          <Routes>
            <Route path="/" element={<OverviewView />} />
            <Route path="/wiki/:slug" element={<WikiView />} />
            <Route path="/search" element={<SearchView />} />
            <Route path="/graph" element={<GraphView />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
