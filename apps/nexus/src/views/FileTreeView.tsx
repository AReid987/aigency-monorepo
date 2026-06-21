import { ChevronDown, ChevronRight, FileCode, Folder } from "lucide-react";
import { useMemo, useState } from "react";
import { type ModuleNode, getCategoryColor, getModuleCategory } from "../data/gitnexus";
import { useNexusStore } from "../store";

function TreeItem({ node, depth = 0 }: { node: ModuleNode; depth?: number }) {
  const [open, setOpen] = useState(true);
  const hasChildren = (node.children?.length ?? 0) > 0;
  const hasFiles = (node.files?.length ?? 0) > 0;
  const cat = getModuleCategory(node.slug);
  const color = getCategoryColor(cat);

  return (
    <div>
      <button
        type="button"
        className="aig-filetree-node"
        style={{ paddingLeft: `${depth * 18}px` }}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {hasChildren || hasFiles ? (
          <span className="aig-filetree-chevron">
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        ) : (
          <span className="aig-filetree-chevron-placeholder" />
        )}
        <Folder size={14} style={{ color }} />
        <span className="aig-truncate">{node.name}</span>
        <span className="aig-tag aig-tag--small">{cat}</span>
      </button>

      {open && (
        <div>
          {node.files?.map((file) => (
            <div
              key={file}
              className="aig-filetree-file"
              style={{ paddingLeft: `${(depth + 1) * 18}px` }}
            >
              <span className="aig-filetree-chevron-placeholder" />
              <FileCode size={14} />
              <span className="aig-truncate aig-text-mono">{file}</span>
            </div>
          ))}
          {node.children?.map((child) => (
            <TreeItem key={child.slug} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTreeView() {
  const tree = useNexusStore((s) => s.tree);
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

      <div className="aig-filetree">
        {tree.map((node) => (
          <TreeItem key={node.slug} node={node} />
        ))}
      </div>

      <style>{`
        .aig-filetree {
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
          cursor: default;
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
      `}</style>
    </div>
  );
}
