import { Check, ChevronDown, GitBranch, Layers } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useNexusStore } from "../store";

export function ProjectSwitcher() {
  const projects = useNexusStore((s) => s.projects);
  const currentRepo = useNexusStore((s) => s.currentRepo);
  const setCurrentRepo = useNexusStore((s) => s.setCurrentRepo);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const active = projects.find((p) => p.id === currentRepo) ?? projects[0];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      window.addEventListener("click", onClick);
      return () => window.removeEventListener("click", onClick);
    }
    return undefined;
  }, [open]);

  const select = (id: string) => {
    setCurrentRepo(id);
    setOpen(false);
    router.push("/");
  };

  if (projects.length === 0) {
    return (
      <div className="aig-repo aig-repo--empty">
        <span className="aig-repo__label">No projects</span>
      </div>
    );
  }

  return (
    <div className="aig-project-switcher" ref={ref}>
      <button
        type="button"
        className="aig-repo"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="aig-repo__icon">
          <GitBranch size={14} strokeWidth={2} />
        </div>
        <span className="aig-repo__label">{active?.name ?? "Project"}</span>
        <ChevronDown
          size={12}
          className={`aig-repo__chevron ${open ? "aig-repo__chevron--open" : ""}`}
        />
      </button>

      {open && (
        // biome-ignore lint/a11y/useSemanticElements: custom styled dropdown
        <div className="aig-project-dropdown" role="listbox" tabIndex={0}>
          <div className="aig-project-dropdown__header">
            <Layers size={12} />
            <span className="aig-text-pixel">Indexed Projects</span>
          </div>
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`aig-project-option ${p.id === currentRepo ? "aig-project-option--active" : ""}`}
              onClick={() => select(p.id)}
            >
              <span className="aig-project-option__name">{p.name}</span>
              <span className="aig-project-option__meta">
                {p.stats?.files ?? 0} files · {p.wikiCount} pages
              </span>
              {p.id === currentRepo && <Check size={12} className="aig-project-option__check" />}
            </button>
          ))}
        </div>
      )}

      <style>{`
        .aig-project-switcher {
          position: relative;
        }
        .aig-repo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 12px;
          background: var(--aig-void-raised);
          box-shadow: var(--aig-border-subtle);
          border: none;
          color: inherit;
          font-family: inherit;
          cursor: pointer;
          transition: box-shadow var(--aig-timing-signal-state) var(--aig-ease-out-expo);
        }
        .aig-repo:hover {
          box-shadow: var(--aig-border-medium);
        }
        .aig-repo__icon {
          color: var(--aig-accent);
        }
        .aig-repo__label {
          font-family: var(--aig-font-mono);
          font-size: var(--aig-text-size-xs);
          color: var(--aig-foreground);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .aig-repo__chevron {
          color: var(--aig-foreground-muted);
          transition: transform var(--aig-timing-signal-state) var(--aig-ease-out-expo);
        }
        .aig-repo__chevron--open {
          transform: rotate(180deg);
        }
        .aig-project-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          min-width: 260px;
          max-height: 320px;
          overflow: auto;
          background: var(--aig-surface);
          box-shadow: var(--aig-border-medium);
          z-index: 100;
          padding: 6px;
        }
        .aig-project-dropdown__header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          color: var(--aig-foreground-ghost);
          font-size: var(--aig-text-size-xs);
          border-bottom: 1px solid var(--aig-fence-light);
          margin-bottom: 4px;
        }
        .aig-project-option {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 4px 8px;
          width: 100%;
          padding: 8px 10px;
          background: transparent;
          border: none;
          text-align: left;
          color: var(--aig-foreground-body);
          cursor: pointer;
          transition: background var(--aig-timing-signal-state) var(--aig-ease-out-expo);
        }
        .aig-project-option:hover,
        .aig-project-option--active {
          background: var(--aig-void-raised);
        }
        .aig-project-option__name {
          font-size: var(--aig-text-size-sm);
          color: var(--aig-foreground);
        }
        .aig-project-option__meta {
          grid-column: 1 / -1;
          font-family: var(--aig-font-mono);
          font-size: 10px;
          color: var(--aig-foreground-ghost);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .aig-project-option__check {
          grid-column: 2;
          grid-row: 1;
          color: var(--aig-signal-go);
        }
      `}</style>
    </div>
  );
}
