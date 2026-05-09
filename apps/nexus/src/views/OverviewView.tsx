import { useNavigate } from "react-router-dom";
import { getAgentColor, getCategoryLabel, getModuleCategory } from "../data/gitnexus.js";
import type { ModuleNode } from "../data/gitnexus.js";
import { useNexusStore } from "../store.js";

function countModules(nodes: ModuleNode[]): number {
  return nodes.reduce((acc, n) => acc + 1 + (n.children ? countModules(n.children) : 0), 0);
}

function countFiles(nodes: ModuleNode[]): number {
  return nodes.reduce(
    (acc, n) => acc + n.files.length + (n.children ? countFiles(n.children) : 0),
    0
  );
}

export function OverviewView() {
  const meta = useNexusStore((s) => s.meta);
  const tree = useNexusStore((s) => s.tree);
  const pages = useNexusStore((s) => s.pages);
  const isLoading = useNexusStore((s) => s.isLoading);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div style={{ color: "var(--text-tertiary)", padding: 40 }}>
        Initializing GitNexus knowledge graph…
      </div>
    );
  }

  const modules = tree ? countModules(tree) : 0;
  const files = tree ? countFiles(tree) : 0;
  const commit = meta?.fromCommit?.slice(0, 7) ?? "—";

  const packages = tree?.filter((n) => getModuleCategory(n.slug) === "package") ?? [];
  const apps = tree?.filter((n) => getModuleCategory(n.slug) === "app") ?? [];
  const agents =
    tree
      ?.find((n) => n.slug === "other")
      ?.children?.filter((n) => n.slug.startsWith("other-agents-")) ?? [];

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8 }}>
          Knowledge Graph
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
          SynapTree-mapped view of the Aigency monorepo. Explore modules, agents, and their
          relationships.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <StatCard label="Modules" value={modules} accent="var(--accent-zenith)" />
        <StatCard label="Files Indexed" value={files} accent="var(--accent-vector)" />
        <StatCard label="Wiki Pages" value={pages.length} accent="var(--accent-echo)" />
        <StatCard label="Commit" value={commit} accent="var(--accent-cipher)" monospace />
      </div>

      <Section title="Packages" color="var(--accent-zenith)">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          {packages.map((pkg) => (
            <ModuleCard key={pkg.slug} node={pkg} onClick={() => navigate(`/wiki/${pkg.slug}`)} />
          ))}
        </div>
      </Section>

      <Section title="Apps" color="var(--accent-atlas)">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          {apps.map((app) => (
            <ModuleCard key={app.slug} node={app} onClick={() => navigate(`/wiki/${app.slug}`)} />
          ))}
        </div>
      </Section>

      <Section title="Agents" color="var(--accent-cipher)">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          {agents.map((agent) => {
            const name = agent.name.replace(/^Other — /, "").replace(/^agents-/, "");
            return (
              <AgentCard
                key={agent.slug}
                name={name}
                color={getAgentColor(name)}
                onClick={() => navigate(`/wiki/${agent.slug}`)}
              />
            );
          })}
        </div>
      </Section>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  monospace,
}: {
  label: string;
  value: string | number;
  accent: string;
  monospace?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: accent,
          boxShadow: `0 0 12px ${accent}`,
        }}
      />
      <div
        style={{
          fontSize: 11,
          color: "var(--text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: "var(--text-primary)",
          fontFamily: monospace ? "var(--font-mono)" : "inherit",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Section({
  title,
  color,
  children,
}: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 4,
            height: 20,
            borderRadius: 2,
            background: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ModuleCard({ node, onClick }: { node: ModuleNode; onClick: () => void }) {
  const cat = getModuleCategory(node.slug);
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "16px",
        cursor: "pointer",
        textAlign: "left",
        color: "inherit",
        fontFamily: "inherit",
        transition: "border-color 0.15s, transform 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-hover)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "var(--text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 6,
        }}
      >
        {getCategoryLabel(cat)}
      </div>
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{node.name}</div>
      <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
        {node.files.length} file{node.files.length !== 1 ? "s" : ""}
      </div>
    </button>
  );
}

function AgentCard({ name, color, onClick }: { name: string; color: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "16px",
        cursor: "pointer",
        textAlign: "left",
        color: "inherit",
        fontFamily: "inherit",
        transition: "border-color 0.15s, transform 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 10px ${color}`,
          }}
        />
        <div style={{ fontWeight: 600, fontSize: 15 }}>{name}</div>
      </div>
      <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Agent</div>
    </button>
  );
}
