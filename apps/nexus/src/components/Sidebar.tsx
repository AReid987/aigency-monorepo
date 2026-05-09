import { useState } from "react";
import { NavLink } from "react-router-dom";
import { getAgentColor, getModuleCategory } from "../data/gitnexus.js";
import type { ModuleNode } from "../data/gitnexus.js";
import { useNexusStore } from "../store.js";

function NavItem({
  to,
  icon,
  label,
  color,
}: {
  to: string;
  icon: string;
  label: string;
  color?: string;
}) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        borderRadius: 8,
        color: isActive ? "#fff" : "var(--text-secondary)",
        background: isActive ? "var(--surface-2)" : "transparent",
        borderLeft: isActive
          ? `3px solid ${color || "var(--accent-zenith)"}`
          : "3px solid transparent",
        textDecoration: "none",
        fontSize: 13,
        fontWeight: isActive ? 500 : 400,
        transition: "all 0.15s ease",
      })}
    >
      <span style={{ fontSize: 16, opacity: 0.9 }}>{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

function TreeNode({ node, depth = 0 }: { node: ModuleNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = (node.children?.length ?? 0) > 0;
  const cat = getModuleCategory(node.slug);
  const color =
    cat === "agent"
      ? getAgentColor(node.name)
      : cat === "app"
        ? "var(--accent-atlas)"
        : "var(--accent-zenith)";

  return (
    <div>
      <button
        type="button"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 0",
          paddingLeft: depth * 12,
          cursor: hasChildren ? "pointer" : "default",
          userSelect: "none",
          background: "none",
          border: "none",
          color: "inherit",
          fontFamily: "inherit",
          fontSize: "inherit",
          width: "100%",
          textAlign: "left",
        }}
        onClick={() => {
          if (hasChildren) {
            setOpen((o) => !o);
          }
        }}
        aria-expanded={open}
      >
        {hasChildren && (
          <span style={{ fontSize: 10, color: "var(--text-tertiary)", width: 14 }}>
            {open ? "▼" : "▶"}
          </span>
        )}
        {!hasChildren && <span style={{ width: 14 }} />}
        <NavLink
          to={`/wiki/${node.slug}`}
          style={({ isActive }) => ({
            flex: 1,
            color: isActive ? color : "var(--text-secondary)",
            textDecoration: "none",
            fontSize: 12.5,
            fontWeight: isActive ? 500 : 400,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          })}
        >
          {node.name}
        </NavLink>
      </button>
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

  return (
    <aside
      style={{
        width: 260,
        minWidth: 260,
        background: "var(--surface-1)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "20px 16px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, var(--accent-zenith), var(--accent-vector))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            🜁
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em" }}>GitNexus</div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: -2 }}>
              Aigency Knowledge Graph
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        <NavItem to="/" icon="◈" label="Overview" color="var(--accent-zenith)" />
        <NavItem to="/search" icon="⚲" label="Search" color="var(--accent-echo)" />
        <NavItem to="/graph" icon="✦" label="Relations" color="var(--accent-vector)" />
      </div>

      <div style={{ borderTop: "1px solid var(--border)", margin: "8px 12px" }} />

      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "0 12px 16px",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--text-tertiary)",
            marginBottom: 6,
            marginTop: 4,
          }}
        >
          Modules
        </div>
        {isLoading && (
          <div style={{ color: "var(--text-tertiary)", fontSize: 12, padding: "8px 0" }}>
            Loading…
          </div>
        )}
        {tree?.map((node) => (
          <TreeNode key={node.slug} node={node} />
        ))}
      </div>

      <div
        style={{
          borderTop: "1px solid var(--border)",
          padding: "10px 16px",
          fontSize: 11,
          color: "var(--text-tertiary)",
        }}
      >
        SynapTree Design System
      </div>
    </aside>
  );
}
