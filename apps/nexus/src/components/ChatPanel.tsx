import Fuse from "fuse.js";
import type { FuseResult, FuseResultMatch } from "fuse.js";
import { useRef, useState } from "react";
import { Send, X } from "lucide-react";
import type { WikiPage } from "../data/gitnexus";
import { useNexusStore } from "../store";

interface Message {
  role: "user" | "agent";
  text: string;
  sources?: { slug: string; title: string }[];
}

function buildAnswer(question: string, pages: WikiPage[]): { text: string; sources: { slug: string; title: string }[] } {
  if (pages.length === 0) {
    return {
      text: "No wiki pages are loaded for the active project. Switch to a project with indexed data and try again.",
      sources: [],
    };
  }

  const fuse = new Fuse(pages, {
    keys: [
      { name: "title", weight: 0.45 },
      { name: "slug", weight: 0.25 },
      { name: "markdown", weight: 0.3 },
    ],
    threshold: 0.45,
    includeMatches: true,
  });

  const hits = fuse.search(question.trim()).slice(0, 4) as FuseResult<WikiPage>[];
  if (hits.length === 0) {
    return {
      text: `I searched the loaded wiki graph but didn’t find a strong match for “${question}”. Try a different keyword or browse the wiki index.`,
      sources: [],
    };
  }

  const sources = hits.map(({ item }) => ({ slug: item.slug, title: item.title }));

  const summary = hits
    .map(({ item, matches }) => {
      const match = matches?.find((m: FuseResultMatch) => m.key === "markdown");
      const snippet = match
        ? `…${match.value?.slice(Math.max(0, match.indices[0]?.[0] - 60), match.indices[0]?.[0] + 160)}…`
        : `${item.markdown?.slice(0, 220).replace(/\n/g, " ") ?? ""}…`;
      return `**${item.title}** — ${snippet}`;
    })
    .join("\n\n");

  return {
    text: `Here’s what I found in the static wiki graph for “${question}”:\n\n${summary}`,
    sources,
  };
}

export function ChatPanel() {
  const chatOpen = useNexusStore((s) => s.chatOpen);
  const setChatOpen = useNexusStore((s) => s.setChatOpen);
  const pages = useNexusStore((s) => s.pages);
  const backend = useNexusStore((s) => s.backend);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "agent",
      text: backend.online
        ? "IRIS online. Backend bridge connected. I can reason over live symbols, impact, and process data."
        : "IRIS online. No backend bridge detected — answering from the bundled static wiki graph.",
    },
  ]);
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const send = () => {
    if (!input.trim()) return;
    const question = input.trim();
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setThinking(true);

    setTimeout(() => {
      const { text, sources } = buildAnswer(question, pages);
      setMessages((m) => [...m, { role: "agent", text, sources }]);
      setThinking(false);
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 400 + Math.random() * 300);
  };

  if (!chatOpen) return null;

  return (
    <aside className="aig-chat">
      <div className="aig-chat__header">
        <div className="aig-chat__title">
          <span className={`aig-status-dot ${backend.online ? "aig-status-dot--live" : ""}`} />
          <span className="aig-text-pixel">IRIS Agent</span>
          <span className="aig-chat__mode aig-text-mono">{backend.online ? "LIVE" : "STATIC"}</span>
        </div>
        <button type="button" className="aig-button aig-button--ghost" onClick={() => setChatOpen(false)} aria-label="Close chat">
          <X size={14} />
        </button>
      </div>

      <div className="aig-chat__body">
        {messages.map((m, i) => (
          <div key={i} className={`aig-chat__bubble aig-chat__bubble--${m.role}`}>
            <div className="aig-chat__bubble-text">{m.text}</div>
            {m.sources && m.sources.length > 0 && (
              <div className="aig-chat__sources">
                {m.sources.map((s) => (
                  <a key={s.slug} href={`#/wiki/${s.slug}`} className="aig-chat__source aig-text-mono">
                    {s.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {thinking && <div className="aig-chat__thinking aig-text-pixel">Processing…</div>}
        <div ref={endRef} />
      </div>

      <div className="aig-chat__footer">
        <input
          type="text"
          className="aig-input"
          placeholder="Ask about the codebase…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={thinking}
        />
        <button type="button" className="aig-button aig-button--primary" onClick={send} aria-label="Send" disabled={thinking}>
          <Send size={14} />
        </button>
      </div>

      <style>{`
        .aig-chat {
          width: 360px;
          min-width: 360px;
          display: flex;
          flex-direction: column;
          background: var(--aig-surface);
          box-shadow: var(--aig-border-subtle);
          z-index: 10;
        }
        .aig-chat__header {
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          border-bottom: 1px solid var(--aig-fence-light);
        }
        .aig-chat__title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: var(--aig-text-size-sm);
          color: var(--aig-foreground);
        }
        .aig-chat__mode {
          font-size: var(--aig-text-size-xs);
          color: var(--aig-foreground-muted);
          margin-left: 4px;
        }
        .aig-status-dot {
          width: 7px;
          height: 7px;
          background: var(--aig-foreground-muted);
          box-shadow: 0 0 6px var(--aig-foreground-muted);
        }
        .aig-status-dot--live {
          background: var(--aig-signal-go);
          box-shadow: 0 0 6px var(--aig-signal-go);
        }
        .aig-chat__body {
          flex: 1;
          overflow: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .aig-chat__bubble {
          max-width: 94%;
          padding: 12px;
          font-size: var(--aig-text-size-sm);
          line-height: 1.5;
          box-shadow: var(--aig-border-subtle);
          white-space: pre-wrap;
        }
        .aig-chat__bubble--agent {
          align-self: flex-start;
          background: var(--aig-void-raised);
          color: var(--aig-foreground-body);
          border-left: 2px solid var(--aig-accent);
        }
        .aig-chat__bubble--user {
          align-self: flex-end;
          background: var(--aig-accent-dim);
          color: var(--aig-void-base);
        }
        .aig-chat__bubble-text {
          margin-bottom: 10px;
        }
        .aig-chat__bubble-text:last-child {
          margin-bottom: 0;
        }
        .aig-chat__sources {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .aig-chat__source {
          font-size: var(--aig-text-size-xs);
          color: var(--aig-accent);
          text-decoration: none;
          padding: 2px 6px;
          background: var(--aig-surface);
          box-shadow: var(--aig-border-subtle);
        }
        .aig-chat__source:hover {
          box-shadow: var(--aig-border-medium);
        }
        .aig-chat__thinking {
          align-self: flex-start;
          font-size: var(--aig-text-size-xs);
          color: var(--aig-accent);
          padding: 6px 0;
        }
        .aig-chat__footer {
          display: flex;
          gap: 8px;
          padding: 12px;
          border-top: 1px solid var(--aig-fence-light);
        }
      `}</style>
    </aside>
  );
}
