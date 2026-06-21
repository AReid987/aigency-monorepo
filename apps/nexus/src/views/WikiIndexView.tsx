import { BookOpen } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import {
  type ModuleNode,
  getCategoryColor,
  getCategoryLabel,
  getModuleCategory,
} from "../data/gitnexus";
import { useNexusStore } from "../store";

const CATEGORY_ORDER = ["app", "package", "agent", "other"];

export function WikiIndexView() {
  const pages = useNexusStore((s) => s.pages);
  const tree = useNexusStore((s) => s.tree);

  const slugToNode = useMemo(() => {
    const map = new Map<string, ModuleNode>();
    function walk(nodes: ModuleNode[]) {
      for (const node of nodes) {
        map.set(node.slug, node);
        if (node.children) {
          walk(node.children);
        }
      }
    }
    if (tree) {
      walk(tree);
    }
    return map;
  }, [tree]);

  const groups = useMemo(() => {
    const buckets: Record<string, typeof pages> = {};
    for (const page of pages) {
      const node = slugToNode.get(page.slug);
      const cat = node ? getModuleCategory(node.slug) : "other";
      if (!buckets[cat]) {
        buckets[cat] = [];
      }
      buckets[cat].push(page);
    }
    return Object.entries(buckets)
      .sort(([a], [b]) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b))
      .map(([category, pagesInCategory]) => ({
        category,
        label: getCategoryLabel(category as ReturnType<typeof getModuleCategory>),
        color: getCategoryColor(category as ReturnType<typeof getModuleCategory>),
        pages: pagesInCategory,
      }));
  }, [pages, slugToNode]);

  return (
    <div className="aig-view">
      <div className="aig-view__header">
        <div>
          <h1 className="aig-view__title">Wiki Index</h1>
          <p className="aig-view__subtitle">{pages.length} generated pages</p>
        </div>
      </div>

      <div className="aig-wiki-groups">
        {groups.map(({ category, label, color, pages: groupPages }) => (
          <section key={category} className="aig-wiki-group">
            <h2 className="aig-wiki-group__heading" style={{ color }}>
              <span className="aig-wiki-group__dot" style={{ background: color }} />
              {label}
              <span className="aig-wiki-group__count aig-text-mono">{groupPages.length}</span>
            </h2>
            <div className="aig-wiki-index">
              {groupPages.map((page) => (
                <Link
                  key={page.slug}
                  href={`/wiki/${page.slug}`}
                  className="aig-wiki-index__card"
                  style={{ borderLeft: `2px solid ${color}` }}
                >
                  <BookOpen size={18} strokeWidth={1.5} />
                  <div>
                    <div className="aig-wiki-index__title">{page.title}</div>
                    <div className="aig-wiki-index__slug aig-text-mono">{page.slug}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <style>{`
        .aig-wiki-groups {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .aig-wiki-group__heading {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--aig-font-display);
          font-size: var(--aig-text-size-sm);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin: 0 0 12px;
        }
        .aig-wiki-group__dot {
          width: 8px;
          height: 8px;
          flex-shrink: 0;
        }
        .aig-wiki-group__count {
          margin-left: auto;
          color: var(--aig-foreground-muted);
        }
        .aig-wiki-index {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 12px;
        }
        .aig-wiki-index__card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          background: var(--aig-surface);
          box-shadow: var(--aig-border-subtle);
          color: inherit;
          text-decoration: none;
          transition: box-shadow var(--aig-timing-signal-state) var(--aig-ease-out-expo), transform var(--aig-timing-signal-state) var(--aig-ease-out-expo);
        }
        .aig-wiki-index__card:hover {
          box-shadow: var(--aig-border-medium);
          transform: translateY(-2px);
        }
        .aig-wiki-index__card svg {
          color: var(--aig-accent);
          margin-top: 2px;
        }
        .aig-wiki-index__title {
          font-weight: 500;
          color: var(--aig-foreground);
          margin-bottom: 4px;
        }
        .aig-wiki-index__slug {
          font-size: var(--aig-text-size-xs);
          color: var(--aig-accent-dim);
        }
      `}</style>
    </div>
  );
}
