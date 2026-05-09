import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAgentColor, getModuleCategory } from "../data/gitnexus.js";
import type { ModuleNode } from "../data/gitnexus.js";
import { useNexusStore } from "../store.js";

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  r: number;
  color: string;
  category: ReturnType<typeof getModuleCategory>;
}

interface GraphLink {
  source: string;
  target: string;
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
    const color =
      cat === "agent"
        ? getAgentColor(n.name.replace(/^Other — /, "").replace(/^agents-/, ""))
        : cat === "app"
          ? "var(--accent-atlas)"
          : cat === "package"
            ? "var(--accent-zenith)"
            : "var(--text-tertiary)";

    nodes.push({
      id: n.slug,
      label: n.name,
      x: Math.random() * 800,
      y: Math.random() * 600,
      r: cat === "agent" ? 10 : cat === "app" ? 14 : 12,
      color,
      category: cat,
    });

    if (parentId) {
      links.push({ source: parentId, target: n.slug });
    }

    for (const child of n.children ?? []) {
      addNode(child, n.slug);
    }
  }

  for (const root of tree) {
    addNode(root);
  }

  // Add cross-links between packages and apps based on slug similarity
  for (const a of nodes) {
    for (const b of nodes) {
      if (a.id >= b.id) {
        continue;
      }
      if (a.category === "package" && b.category === "app") {
        if (a.id.includes(b.id) || b.id.includes(a.id)) {
          links.push({ source: a.id, target: b.id });
        }
      }
    }
  }

  return { nodes, links };
}

function runForceLayout(nodes: GraphNode[], links: GraphLink[], iterations = 200) {
  const width = 900;
  const height = 600;
  const centerX = width / 2;
  const centerY = height / 2;

  for (let i = 0; i < iterations; i++) {
    // Repulsion
    for (let a = 0; a < nodes.length; a++) {
      for (let b = a + 1; b < nodes.length; b++) {
        const na = nodes[a];
        const nb = nodes[b];
        let dx = na.x - nb.x;
        let dy = na.y - nb.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (150 * 150) / (dist * dist);
        dx = (dx / dist) * force;
        dy = (dy / dist) * force;
        na.x += dx * 0.05;
        na.y += dy * 0.05;
        nb.x -= dx * 0.05;
        nb.y -= dy * 0.05;
      }
    }

    // Attraction
    for (const link of links) {
      const na = nodes.find((n) => n.id === link.source);
      const nb = nodes.find((n) => n.id === link.target);
      if (!na || !nb) {
        continue;
      }
      let dx = nb.x - na.x;
      let dy = nb.y - na.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist * dist) / 3000;
      dx = (dx / dist) * force;
      dy = (dy / dist) * force;
      na.x += dx * 0.05;
      na.y += dy * 0.05;
      nb.x -= dx * 0.05;
      nb.y -= dy * 0.05;
    }

    // Center gravity
    for (const n of nodes) {
      n.x += (centerX - n.x) * 0.005;
      n.y += (centerY - n.y) * 0.005;
    }
  }

  // Clamp
  for (const n of nodes) {
    n.x = Math.max(40, Math.min(width - 40, n.x));
    n.y = Math.max(40, Math.min(height - 40, n.y));
  }
}

export function GraphView() {
  const tree = useNexusStore((s) => s.tree);
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const { nodes, links } = useMemo(() => {
    if (!tree) {
      return { nodes: [], links: [] };
    }
    const g = buildGraph(tree);
    runForceLayout(g.nodes, g.links);
    return g;
  }, [tree]);

  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(
    new Map()
  );

  useEffect(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const n of nodes) {
      map.set(n.id, { x: n.x, y: n.y });
    }
    setNodePositions(map);
  }, [nodes]);

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    const pos = nodePositions.get(id);
    if (!pos) {
      return;
    }
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    dragOffset.current = {
      x: e.clientX - rect.left - pos.x,
      y: e.clientY - rect.top - pos.y,
    };
    setDragging(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) {
      return;
    }
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    const x = e.clientX - rect.left - dragOffset.current.x;
    const y = e.clientY - rect.top - dragOffset.current.y;
    setNodePositions((prev) => {
      const next = new Map(prev);
      next.set(dragging, { x, y });
      return next;
    });
  };

  const handleMouseUp = () => setDragging(null);

  if (!tree) {
    return <div style={{ color: "var(--text-tertiary)", padding: 40 }}>Loading graph…</div>;
  }

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Relationship Graph</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
          Interactive force-directed layout. Drag nodes to rearrange. Click to open wiki.
        </p>
      </div>

      <div
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 900 600"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            cursor: dragging ? "grabbing" : "default",
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          role="img"
          aria-label="Module relationship graph"
        >
          <title>Module Relationship Graph</title>
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width="900" height="600" fill="var(--canvas)" />

          {links.map((link) => {
            const sa = nodePositions.get(link.source) ?? { x: 0, y: 0 };
            const ta = nodePositions.get(link.target) ?? { x: 0, y: 0 };
            return (
              <line
                key={`${link.source}-${link.target}`}
                x1={sa.x}
                y1={sa.y}
                x2={ta.x}
                y2={ta.y}
                stroke="var(--border-hover)"
                strokeWidth={1}
                opacity={0.5}
              />
            );
          })}

          {nodes.map((n) => {
            const pos = nodePositions.get(n.id) ?? { x: n.x, y: n.y };
            const isHovered = hovered === n.id;
            return (
              <g
                key={n.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                onMouseDown={(e) => handleMouseDown(e, n.id)}
                onClick={() => navigate(`/wiki/${n.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/wiki/${n.id}`);
                  }
                }}
                tabIndex={0}
                aria-label={n.label}
              >
                <circle
                  r={n.r + (isHovered ? 4 : 0)}
                  fill={n.color}
                  opacity={0.15}
                  filter="url(#glow)"
                />
                <circle
                  r={n.r}
                  fill={n.color}
                  stroke={isHovered ? "#fff" : "none"}
                  strokeWidth={1.5}
                  filter={isHovered ? "url(#glow)" : undefined}
                />
                <text
                  y={n.r + 14}
                  textAnchor="middle"
                  fill={isHovered ? "var(--text-primary)" : "var(--text-secondary)"}
                  fontSize={11}
                  fontFamily="var(--font-sans)"
                  fontWeight={isHovered ? 500 : 400}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 20, flexWrap: "wrap" }}>
        <LegendItem color="var(--accent-zenith)" label="Package" />
        <LegendItem color="var(--accent-atlas)" label="App" />
        <LegendItem color="var(--accent-cipher)" label="Agent" />
        <LegendItem color="var(--text-tertiary)" label="Other" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12,
        color: "var(--text-secondary)",
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 6px ${color}`,
        }}
      />
      {label}
    </div>
  );
}
