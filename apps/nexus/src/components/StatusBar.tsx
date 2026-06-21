import { useNexusStore } from "../store";

export function StatusBar() {
  const meta = useNexusStore((s) => s.meta);
  const pages = useNexusStore((s) => s.pages);
  const backend = useNexusStore((s) => s.backend);

  const generatedAt = meta?.generatedAt ? new Date(meta.generatedAt).toLocaleString() : "—";
  const commit = meta?.fromCommit ? meta.fromCommit.slice(0, 7) : "—";

  return (
    <footer className="aig-statusbar">
      <div className="aig-statusbar__left">
        <span className="aig-text-pixel">Wiki pages</span>
        <span className="aig-statusbar__value">{pages.length}</span>
      </div>
      <div className="aig-statusbar__center">
        <span className="aig-text-pixel">Commit</span>
        <span className="aig-statusbar__value aig-statusbar__mono">{commit}</span>
        <span className="aig-statusbar__sep" />
        <span className="aig-text-pixel">Generated</span>
        <span className="aig-statusbar__value aig-statusbar__mono">{generatedAt}</span>
      </div>
      <div className="aig-statusbar__right">
        <span className="aig-text-pixel">Backend</span>
        <span className="aig-statusbar__value">
          {backend.online ? `OK${backend.version ? ` v${backend.version}` : ""}` : "STATIC"}
        </span>
      </div>

      <style>{`
        .aig-statusbar {
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 0 16px;
          background: var(--aig-void-base);
          box-shadow: inset 0 1px 0 0 var(--aig-fence-light);
          font-size: var(--aig-text-size-xs);
          color: var(--aig-foreground-ghost);
          z-index: 10;
        }
        .aig-statusbar__left,
        .aig-statusbar__center,
        .aig-statusbar__right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .aig-statusbar__value {
          color: var(--aig-foreground-body);
        }
        .aig-statusbar__mono {
          font-family: var(--aig-font-mono);
        }
        .aig-statusbar__sep {
          width: 1px;
          height: 12px;
          background: var(--aig-fence-light);
          margin: 0 4px;
        }
      `}</style>
    </footer>
  );
}
