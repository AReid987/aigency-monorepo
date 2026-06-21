import Fuse from "fuse.js";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Search, Globe } from "lucide-react";
import {
  getCategoryColor,
  getCategoryLabel,
  getModuleCategory,
  loadProjectsManifest,
  loadRepoTree,
  loadAllRepoWikiPages,
  type ModuleNode,
  type ProjectInfo,
  type WikiPage,
} from "../data/gitnexus";
import { useNexusStore } from "../store";

interface ModuleHit {
  projectId: string;
  name: string;
  slug: string;
  cat: ReturnType<typeof getModuleCategory>;
}

export function SearchView() {
  const query = useNexusStore((s) => s.searchQuery);
  const pages = useNexusStore((s) => s.pages);
  const tree = useNexusStore((s) => s.tree);
  const currentRepo = useNexusStore((s) => s.currentRepo);
  const setCurrentRepo = useNexusStore((s) => s.setCurrentRepo);
  const router = useRouter();
  const rawQuery = router.query.q;
  const urlQuery = (Array.isArray(rawQuery) ? rawQuery[0] : rawQuery) ?? query;

  const [scope, setScope] = useState<"current" | "all">("current");
  const [allData, setAllData] = useState<{ project: ProjectInfo; pages: WikiPage[]; tree: ModuleNode[] }[] | null>(null);
  const [loadingAll, setLoadingAll] = useState(false);

  useEffect(() => {
    if (scope !== "all") {
      setAllData(null);
      return;
    }
    let cancelled = false;
    setLoadingAll(true);
    loadProjectsManifest()
      .then(async ({ projects }) => {
        const withData = projects.filter((p) => p.hasData);
        const data = await Promise.all(
          withData.map(async (project) => {
            const [tree, pages] = await Promise.all([
              loadRepoTree(project.id),
              loadAllRepoWikiPages(project.id),
            ]);
            return { project, tree, pages };
          })
        );
        if (!cancelled) setAllData(data);
      })
      .finally(() => setLoadingAll(false));
    return () => {
      cancelled = true;
    };
  }, [scope]);

  const activePages = scope === "all" && allData ? allData.flatMap((d) => d.pages.map((p) => ({ projectId: d.project.id, page: p }))) : pages.map((p) => ({ projectId: currentRepo ?? "", page: p }));

  const activeModules: ModuleHit[] = useMemo(() => {
    if (scope === "all" && allData) {
      return allData.flatMap((d) => {
        const flat: ModuleHit[] = [];
        function walk(nodes: ModuleNode[]) {
          for (const n of nodes) {
            flat.push({ projectId: d.project.id, name: n.name, slug: n.slug, cat: getModuleCategory(n.slug) });
            if (n.children) walk(n.children);
          }
        }
        walk(d.tree);
        return flat;
      });
    }
    if (!tree) return [];
    const flat: ModuleHit[] = [];
    function walk(nodes: ModuleNode[]) {
      for (const n of nodes) {
        flat.push({ projectId: currentRepo ?? "", name: n.name, slug: n.slug, cat: getModuleCategory(n.slug) });
        if (n.children) walk(n.children);
      }
    }
    walk(tree);
    return flat;
  }, [scope, allData, tree, currentRepo]);

  const projectNames = useMemo(() => {
    const map = new Map<string, string>();
    if (scope === "all" && allData) {
      for (const d of allData) map.set(d.project.id, d.project.name);
    } else if (currentRepo) {
      map.set(currentRepo, "");
    }
    return map;
  }, [scope, allData, currentRepo]);

  const pageResults = useMemo(() => {
    if (!urlQuery.trim() || activePages.length === 0) return [];
    const fuse = new Fuse(activePages, {
      keys: [
        { name: "page.title", weight: 0.4 },
        { name: "page.slug", weight: 0.2 },
        { name: "page.markdown", weight: 0.4 },
      ],
      threshold: 0.35,
      includeMatches: true,
      includeScore: true,
    });
    return fuse.search(urlQuery.trim()).slice(0, 30);
  }, [urlQuery, activePages]);

  const moduleResults = useMemo(() => {
    if (!urlQuery.trim() || activeModules.length === 0) return [];
    const fuse = new Fuse(activeModules, { keys: ["name", "slug"], threshold: 0.3 });
    return fuse.search(urlQuery.trim()).slice(0, 20);
  }, [urlQuery, activeModules]);

  const handleSelect = (projectId: string, slug: string) => {
    if (projectId && projectId !== currentRepo) {
      setCurrentRepo(projectId);
    }
    router.push(`/wiki/${slug}`);
  };

  if (!urlQuery.trim()) {
    return (
      <div className="aig-search-empty">
        <Search size={40} strokeWidth={1} />
        <p>Type a query above to search across modules and wiki content.</p>
        <style>{`
          .aig-search-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            padding: 80px 0;
            color: var(--aig-foreground-ghost);
          }
          .aig-search-empty p {
            font-size: var(--aig-text-size-base);
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="aig-search">
      <div className="aig-search__header">
        <div>
          <h1 className="aig-view__title">Results for “{urlQuery}”</h1>
          <p className="aig-search__summary">
            {pageResults.length} wiki hit{pageResults.length !== 1 ? "s" : ""} · {moduleResults.length} module hit
            {moduleResults.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="aig-search__scope" role="group" aria-label="Search scope">
          <button
            type="button"
            className={`aig-search__scope-btn ${scope === "current" ? "aig-search__scope-btn--active" : ""}`}
            onClick={() => setScope("current")}
          >
            Current project
          </button>
          <button
            type="button"
            className={`aig-search__scope-btn ${scope === "all" ? "aig-search__scope-btn--active" : ""}`}
            onClick={() => setScope("all")}
          >
            <Globe size={12} strokeWidth={1.5} />
            All projects
          </button>
        </div>
      </div>

      {loadingAll && <div className="aig-search__loading aig-text-pixel">Loading all project indexes…</div>}

      {moduleResults.length > 0 && (
        <section className="aig-search__section">
          <div className="aig-search__section-title">Modules</div>
          <div className="aig-search__list">
            {moduleResults.map(({ item }) => (
              <ResultRow
                key={`${item.projectId}-${item.slug}`}
                title={item.name}
                meta={scope === "all" ? `${getCategoryLabel(item.cat)} · ${projectNames.get(item.projectId) ?? item.projectId}` : getCategoryLabel(item.cat)}
                color={getCategoryColor(item.cat)}
                onClick={() => handleSelect(item.projectId, item.slug)}
              />
            ))}
          </div>
        </section>
      )}

      {pageResults.length > 0 && (
        <section className="aig-search__section">
          <div className="aig-search__section-title">Wiki Content</div>
          <div className="aig-search__list">
            {pageResults.map(({ item, matches }) => {
              const page = item.page;
              const match = matches?.find((m) => m.key === "page.markdown");
              const snippet = match
                ? `…${match.value?.slice(Math.max(0, match.indices[0]?.[0] - 40), match.indices[0]?.[0] + 120)}…`
                : `${page.markdown?.slice(0, 140) ?? ""}…`;
              return (
                <ResultRow
                  key={`${item.projectId}-${page.slug}`}
                  title={page.title}
                  meta={scope === "all" ? `${snippet} · ${projectNames.get(item.projectId) ?? item.projectId}` : snippet}
                  color="var(--aig-foreground-muted)"
                  onClick={() => handleSelect(item.projectId, page.slug)}
                />
              );
            })}
          </div>
        </section>
      )}

      {pageResults.length === 0 && moduleResults.length === 0 && !loadingAll && (
        <div className="aig-search__empty">No results found.</div>
      )}

      <style>{`
        .aig-search { max-width: 760px; }
        .aig-search__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .aig-search__summary {
          color: var(--aig-foreground-muted);
          font-size: var(--aig-text-size-sm);
          margin: 8px 0 0;
        }
        .aig-search__scope {
          display: flex;
          background: var(--aig-surface);
          box-shadow: var(--aig-border-subtle);
        }
        .aig-search__scope-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: transparent;
          border: none;
          color: var(--aig-foreground-muted);
          font-family: var(--aig-font-pixel);
          font-size: var(--aig-text-size-xs);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          cursor: pointer;
          transition: color var(--aig-timing-signal-state) var(--aig-ease-out-expo), background var(--aig-timing-signal-state) var(--aig-ease-out-expo);
        }
        .aig-search__scope-btn--active {
          color: var(--aig-foreground);
          background: var(--aig-void-raised);
          box-shadow: var(--aig-border-subtle);
        }
        .aig-search__loading {
          margin-bottom: 20px;
          color: var(--aig-accent);
          font-size: var(--aig-text-size-xs);
        }
        .aig-search__section { margin-bottom: 28px; }
        .aig-search__section-title {
          font-family: var(--aig-font-pixel);
          font-size: var(--aig-text-size-xs);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--aig-foreground-ghost);
          margin-bottom: 12px;
        }
        .aig-search__list { display: flex; flex-direction: column; gap: 8px; }
        .aig-search__empty {
          color: var(--aig-foreground-ghost);
          padding: 40px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}

function ResultRow({
  title,
  meta,
  color,
  onClick,
}: {
  title: string;
  meta: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="aig-result-row">
      <span className="aig-result-row__dot" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      <div className="aig-result-row__body">
        <div className="aig-result-row__title">{title}</div>
        <div className="aig-result-row__meta aig-truncate" title={meta}>{meta}</div>
      </div>
      <style>{`
        .aig-result-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          background: var(--aig-surface);
          box-shadow: var(--aig-border-subtle);
          cursor: pointer;
          text-align: left;
          color: inherit;
          font-family: inherit;
          width: 100%;
          border: none;
          transition: box-shadow var(--aig-timing-signal-state) var(--aig-ease-out-expo);
        }
        .aig-result-row:hover {
          box-shadow: var(--aig-border-medium);
        }
        .aig-result-row__dot {
          width: 8px;
          height: 8px;
          margin-top: 5px;
          flex-shrink: 0;
        }
        .aig-result-row__body { min-width: 0; flex: 1; }
        .aig-result-row__title {
          font-weight: 500;
          font-size: var(--aig-text-size-sm);
          margin-bottom: 2px;
          color: var(--aig-foreground);
        }
        .aig-result-row__meta {
          font-size: var(--aig-text-size-xs);
          color: var(--aig-foreground-ghost);
        }
      `}</style>
    </button>
  );
}
