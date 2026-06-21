import {
  Activity,
  BookOpen,
  FolderTree,
  GitGraph,
  Hexagon,
  Layers,
  LayoutGrid,
  type LucideIcon,
  MessageSquare,
  Radar,
  Search,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { type ModuleNode, getCategoryColor, getModuleCategory } from "../data/gitnexus";
import { useNexusStore } from "../store";

function NavItem({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
}) {
  const router = useRouter();
  const isActive = router.pathname === to;
  return (
    <Link href={to} className={`aig-nav-item ${isActive ? "aig-nav-item--active" : ""}`}>
      <Icon size={16} strokeWidth={1.5} />
      <span>{label}</span>
    </Link>
  );
}

function TreeNode({ node, depth = 0 }: { node: ModuleNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = (node.children?.length ?? 0) > 0;
  const cat = getModuleCategory(node.slug);
  const color = getCategoryColor(cat);
  const router = useRouter();
  const activeSlug = typeof router.query.slug === "string" ? router.query.slug : null;
  const isActive = router.pathname === "/wiki/[slug]" && activeSlug === node.slug;

  return (
    <div>
      <div className="aig-tree-node" style={{ paddingLeft: `${depth * 12}px` }}>
        <button
          type="button"
          className="aig-tree-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          disabled={!hasChildren}
          aria-label={open ? "Collapse module" : "Expand module"}
        >
          {hasChildren ? (
            <span className="aig-tree-chevron" data-open={open}>
              ▼
            </span>
          ) : (
            <span className="aig-tree-chevron-placeholder" />
          )}
        </button>
        <Link
          href={`/wiki/${node.slug}`}
          className={`aig-tree-link ${isActive ? "aig-tree-link--active" : ""}`}
        >
          <span
            className="aig-tree-dot"
            style={{ background: color, boxShadow: `0 0 6px ${color}` }}
          />
          <span className="aig-truncate">{node.name}</span>
        </Link>
      </div>
      {open && hasChildren && (
        <div>
          {node.children?.map((c) => (
            <TreeNode key={c.slug} node={c} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const tree = useNexusStore((s) => s.tree);
  const isLoading = useNexusStore((s) => s.isLoading);
  const chatOpen = useNexusStore((s) => s.chatOpen);
  const setChatOpen = useNexusStore((s) => s.setChatOpen);
  const projects = useNexusStore((s) => s.projects);
  const currentRepo = useNexusStore((s) => s.currentRepo);
  const activeProject = projects.find((p) => p.id === currentRepo);

  return (
    <aside className="aig-sidebar">
      <div className="aig-sidebar__brand">
        <div className="aig-logo">
          <Hexagon size={24} strokeWidth={1.5} />
        </div>
        <div>
          <div className="aig-sidebar__title">GitNexus</div>
          <div className="aig-sidebar__subtitle">
            {activeProject ? activeProject.name : "Aigency Knowledge Graph"}
          </div>
        </div>
      </div>

      <nav className="aig-sidebar__nav">
        <NavItem to="/" icon={Radar} label="Overview" />
        <NavItem to="/projects" icon={LayoutGrid} label="Projects" />
        <NavItem to="/search" icon={Search} label="Search" />
        <NavItem to="/graph" icon={GitGraph} label="Relations" />
        <NavItem to="/impact" icon={Activity} label="Impact" />
        <NavItem to="/process" icon={Layers} label="Process" />
        <NavItem to="/files" icon={FolderTree} label="Files" />
        <NavItem to="/wiki" icon={BookOpen} label="Wiki" />
      </nav>

      <div className="aig-sidebar__divider" />

      <div className="aig-sidebar__section">
        <div className="aig-sidebar__section-title">Modules</div>
        {isLoading && <div className="aig-sidebar__loading">Loading modules…</div>}
        {tree?.map((node) => (
          <TreeNode key={node.slug} node={node} />
        ))}
      </div>

      <div className="aig-sidebar__footer">
        <button
          type="button"
          className="aig-button aig-button--ghost"
          onClick={() => setChatOpen(!chatOpen)}
        >
          <MessageSquare size={14} />
          <span>IRIS</span>
        </button>
        <Link href="/settings" className="aig-sidebar__settings">
          <Settings size={16} strokeWidth={1.5} />
        </Link>
      </div>

      <style>{`
        .aig-sidebar {
          width: 260px;
          min-width: 260px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--aig-surface);
          box-shadow: var(--aig-border-subtle);
          z-index: 10;
        }
        .aig-sidebar__brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 16px 16px;
        }
        .aig-logo {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--aig-void-base);
          background: var(--aig-accent);
          box-shadow: 0 0 16px var(--aig-accent-glow);
        }
        .aig-sidebar__title {
          font-family: var(--aig-font-display);
          font-size: var(--aig-text-size-lg);
          font-weight: 600;
          color: var(--aig-foreground);
          line-height: 1.2;
        }
        .aig-sidebar__subtitle {
          font-family: var(--aig-font-pixel);
          font-size: var(--aig-text-size-xs);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--aig-foreground-muted);
        }
        .aig-sidebar__nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 0 12px 8px;
        }
        .aig-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          color: var(--aig-foreground-muted);
          font-family: var(--aig-font-pixel);
          font-size: var(--aig-text-size-xs);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          text-decoration: none;
          transition: color var(--aig-timing-signal-state) var(--aig-ease-out-expo), box-shadow var(--aig-timing-signal-state) var(--aig-ease-out-expo);
        }
        .aig-nav-item:hover {
          color: var(--aig-foreground);
          box-shadow: var(--aig-border-subtle);
        }
        .aig-nav-item--active {
          color: var(--aig-accent);
          box-shadow: inset 3px 0 0 0 var(--aig-accent), var(--aig-border-subtle);
        }
        .aig-sidebar__divider {
          height: 1px;
          background: var(--aig-fence-light);
          margin: 8px 12px;
        }
        .aig-sidebar__section {
          flex: 1;
          overflow: auto;
          padding: 0 12px 16px;
        }
        .aig-sidebar__section-title {
          font-family: var(--aig-font-pixel);
          font-size: var(--aig-text-size-xs);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--aig-foreground-ghost);
          margin: 8px 0 6px;
        }
        .aig-sidebar__loading {
          color: var(--aig-foreground-ghost);
          font-size: var(--aig-text-size-sm);
          padding: 8px 0;
        }
        .aig-tree-node {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 3px 0;
          user-select: none;
          color: var(--aig-foreground-muted);
          font-family: inherit;
          font-size: var(--aig-text-size-sm);
          transition: color var(--aig-timing-signal-state) var(--aig-ease-out-expo);
        }
        .aig-tree-node:hover {
          color: var(--aig-foreground);
        }
        .aig-tree-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          background: transparent;
          border: none;
          color: inherit;
          cursor: pointer;
        }
        .aig-tree-toggle:disabled {
          cursor: default;
          opacity: 0.3;
        }
        .aig-tree-chevron {
          width: 14px;
          font-size: 9px;
          color: var(--aig-foreground-ghost);
          transition: transform var(--aig-timing-signal-state) var(--aig-ease-out-expo);
        }
        .aig-tree-chevron[data-open="false"] {
          transform: rotate(-90deg);
        }
        .aig-tree-chevron-placeholder {
          width: 14px;
        }
        .aig-tree-link {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          color: inherit;
          text-decoration: none;
        }
        .aig-tree-link--active {
          color: var(--aig-accent);
        }
        .aig-tree-dot {
          width: 6px;
          height: 6px;
          flex-shrink: 0;
        }
        .aig-sidebar__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-top: 1px solid var(--aig-fence-light);
        }
        .aig-sidebar__settings {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          color: var(--aig-foreground-muted);
          transition: color var(--aig-timing-signal-state) var(--aig-ease-out-expo);
        }
        .aig-sidebar__settings:hover {
          color: var(--aig-accent);
        }
      `}</style>
    </aside>
  );
}
