import Fuse from "fuse.js";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getAgentColor, getCategoryLabel, getModuleCategory } from "../data/gitnexus.js";
import { useNexusStore } from "../store.js";

export function SearchView() {
  const query = useNexusStore((s) => s.searchQuery);
  const pages = useNexusStore((s) => s.pages);
  const tree = useNexusStore((s) => s.tree);
  const navigate = useNavigate();

  const results = useMemo(() => {
    if (!query.trim()) {
      return [];
    }
    const fuse = new Fuse(pages, {
      keys: [
        { name: "title", weight: 0.4 },
        { name: "slug", weight: 0.2 },
        { name: "markdown", weight: 0.4 },
      ],
      threshold: 0.35,
      includeMatches: true,
      includeScore: true,
    });
    return fuse.search(query.trim()).slice(0, 20);
  }, [query, pages]);

  const moduleResults = useMemo(() => {
    if (!query.trim() || !tree) {
      return [];
    }
    const flat: { name: string; slug: string; cat: ReturnType<typeof getModuleCategory> }[] = [];
    function walk(nodes: typeof tree) {
      for (const n of nodes ?? []) {
        flat.push({ name: n.name, slug: n.slug, cat: getModuleCategory(n.slug) });
        if (n.children) {
          walk(n.children);
        }
      }
    }
    walk(tree);
    const fuse = new Fuse(flat, { keys: ["name", "slug"], threshold: 0.3 });
    return fuse.search(query.trim()).slice(0, 10);
  }, [query, tree]);

  if (!query.trim()) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-tertiary)" }}>
        <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>⚲</div>
        <div style={{ fontSize: 16 }}>
          Type a query above to search across modules and wiki content.
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>Results for “{query}”</h1>
        <p style={{ color: "var(--text-tertiary)", fontSize: 13, marginTop: 4 }}>
          {results.length} wiki hit{results.length !== 1 ? "s" : ""} · {moduleResults.length} module
          hit{moduleResults.length !== 1 ? "s" : ""}
        </p>
      </div>

      {moduleResults.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <SectionLabel label="Modules" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {moduleResults.map(({ item }) => (
              <ResultRow
                key={item.slug}
                title={item.name}
                meta={getCategoryLabel(item.cat)}
                color={item.cat === "agent" ? getAgentColor(item.name) : "var(--accent-zenith)"}
                onClick={() => navigate(`/wiki/${item.slug}`)}
              />
            ))}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div>
          <SectionLabel label="Wiki Content" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {results.map(({ item, matches }) => {
              const match = matches?.find((m) => m.key === "markdown");
              const snippet = match
                ? `…${match.value?.slice(Math.max(0, match.indices[0]?.[0] - 40), match.indices[0]?.[0] + 120)}…`
                : `${item.markdown.slice(0, 140)}…`;
              return (
                <ResultRow
                  key={item.slug}
                  title={item.title}
                  meta={snippet}
                  color="var(--text-secondary)"
                  onClick={() => navigate(`/wiki/${item.slug}`)}
                />
              );
            })}
          </div>
        </div>
      )}

      {results.length === 0 && moduleResults.length === 0 && (
        <div style={{ color: "var(--text-tertiary)", padding: 40, textAlign: "center" }}>
          No results found.
        </div>
      )}
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "var(--text-tertiary)",
        marginBottom: 12,
      }}
    >
      {label}
    </div>
  );
}

function ResultRow({
  title,
  meta,
  color,
  onClick,
}: {
  title: string;
  meta: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "14px 16px",
        background: "var(--surface-1)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        cursor: "pointer",
        textAlign: "left",
        color: "inherit",
        fontFamily: "inherit",
        width: "100%",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          marginTop: 5,
          flexShrink: 0,
          boxShadow: `0 0 6px ${color}`,
        }}
      />
      <div style={{ minWidth: 0 }}>
        <div
          style={{ fontWeight: 500, fontSize: 14, marginBottom: 2, color: "var(--text-primary)" }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--text-tertiary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={meta}
        >
          {meta}
        </div>
      </div>
    </button>
  );
}
