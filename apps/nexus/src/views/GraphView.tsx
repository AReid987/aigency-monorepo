import Graph from "graphology";
import { BookOpen, Filter, Maximize, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Sigma from "sigma";
import {
  type ModuleNode,
  getCategoryColor,
  getCategoryLabel,
  getModuleCategory,
} from "../data/gitnexus";
import { useNexusStore } from "../store";

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  size: number;
  color: string;
  category: ReturnType<typeof getModuleCategory>;
  fileCount: number;
  children: string[];
}

interface GraphLink {
  source: string;
  target: string;
  type: "parent" | "reference";
}

type Category = ReturnType<typeof getModuleCategory>;

const ALL_CATEGORIES: Category[] = ["app", "package", "agent", "other"];

const EDGE_PARENT_COLOR = "#60a5fa";
const EDGE_REFERENCE_COLOR = "#22d3ee";
const EDGE_HOVER_COLOR = "#ffffff";
const EDGE_DEFAULT_SIZE = 5;

function countFiles(n: ModuleNode): number {
  return (n.files?.length ?? 0) + (n.children ?? []).reduce((sum, c) => sum + countFiles(c), 0);
}

function collectChildren(n: ModuleNode): string[] {
  return (n.children ?? []).flatMap((c) => [c.slug, ...collectChildren(c)]);
}

function buildGraph(tree: ModuleNode[]): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const added = new Set<string>();

  function addNode(n: ModuleNode, parentId?: string) {
    if (added.has(n.slug)) {
      return;
    }
    added.add(n.slug);
    const cat = getModuleCategory(n.slug);
    nodes.push({
      id: n.slug,
      label: n.name,
      x: 0,
      y: 0,
      size: cat === "agent" ? 14 : cat === "app" ? 18 : cat === "package" ? 16 : 12,
      color: getCategoryColor(cat),
      category: cat,
      fileCount: countFiles(n),
      children: collectChildren(n),
    });
    if (parentId) {
      links.push({ source: parentId, target: n.slug, type: "parent" });
    }
    for (const child of n.children ?? []) {
      addNode(child, n.slug);
    }
  }
  for (const root of tree) {
    addNode(root);
  }

  for (const a of nodes) {
    for (const b of nodes) {
      if (a.id >= b.id) {
        continue;
      }
      if (a.category === "package" && b.category === "app") {
        if (a.id.includes(b.id) || b.id.includes(a.id)) {
          links.push({ source: a.id, target: b.id, type: "reference" });
        }
      }
    }
  }
  return { nodes, links };
}

function circularInitialLayout(nodes: GraphNode[]) {
  const count = nodes.length;
  const radius = Math.max(120, count * 18);
  nodes.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / Math.max(1, count);
    n.x = Math.cos(angle) * radius;
    n.y = Math.sin(angle) * radius;
  });
}

function runForceLayout(nodes: GraphNode[], links: GraphLink[], iterations = 400) {
  for (let i = 0; i < iterations; i++) {
    for (let a = 0; a < nodes.length; a++) {
      for (let b = a + 1; b < nodes.length; b++) {
        const na = nodes[a];
        const nb = nodes[b];
        let dx = na.x - nb.x;
        let dy = na.y - nb.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const repulsion = (220 * 220) / (dist * dist);
        dx = (dx / dist) * repulsion;
        dy = (dy / dist) * repulsion;
        na.x += dx * 0.05;
        na.y += dy * 0.05;
        nb.x -= dx * 0.05;
        nb.y -= dy * 0.05;

        // collision/overlap correction
        const minDist = 28;
        if (dist < minDist) {
          const overlap = ((minDist - dist) / dist) * 0.5;
          const ox = (na.x - nb.x) * overlap;
          const oy = (na.y - nb.y) * overlap;
          na.x += ox;
          na.y += oy;
          nb.x -= ox;
          nb.y -= oy;
        }
      }
    }
    for (const link of links) {
      const na = nodes.find((n) => n.id === link.source);
      const nb = nodes.find((n) => n.id === link.target);
      if (!na || !nb) {
        continue;
      }
      let dx = nb.x - na.x;
      let dy = nb.y - na.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist * dist) / 2000;
      dx = (dx / dist) * force;
      dy = (dy / dist) * force;
      na.x += dx * 0.05;
      na.y += dy * 0.05;
      nb.x -= dx * 0.05;
      nb.y -= dy * 0.05;
    }
    for (const n of nodes) {
      n.x += (0 - n.x) * 0.008;
      n.y += (0 - n.y) * 0.008;
    }
  }
}

function resolveColor(value: string): string {
  if (value.startsWith("var(")) {
    const name = value.slice(4, -1).trim();
    const resolved = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return resolved || value;
  }
  return value;
}

function findNode(tree: ModuleNode[], slug: string): ModuleNode | null {
  for (const n of tree) {
    if (n.slug === slug) {
      return n;
    }
    if (n.children) {
      const found = findNode(n.children, slug);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

export function GraphView() {
  const tree = useNexusStore((s) => s.tree);
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [visible, setVisible] = useState<Set<Category>>(new Set(ALL_CATEGORIES));
  const [query, setQuery] = useState("");

  const { nodes, links, nodeMap } = useMemo(() => {
    if (!tree) {
      return { nodes: [], links: [], nodeMap: new Map<string, GraphNode>() };
    }
    const g = buildGraph(tree);
    circularInitialLayout(g.nodes);
    runForceLayout(g.nodes, g.links);
    const map = new Map(g.nodes.map((n) => [n.id, n]));
    return { nodes: g.nodes, links: g.links, nodeMap: map };
  }, [tree]);

  const suggestions = useMemo(() => {
    if (!query.trim()) {
      return [];
    }
    const q = query.toLowerCase();
    return nodes
      .filter((n) => n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, nodes]);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) {
      return;
    }
    const graph = new Graph();
    for (const n of nodes) {
      graph.addNode(n.id, {
        label: n.label,
        x: n.x,
        y: n.y,
        size: n.size,
        color: resolveColor(n.color),
      });
    }
    for (const l of links) {
      if (graph.hasNode(l.source) && graph.hasNode(l.target)) {
        const color = l.type === "reference" ? EDGE_REFERENCE_COLOR : EDGE_PARENT_COLOR;
        graph.addEdge(l.source, l.target, {
          size: EDGE_DEFAULT_SIZE,
          color,
          type: "arrow",
          kind: l.type,
        });
      }
    }

    const renderer = new Sigma(graph, containerRef.current, {
      renderLabels: true,
      labelSize: 12,
      labelWeight: "500",
      labelColor: { color: "#e2e8f0" },
      defaultNodeColor: "#94a3b8",
      defaultEdgeColor: EDGE_PARENT_COLOR,
      defaultEdgeType: "arrow",
      hideEdgesOnMove: false,
      hideLabelsOnMove: false,
      allowInvalidContainer: true,
      enableEdgeEvents: true,
      itemSizesReference: "screen",
      minEdgeThickness: 3,
    });

    renderer.on("enterNode", ({ node }) => setHovered(node));
    renderer.on("leaveNode", () => setHovered(null));
    renderer.on("clickNode", ({ node }) => setSelected(node));
    renderer.on("enterEdge", ({ edge }) => setHoveredEdge(edge));
    renderer.on("leaveEdge", () => setHoveredEdge(null));

    sigmaRef.current = renderer;
    return () => {
      renderer.kill();
      sigmaRef.current = null;
    };
  }, [nodes, links]);

  useEffect(() => {
    const renderer = sigmaRef.current;
    if (!renderer) {
      return;
    }
    const graph = renderer.getGraph();
    graph.forEachEdge((edge) => {
      const kind = graph.getEdgeAttribute(edge, "kind") as "parent" | "reference" | undefined;
      const isHovered = edge === hoveredEdge;
      graph.setEdgeAttribute(
        edge,
        "color",
        isHovered
          ? EDGE_HOVER_COLOR
          : kind === "reference"
            ? EDGE_REFERENCE_COLOR
            : EDGE_PARENT_COLOR
      );
      graph.setEdgeAttribute(edge, "size", isHovered ? 6 : EDGE_DEFAULT_SIZE);
    });
    renderer.refresh();
  }, [hoveredEdge]);

  useEffect(() => {
    const renderer = sigmaRef.current;
    if (!renderer) {
      return;
    }
    const graph = renderer.getGraph();
    graph.forEachNode((node) => {
      const cat = nodeMap.get(node)?.category ?? "other";
      graph.setNodeAttribute(node, "hidden", !visible.has(cat));
    });
    graph.forEachEdge((edge) => {
      const src = graph.source(edge);
      const tgt = graph.target(edge);
      graph.setEdgeAttribute(
        edge,
        "hidden",
        !visible.has(nodeMap.get(src)?.category ?? "other") ||
          !visible.has(nodeMap.get(tgt)?.category ?? "other")
      );
    });
    renderer.refresh();
  }, [visible, nodeMap]);

  const focusNode = (slug: string) => {
    const renderer = sigmaRef.current;
    const n = nodeMap.get(slug);
    if (!renderer || !n) {
      return;
    }
    renderer.getCamera().animate({ x: n.x, y: n.y, ratio: 0.5 }, { duration: 350 });
    setSelected(slug);
    setQuery("");
  };

  const resetCamera = () => {
    sigmaRef.current?.getCamera().animate({ x: 0, y: 0, ratio: 1 }, { duration: 350 });
  };

  const toggleCategory = (cat: Category) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const selectedNode = selected ? nodeMap.get(selected) : null;
  const selectedSource = selected && tree ? findNode(tree, selected) : null;

  if (!tree) {
    return <div className="aig-loading">Loading graph…</div>;
  }

  return (
    <div className="aig-graph">
      <div className="aig-graph__header">
        <div>
          <h1 className="aig-view__title">Relationship Graph</h1>
          <p className="aig-graph__subtitle">
            {nodes.length} modules · {links.length} relationships · pan, zoom, and click nodes to
            inspect
          </p>
        </div>
        <div className="aig-graph__controls">
          <div className="aig-graph__search">
            <Search size={14} strokeWidth={1.5} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find module…"
              className="aig-graph__search-input"
            />
            {suggestions.length > 0 && (
              <div className="aig-graph__suggestions">
                {suggestions.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className="aig-graph__suggestion"
                    onClick={() => focusNode(n.id)}
                  >
                    <span className="aig-graph__suggestion-dot" style={{ background: n.color }} />
                    {n.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            className="aig-button aig-button--ghost"
            onClick={resetCamera}
            title="Reset view"
          >
            <Maximize size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="aig-graph__body">
        <div
          ref={containerRef}
          className="aig-graph__stage"
          role="img"
          aria-label="Module relationship graph"
        />

        {selectedNode && (
          <aside className="aig-graph__panel">
            <div className="aig-graph__panel-header">
              <h3 className="aig-graph__panel-title">{selectedNode.label}</h3>
              <button
                type="button"
                className="aig-button aig-button--ghost"
                onClick={() => setSelected(null)}
                aria-label="Close"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
            <div className="aig-graph__panel-body">
              <div className="aig-graph__panel-row">
                <span className="aig-text-pixel">Type</span>
                <span className="aig-tag" style={{ color: selectedNode.color }}>
                  {getCategoryLabel(selectedNode.category)}
                </span>
              </div>
              <div className="aig-graph__panel-row">
                <span className="aig-text-pixel">Files</span>
                <span className="aig-text-mono">{selectedNode.fileCount}</span>
              </div>
              <div className="aig-graph__panel-row">
                <span className="aig-text-pixel">Children</span>
                <span className="aig-text-mono">{selectedNode.children.length}</span>
              </div>
              {selectedSource && selectedSource.files.length > 0 && (
                <div className="aig-graph__panel-section">
                  <span className="aig-text-pixel">Top files</span>
                  <ul className="aig-graph__file-list">
                    {selectedSource.files.slice(0, 6).map((f) => (
                      <li key={f} className="aig-text-mono">
                        {f.split("/").pop()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="aig-graph__panel-actions">
                <Link href={`/wiki/${selectedNode.id}`} className="aig-button">
                  <BookOpen size={14} strokeWidth={1.5} />
                  Open Wiki
                </Link>
              </div>
            </div>
          </aside>
        )}
      </div>

      <div className="aig-graph__footer">
        <div className="aig-graph__legend">
          <Filter size={12} strokeWidth={1.5} />
          {ALL_CATEGORIES.map((cat) => {
            const active = visible.has(cat);
            return (
              <button
                key={cat}
                type="button"
                className={`aig-legend-item ${active ? "" : "aig-legend-item--dim"}`}
                onClick={() => toggleCategory(cat)}
                title={active ? `Hide ${cat}` : `Show ${cat}`}
              >
                <span
                  className="aig-legend-item__dot"
                  style={{
                    background: active ? getCategoryColor(cat) : "var(--aig-foreground-muted)",
                  }}
                />
                <span>{getCategoryLabel(cat)}</span>
              </button>
            );
          })}
        </div>
        {hovered && <div className="aig-graph__hover aig-text-pixel">{hovered}</div>}
        {hoveredEdge && <div className="aig-graph__hover aig-text-pixel">{hoveredEdge}</div>}
      </div>

      <style>{`
        .aig-graph { height: 100%; display: flex; flex-direction: column; }
        .aig-graph__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .aig-graph__subtitle {
          color: var(--aig-foreground-muted);
          font-size: var(--aig-text-size-sm);
          margin: 6px 0 0;
        }
        .aig-graph__controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .aig-graph__search {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          background: var(--aig-surface);
          box-shadow: var(--aig-border-subtle);
        }
        .aig-graph__search svg { color: var(--aig-foreground-muted); }
        .aig-graph__search-input {
          background: transparent;
          border: none;
          outline: none;
          color: var(--aig-foreground);
          font-family: var(--aig-font-mono);
          font-size: var(--aig-text-size-sm);
          width: 180px;
        }
        .aig-graph__search-input::placeholder { color: var(--aig-foreground-muted); }
        .aig-graph__suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          z-index: 10;
          background: var(--aig-void-raised);
          box-shadow: var(--aig-border-medium);
          margin-top: 4px;
          max-height: 220px;
          overflow: auto;
        }
        .aig-graph__suggestion {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 8px 10px;
          background: transparent;
          border: none;
          color: var(--aig-foreground);
          font-size: var(--aig-text-size-sm);
          text-align: left;
          cursor: pointer;
        }
        .aig-graph__suggestion:hover { background: var(--aig-surface); }
        .aig-graph__suggestion-dot { width: 8px; height: 8px; flex-shrink: 0; }
        .aig-graph__body {
          flex: 1;
          display: flex;
          gap: 16px;
          min-height: 0;
        }
        .aig-graph__stage {
          flex: 1;
          min-height: 420px;
          background: var(--aig-surface);
          box-shadow: var(--aig-border-subtle);
          position: relative;
          overflow: hidden;
        }
        .aig-graph__stage canvas { outline: none; }
        .aig-graph__panel {
          width: 280px;
          flex-shrink: 0;
          background: var(--aig-surface);
          box-shadow: var(--aig-border-subtle);
          display: flex;
          flex-direction: column;
        }
        .aig-graph__panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 16px;
          box-shadow: var(--aig-border-subtle);
        }
        .aig-graph__panel-title {
          font-family: var(--aig-font-display);
          font-size: var(--aig-text-size-md);
          font-weight: 600;
          color: var(--aig-foreground);
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .aig-graph__panel-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          overflow: auto;
        }
        .aig-graph__panel-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: var(--aig-text-size-sm);
        }
        .aig-graph__panel-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .aig-graph__file-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .aig-graph__file-list li {
          font-size: var(--aig-text-size-xs);
          color: var(--aig-foreground-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .aig-graph__panel-actions {
          margin-top: auto;
          padding-top: 8px;
        }
        .aig-graph__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 16px;
          flex-wrap: wrap;
        }
        .aig-graph__legend {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          color: var(--aig-foreground-muted);
        }
        .aig-legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: var(--aig-text-size-xs);
          color: var(--aig-foreground-muted);
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        .aig-legend-item--dim { opacity: 0.5; }
        .aig-legend-item__dot {
          width: 10px;
          height: 10px;
        }
        .aig-graph__hover {
          padding: 6px 10px;
          background: var(--aig-void-raised);
          box-shadow: var(--aig-border-subtle);
          font-size: var(--aig-text-size-xs);
          color: var(--aig-accent);
        }
      `}</style>
    </div>
  );
}
