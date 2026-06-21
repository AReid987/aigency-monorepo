import { useEffect } from "react";
import { useRouter } from "next/router";
import { MessageSquare, Radio, Search } from "lucide-react";
import { checkBackend } from "../services/backend-client";
import { useNexusStore } from "../store";
import { ProjectSwitcher } from "./ProjectSwitcher";

export function TopBar() {
  const router = useRouter();
  const query = useNexusStore((s) => s.searchQuery);
  const setQuery = useNexusStore((s) => s.setSearchQuery);
  const backend = useNexusStore((s) => s.backend);
  const setBackend = useNexusStore((s) => s.setBackend);
  const chatOpen = useNexusStore((s) => s.chatOpen);
  const setChatOpen = useNexusStore((s) => s.setChatOpen);
  const dataSource = useNexusStore((s) => s.dataSource);

  useEffect(() => {
    let mounted = true;
    checkBackend().then((status) => {
      if (mounted) setBackend({ online: status.online, version: status.version, lastChecked: Date.now() });
    });
    const id = setInterval(() => {
      checkBackend().then((status) => {
        if (mounted) setBackend({ online: status.online, version: status.version, lastChecked: Date.now() });
      });
    }, 30000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [setBackend]);

  const onSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="aig-topbar">
      <div className="aig-topbar__left">
        <ProjectSwitcher />
        <span className={`aig-status-dot ${backend.online ? "aig-status-dot--go" : ""}`} />
      </div>

      <div className="aig-topbar__center">
        <div className="aig-search">
          <Search size={14} strokeWidth={1.5} />
          <input
            type="text"
            className="aig-input aig-search__input"
            placeholder="Search symbols, files, modules…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onSearch}
            aria-label="Search"
          />
          <span className="aig-search__hint">Enter</span>
        </div>
      </div>

      <div className="aig-topbar__right">
        <div className="aig-topbar__status" title={backend.online ? `Backend online${backend.version ? ` v${backend.version}` : ""}` : "Backend offline — using static bundle"}>
          <Radio size={14} strokeWidth={1.5} />
          <span className="aig-text-pixel">{dataSource === "backend" ? "ONLINE" : "STATIC"}</span>
        </div>
        <button
          type="button"
          className={`aig-button ${chatOpen ? "aig-button--primary" : ""}`}
          onClick={() => setChatOpen(!chatOpen)}
          aria-pressed={chatOpen}
        >
          <MessageSquare size={14} />
          <span>IRIS</span>
        </button>
      </div>

      <style>{`
        .aig-topbar {
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 0 16px;
          background: var(--aig-surface);
          box-shadow: var(--aig-border-subtle);
          z-index: 10;
        }
        .aig-topbar__left,
        .aig-topbar__right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .aig-topbar__center {
          flex: 1;
          max-width: 560px;
        }
        .aig-repo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 12px;
          background: var(--aig-void-raised);
          box-shadow: var(--aig-border-subtle);
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
        .aig-search {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 12px;
          background: var(--aig-void-base);
          box-shadow: inset 0 0 0 1px var(--aig-fence-light);
          transition: box-shadow var(--aig-timing-signal-state) var(--aig-ease-out-expo);
        }
        .aig-search:focus-within {
          box-shadow: inset 0 0 0 1px var(--aig-accent-dim), 0 0 0 2px var(--aig-accent-glow);
        }
        .aig-search__input {
          flex: 1;
          background: transparent;
          box-shadow: none;
          padding-left: 0;
        }
        .aig-search__input:focus {
          box-shadow: none;
        }
        .aig-search__hint {
          font-family: var(--aig-font-pixel);
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--aig-foreground-ghost);
          padding: 2px 5px;
          background: var(--aig-void-raised);
          box-shadow: var(--aig-border-subtle);
        }
        .aig-topbar__status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: var(--aig-text-size-xs);
          color: var(--aig-foreground-muted);
        }
        .aig-status-dot--go {
          background: var(--aig-signal-go);
          box-shadow: 0 0 8px oklch(0.72 0.170 160 / 0.35);
        }
      `}</style>
    </header>
  );
}
