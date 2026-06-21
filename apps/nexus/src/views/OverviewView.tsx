import Link from "next/link";
import { useRouter } from "next/router";
import { BookOpen, Box, Cpu, GitBranch, GitGraph, Layers, Radio, type LucideIcon } from "lucide-react";
import { getCategoryColor, getModuleCategory, type ModuleNode } from "../data/gitnexus";
import { useNexusStore } from "../store";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  href: string;
}) {
  return (
    <Link href={href} className="aig-stat-card">
      <div className="aig-stat-card__icon">
        <Icon size={20} strokeWidth={1.5} />
      </div>
      <div>
        <div className="aig-text-pixel aig-stat-card__label">{label}</div>
        <div className="aig-stat-card__value">{value}</div>
        {sub && <div className="aig-stat-card__sub">{sub}</div>}
      </div>
    </Link>
  );
}

function ModuleRow({ node }: { node: ModuleNode }) {
  const cat = getModuleCategory(node.slug);
  const color = getCategoryColor(cat);
  return (
    <Link href={`/wiki/${node.slug}`} className="aig-module-row">
      <span className="aig-module-row__dot" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      <span className="aig-truncate aig-module-row__name">{node.name}</span>
      <span className="aig-tag">{cat}</span>
    </Link>
  );
}

export function OverviewView() {
  const meta = useNexusStore((s) => s.meta);
  const tree = useNexusStore((s) => s.tree);
  const pages = useNexusStore((s) => s.pages);
  const backend = useNexusStore((s) => s.backend);
  const isLoading = useNexusStore((s) => s.isLoading);
  const projects = useNexusStore((s) => s.projects);
  const currentRepo = useNexusStore((s) => s.currentRepo);
  const activeProject = projects.find((p) => p.id === currentRepo);
  const router = useRouter();

  const modules = tree ?? [];
  const apps = modules.filter((n) => getModuleCategory(n.slug) === "app");
  const agents = modules.filter((n) => getModuleCategory(n.slug) === "agent");
  const packages = modules.filter((n) => getModuleCategory(n.slug) === "package");

  return (
    <div className="aig-view aig-view--overview">
      <div className="aig-view__header">
        <div>
          <h1 className="aig-view__title">Mission Control</h1>
          <p className="aig-view__subtitle">
            {meta?.fromCommit
              ? `Indexed from ${meta.fromCommit.slice(0, 12)} via ${meta.model || "unknown model"}`
              : "Static GitNexus knowledge graph"}
          </p>
        </div>
        <div className="aig-view__status">
          <Radio size={14} strokeWidth={1.5} />
          <span className={`aig-text-pixel ${backend.online ? "aig-text-go" : "aig-text-muted"}`}>
            {backend.online ? "LIVE LINK" : "LOCAL MODE"}
          </span>
        </div>
      </div>

      {activeProject && (
        <div className="aig-project-banner">
          <div className="aig-project-banner__icon">
            <GitBranch size={18} strokeWidth={1.5} />
          </div>
          <div className="aig-project-banner__body">
            <div className="aig-project-banner__name">{activeProject.name}</div>
            <div className="aig-project-banner__meta aig-text-mono">
              {activeProject.stats?.files ?? 0} files · {pages.length} wiki pages · indexed{" "}
              {new Date(activeProject.indexedAt).toLocaleString()}
            </div>
          </div>
          <button type="button" className="aig-button aig-button--ghost" onClick={() => router.push("/projects")}>
            Switch Project
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="aig-loading">Initializing knowledge graph…</div>
      ) : (
        <>
          <div className="aig-stat-grid">
            <StatCard label="Modules" value={modules.length} sub={`${apps.length} apps · ${packages.length} packages`} icon={Box} href="/files" />
            <StatCard label="Agents" value={agents.length} sub="Autonomous workers" icon={Cpu} href="/files" />
            <StatCard label="Wiki Pages" value={pages.length} sub="Generated docs" icon={BookOpen} href="/wiki" />
            <StatCard label="Relations" value="Graph" sub="Visual dependency map" icon={GitGraph} href="/graph" />
          </div>

          <div className="aig-overview-grid">
            <section className="aig-pane aig-overview-panel">
              <div className="aig-pane__header">
                <Layers size={16} strokeWidth={1.5} />
                <span className="aig-text-pixel">Modules</span>
              </div>
              <div className="aig-overview-panel__list">
                {modules.map((node) => (
                  <ModuleRow key={node.slug} node={node} />
                ))}
              </div>
            </section>

            <section className="aig-pane aig-overview-panel">
              <div className="aig-pane__header">
                <BookOpen size={16} strokeWidth={1.5} />
                <span className="aig-text-pixel">Recent Wiki</span>
              </div>
              <div className="aig-overview-panel__list">
                {pages.slice(0, 12).map((page) => (
                  <Link key={page.slug} href={`/wiki/${page.slug}`} className="aig-wiki-row">
                    <span className="aig-wiki-row__slug">{page.slug}</span>
                    <span className="aig-truncate">{page.title}</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </>
      )}

      <style>{`
        .aig-view--overview {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .aig-view__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }
        .aig-view__title {
          font-family: var(--aig-font-display);
          font-size: var(--aig-text-size-4xl);
          font-weight: 600;
          color: var(--aig-foreground);
          margin: 0;
          line-height: 1.1;
        }
        .aig-view__subtitle {
          margin: 8px 0 0;
          color: var(--aig-foreground-muted);
          font-family: var(--aig-font-mono);
          font-size: var(--aig-text-size-sm);
        }
        .aig-view__status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: var(--aig-text-size-xs);
          color: var(--aig-foreground-muted);
        }
        .aig-text-go { color: var(--aig-signal-go); }
        .aig-text-muted { color: var(--aig-foreground-ghost); }
        .aig-loading {
          padding: 48px;
          text-align: center;
          color: var(--aig-foreground-muted);
          font-family: var(--aig-font-pixel);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .aig-stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
        }
        .aig-stat-card {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 18px;
          background: var(--aig-surface);
          box-shadow: var(--aig-border-subtle);
          color: inherit;
          text-decoration: none;
          transition: box-shadow var(--aig-timing-signal-state) var(--aig-ease-out-expo), transform var(--aig-timing-signal-state) var(--aig-ease-out-expo);
        }
        .aig-stat-card:hover {
          box-shadow: var(--aig-border-medium);
          transform: translateY(-2px);
        }
        .aig-stat-card__icon {
          color: var(--aig-accent);
        }
        .aig-stat-card__label {
          font-size: var(--aig-text-size-xs);
          color: var(--aig-foreground-ghost);
          margin-bottom: 4px;
        }
        .aig-stat-card__value {
          font-family: var(--aig-font-display);
          font-size: var(--aig-text-size-3xl);
          font-weight: 600;
          color: var(--aig-foreground);
        }
        .aig-stat-card__sub {
          font-size: var(--aig-text-size-xs);
          color: var(--aig-foreground-muted);
          margin-top: 2px;
        }
        .aig-overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 16px;
        }
        .aig-overview-panel {
          display: flex;
          flex-direction: column;
          min-height: 320px;
        }
        .aig-pane__header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-bottom: 1px solid var(--aig-fence-light);
          color: var(--aig-foreground-muted);
          font-size: var(--aig-text-size-xs);
        }
        .aig-project-banner {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          margin-bottom: 16px;
          background: var(--aig-surface);
          box-shadow: var(--aig-border-subtle);
        }
        .aig-project-banner__icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--aig-accent);
          background: var(--aig-void-raised);
          box-shadow: var(--aig-border-subtle);
        }
        .aig-project-banner__body {
          flex: 1;
          min-width: 0;
        }
        .aig-project-banner__name {
          font-family: var(--aig-font-display);
          font-size: var(--aig-text-size-lg);
          font-weight: 600;
          color: var(--aig-foreground);
        }
        .aig-project-banner__meta {
          font-size: var(--aig-text-size-xs);
          color: var(--aig-foreground-muted);
          margin-top: 2px;
        }
        .aig-overview-panel__list {
          flex: 1;
          overflow: auto;
          padding: 8px 0;
        }
        .aig-module-row,
        .aig-wiki-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          color: var(--aig-foreground-body);
          font-size: var(--aig-text-size-sm);
          text-decoration: none;
          transition: background var(--aig-timing-signal-state) var(--aig-ease-out-expo);
        }
        .aig-module-row:hover,
        .aig-wiki-row:hover {
          background: var(--aig-void-raised);
        }
        .aig-module-row__dot {
          width: 6px;
          height: 6px;
          flex-shrink: 0;
        }
        .aig-module-row__name {
          flex: 1;
        }
        .aig-wiki-row__slug {
          font-family: var(--aig-font-mono);
          font-size: var(--aig-text-size-xs);
          color: var(--aig-accent-dim);
          text-transform: uppercase;
        }
        .aig-project-banner {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: var(--aig-surface);
          box-shadow: var(--aig-border-subtle);
        }
        .aig-project-banner__icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--aig-accent);
          background: var(--aig-void-raised);
          box-shadow: var(--aig-border-subtle);
        }
        .aig-project-banner__body {
          flex: 1;
          min-width: 0;
        }
        .aig-project-banner__name {
          font-family: var(--aig-font-display);
          font-size: var(--aig-text-size-lg);
          font-weight: 600;
          color: var(--aig-foreground);
        }
        .aig-project-banner__meta {
          font-size: var(--aig-text-size-xs);
          color: var(--aig-foreground-muted);
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
}
