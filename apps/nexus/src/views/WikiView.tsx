import { marked } from "marked";
import mermaid from "mermaid";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { loadWikiPage } from "../data/gitnexus.js";
import type { WikiPage } from "../data/gitnexus.js";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    darkMode: true,
    primaryColor: "#1A1A1A",
    primaryTextColor: "#EAEAEA",
    primaryBorderColor: "#333",
    lineColor: "#666",
    secondaryColor: "#111",
    tertiaryColor: "#0A0A0A",
  },
});

export function WikiView() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<WikiPage | null>(null);
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!slug) {
      return;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      const p = await loadWikiPage(slug ?? "");
      if (cancelled) {
        return;
      }
      if (!p) {
        setPage(null);
        setHtml("");
        setLoading(false);
        return;
      }
      setPage(p);
      const rendered = await marked.parse(p.markdown);
      setHtml(rendered);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!contentRef.current || !html) {
      return;
    }
    const els = contentRef.current.querySelectorAll(".language-mermaid, .mermaid");
    for (const el of Array.from(els)) {
      const code = el.textContent || "";
      const id = `mermaid-${Math.random().toString(36).slice(2)}`;
      mermaid
        .render(id, code)
        .then(({ svg }) => {
          const wrapper = document.createElement("div");
          wrapper.className = "mermaid";
          wrapper.innerHTML = svg;
          el.replaceWith(wrapper);
        })
        .catch(() => {
          // ignore mermaid errors
        });
    }
  }, [html]);

  if (loading) {
    return <div style={{ color: "var(--text-tertiary)", padding: 40 }}>Loading wiki page…</div>;
  }

  if (!page) {
    return (
      <div style={{ padding: 40 }}>
        <h2 style={{ marginBottom: 16 }}>Page not found</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
          No wiki page exists for <code>{slug}</code>.
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          style={{
            padding: "8px 16px",
            borderRadius: "var(--radius-sm)",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            cursor: "pointer",
          }}
        >
          Return to Overview
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 820 }}>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--text-tertiary)",
            marginBottom: 8,
          }}
        >
          Wiki
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>{page.title}</h1>
      </div>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: trusted markdown from gitnexus wiki */}
      <div ref={contentRef} className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
