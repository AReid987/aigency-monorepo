import { ChevronDown, ChevronRight, FileCode, Folder, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { type ModuleNode, getCategoryColor, getModuleCategory } from "../data/gitnexus";
import { useNexusStore } from "../store";

interface SelectedFile {
  path: string;
  moduleSlug: string;
  moduleName: string;
}

function TreeItem({
  node,
  depth = 0,
  onSelectFile,
}: {
  node: ModuleNode;
  depth?: number;
  onSelectFile: (file: string, moduleSlug: string, moduleName: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = (node.children?.length ?? 0) > 0;
  const hasFiles = (node.files?.length ?? 0) > 0;
  const cat = getModuleCategory(node.slug);
  const color = getCategoryColor(cat);

  return (
    <div>
      <div className="aig-filetree-node" style={{ paddingLeft: `${depth * 18}px` }}>
        <button
          type="button"
          className="aig-filetree-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          disabled={!hasChildren && !hasFiles}
          aria-label={open ? "Collapse module" : "Expand module"}
        >
          {hasChildren || hasFiles ? (
            <span className="aig-filetree-chevron">
              {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          ) : (
            <span className="aig-filetree-chevron-placeholder" />
          )}
        </button>
        <Folder size={14} style={{ color }} />
        <Link href={`/wiki/${node.slug}`} className="aig-filetree-name">
          <span className="aig-truncate">{node.name}</span>
        </Link>
        <span className="aig-tag aig-tag--small">{cat}</span>
      </div>

      {open && (
        <div>
          {node.files?.map((file) => (
            <button
              key={file}
              type="button"
              className="aig-filetree-file"
              style={{ paddingLeft: `${(depth + 1) * 18}px` }}
              onClick={() => onSelectFile(file, node.slug, node.name)}
            >
              <span className="aig-filetree-chevron-placeholder" />
              <FileCode size={14} />
              <span className="aig-truncate aig-text-mono">{file}</span>
            </button>
          ))}
          {node.children?.map((child) => (
            <TreeItem key={child.slug} node={child} depth={depth + 1} onSelectFile={onSelectFile} />
          ))}
        </div>
      )}
    </div>
  );
}

function buildFileUrl(remoteUrl: string | undefined, filePath: string): string | null {
  if (!remoteUrl) {
    return null;
  }
  const base = remoteUrl.replace(/\.git$/, "");
  return `${base}/blob/main/${filePath.split("/").map(encodeURIComponent).join("/")}`;
}

export function FileTreeView() {
  const tree = useNexusStore((s) => s.tree);
  const currentRepo = useNexusStore((s) => s.currentRepo);
  const projects = useNexusStore((s) => s.projects);
  const activeProject = projects.find((p) => p.id === currentRepo);
  const [selected, setSelected] = useState<SelectedFile | null>(null);

  const fileCount = useMemo(() => {
    let count = 0;
    function walk(nodes: ModuleNode[]) {
      for (const n of nodes) {
        count += n.files?.length ?? 0;
        if (n.children) {
          walk(n.children);
        }
      }
    }
    if (tree) {
      walk(tree);
    }
    return count;
  }, [tree]);

  const handleSelectFile = (path: string, moduleSlug: string, moduleName: string) => {
    setSelected({ path, moduleSlug, moduleName });
  };

  if (!tree) {
    return <div className="aig-loading">Loading file tree…</div>;
  }

  return (
    <div className="aig-view">
      <div className="aig-view__header">
        <div>
          <h1 className="aig-view__title">File Tree</h1>
          <p className="aig-view__subtitle">
            {tree.length} modules · {fileCount} tracked files
          </p>
        </div>
      </div>

      <div className="aig-filetree-layout">
        <div className="aig-filetree">
          {tree.map((node) => (
            <TreeItem key={node.slug} node={node} onSelectFile={handleSelectFile} />
          ))}
        </div>

        {selected && (
          <aside className="aig-filetree-panel">
            <div className="aig-filetree-panel__header">
              <h3 className="aig-filetree-panel__title">File</h3>
              <button
                type="button"
                className="aig-button aig-button--ghost"
                onClick={() => setSelected(null)}
                aria-label="Close"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
            <div className="aig-filetree-panel__body">
              <div className="aig-filetree-panel__row">
                <span className="aig-text-pixel">Path</span>
              </div>
              <code className="aig-filetree-panel__path">{selected.path}</code>
              <div className="aig-filetree-panel__row">
                <span className="aig-text-pixel">Module</span>
                <Link href={`/wiki/${selected.moduleSlug}`} className="aig-filetree-panel__link">
                  {selected.moduleName}
                </Link>
              </div>
              {activeProject?.remoteUrl && (
                <a
                  href={buildFileUrl(activeProject.remoteUrl, selected.path) ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="aig-button"
                >
                  Open in repository
                </a>
              )}
            </div>
          </aside>
        )}
      </div>

      <style>{`
        .aig-filetree-layout {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        .aig-filetree {
          flex: 1;
          background: var(--aig-surface);
          box-shadow: var(--aig-border-subtle);
          padding: 8px 0;
          max-width: 720px;
        }
        .aig-filetree-node,
        .aig-filetree-file {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 6px 16px;
          color: var(--aig-foreground-body);
          font-size: var(--aig-text-size-sm);
          background: transparent;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background var(--aig-timing-signal-state) var(--aig-ease-out-expo);
        }
        .aig-filetree-node:hover,
        .aig-filetree-file:hover {
          background: var(--aig-void-raised);
        }
        .aig-filetree-file {
          color: var(--aig-foreground-muted);
        }
        .aig-filetree-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          background: transparent;
          border: none;
          color: inherit;
          cursor: pointer;
        }
        .aig-filetree-toggle:disabled {
          cursor: default;
          opacity: 0.3;
        }
        .aig-filetree-name {
          flex: 1;
          display: flex;
          align-items: center;
          min-width: 0;
          color: inherit;
          text-decoration: none;
        }
        .aig-filetree-chevron {
          width: 16px;
          display: flex;
          align-items: center;
          color: var(--aig-foreground-ghost);
        }
        .aig-filetree-chevron-placeholder {
          width: 16px;
        }
        .aig-tag--small {
          margin-left: auto;
          font-size: 9px;
          padding: 2px 5px;
        }
        .aig-filetree-panel {
          width: 280px;
          flex-shrink: 0;
          background: var(--aig-surface);
          box-shadow: var(--aig-border-subtle);
          display: flex;
          flex-direction: column;
        }
        .aig-filetree-panel__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 16px;
          box-shadow: var(--aig-border-subtle);
        }
        .aig-filetree-panel__title {
          font-family: var(--aig-font-display);
          font-size: var(--aig-text-size-md);
          font-weight: 600;
          color: var(--aig-foreground);
          margin: 0;
        }
        .aig-filetree-panel__body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .aig-filetree-panel__row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: var(--aig-text-size-sm);
        }
        .aig-filetree-panel__path {
          display: block;
          padding: 10px;
          background: var(--aig-void-raised);
          color: var(--aig-foreground-body);
          font-size: var(--aig-text-size-xs);
          word-break: break-all;
        }
        .aig-filetree-panel__link {
          color: var(--aig-accent);
          text-decoration: none;
          font-size: var(--aig-text-size-sm);
        }
      `}</style>
    </div>
  );
}
