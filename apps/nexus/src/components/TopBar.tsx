import { useNavigate } from "react-router-dom";
import { useNexusStore } from "../store.js";

export function TopBar() {
  const searchQuery = useNexusStore((s) => s.searchQuery);
  const setSearchQuery = useNexusStore((s) => s.setSearchQuery);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate("/search");
    }
  };

  return (
    <header
      style={{
        height: 52,
        background: "var(--glass-bg)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--glass-border)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 16,
        zIndex: 20,
      }}
    >
      <form onSubmit={handleSubmit} style={{ flex: 1, maxWidth: 420 }}>
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-tertiary)",
              fontSize: 14,
            }}
          >
            ⚲
          </span>
          <input
            type="text"
            placeholder="Search modules, agents, code…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              paddingLeft: 34,
              paddingRight: 12,
              height: 34,
              fontSize: 13,
              background: "var(--surface-2)",
            }}
          />
        </div>
      </form>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        <StatusBadge label="main" color="var(--accent-zenith)" />
        <StatusBadge label="GitNexus" color="var(--accent-cipher)" />
      </div>
    </header>
  );
}

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 20,
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        fontSize: 11,
        fontWeight: 500,
        color: "var(--text-secondary)",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 6px ${color}`,
        }}
      />
      {label}
    </div>
  );
}
