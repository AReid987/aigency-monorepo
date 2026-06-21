import { useRouter } from "next/router";
import { Box, ExternalLink, FileCode, GitGraph, Layers } from "lucide-react";
import type { ProjectInfo } from "../data/gitnexus";
import { useNexusStore } from "../store";

function ProjectCard({ project }: { project: ProjectInfo }) {
  const router = useRouter();
  const setCurrentRepo = useNexusStore((s) => s.setCurrentRepo);
  const stats = project.stats ?? {};

  const open = () => {
    setCurrentRepo(project.id);
    router.push("/");
  };

  return (
    <div className="aig-project-card">
      <div className="aig-project-card__header">
        <div>
          <h3 className="aig-project-card__title">{project.name}</h3>
          <div className="aig-project-card__path aig-text-mono">{project.path}</div>
        </div>
        {project.remoteUrl && (
          <a
            href={project.remoteUrl}
            target="_blank"
            rel="noreferrer"
            className="aig-project-card__link"
            aria-label="Open remote repository"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      <div className="aig-project-card__stats">
        <Stat icon={FileCode} value={stats.files ?? 0} label="Files" />
        <Stat icon={GitGraph} value={stats.nodes ?? 0} label="Nodes" />
        <Stat icon={Box} value={stats.edges ?? 0} label="Edges" />
        <Stat icon={Layers} value={project.wikiCount} label="Wiki" />
      </div>

      <div className="aig-project-card__footer">
        <span className="aig-text-pixel">Indexed {new Date(project.indexedAt).toLocaleDateString()}</span>
        <button type="button" className="aig-button aig-button--primary" onClick={open}>
          Open
        </button>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof Box; value: number; label: string }) {
  return (
    <div className="aig-project-stat">
      <Icon size={14} strokeWidth={1.5} />
      <span className="aig-project-stat__value">{value.toLocaleString()}</span>
      <span className="aig-project-stat__label">{label}</span>
    </div>
  );
}

export function ProjectsView() {
  const projects = useNexusStore((s) => s.projects);

  return (
    <div className="aig-view">
      <div className="aig-view__header">
        <div>
          <h1 className="aig-view__title">Indexed Projects</h1>
          <p className="aig-view__subtitle">
            {projects.length} project{projects.length !== 1 ? "s" : ""} available in the static bundle.
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="aig-empty">No projects bundled. Run `pnpm bundle:registry` to import your GitNexus registry.</div>
      ) : (
        <div className="aig-project-grid">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      <style>{`
        .aig-project-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }
        .aig-project-card {
          display: flex;
          flex-direction: column;
          background: var(--aig-surface);
          box-shadow: var(--aig-border-subtle);
          padding: 18px;
          gap: 16px;
          transition: box-shadow var(--aig-timing-signal-state) var(--aig-ease-out-expo), transform var(--aig-timing-signal-state) var(--aig-ease-out-expo);
        }
        .aig-project-card:hover {
          box-shadow: var(--aig-border-medium);
          transform: translateY(-2px);
        }
        .aig-project-card__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .aig-project-card__title {
          font-family: var(--aig-font-display);
          font-size: var(--aig-text-size-lg);
          font-weight: 600;
          color: var(--aig-foreground);
          margin: 0;
        }
        .aig-project-card__path {
          font-size: var(--aig-text-size-xs);
          color: var(--aig-foreground-muted);
          margin-top: 4px;
        }
        .aig-project-card__link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          color: var(--aig-foreground-muted);
          transition: color var(--aig-timing-signal-state) var(--aig-ease-out-expo);
        }
        .aig-project-card__link:hover {
          color: var(--aig-accent);
        }
        .aig-project-card__stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }
        .aig-project-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px;
          background: var(--aig-void-base);
          box-shadow: inset 0 0 0 1px var(--aig-fence-light);
          color: var(--aig-foreground-muted);
        }
        .aig-project-stat__value {
          font-family: var(--aig-font-display);
          font-size: var(--aig-text-size-xl);
          font-weight: 600;
          color: var(--aig-foreground);
        }
        .aig-project-stat__label {
          font-size: 9px;
          font-family: var(--aig-font-pixel);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .aig-project-card__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid var(--aig-fence-light);
        }
        .aig-empty {
          padding: 48px;
          background: var(--aig-surface);
          box-shadow: var(--aig-border-subtle);
          color: var(--aig-foreground-muted);
          font-size: var(--aig-text-size-sm);
        }
      `}</style>
    </div>
  );
}
