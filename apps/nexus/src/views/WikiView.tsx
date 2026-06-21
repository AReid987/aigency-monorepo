import { marked } from "marked";
import mermaid from "mermaid";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { ArrowLeft } from "lucide-react";
import { loadRepoWikiPage, type WikiPage } from "../data/gitnexus";
import { useNexusStore } from "../store";

export function WikiView({ slug: slugProp }: { slug?: string }) {
  const router = useRouter();
  const slug = slugProp ?? (typeof router.query.slug === "string" ? router.query.slug : undefined);
  const repo = useNexusStore((s) => s.currentRepo);
  const [page, setPage] = useState<WikiPage | null>(null);
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      themeVariables: {
        darkMode: true,
        primaryColor: "oklch(0.20 0.020 250)",
        primaryTextColor: "oklch(0.90 0.010 250)",
        primaryBorderColor: "oklch(0.90 0.010 250 / 0.20)",
        lineColor: "oklch(0.60 0.010 250)",
        secondaryColor: "oklch(0.17 0.015 250)",
        tertiaryColor: "oklch(0.13 0.015 250)",
        fontFamily: "'JetBrains Mono', monospace",
      },
    });
  }, []);

  useEffect(() => {
    const repoId = repo;
    if (!slug || !repoId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      const p = await loadRepoWikiPage(repoId!, slug!);
      if (cancelled) return;
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
  }, [slug, repo]);

  useEffect(() => {
    if (!contentRef.current || !html) return;
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
    return (
      <div className="aig-wiki">
        <div className="aig-loading">Loading wiki page…</div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="aig-wiki">
        <div className="aig-empty">
          <h1 className="aig-view__title">Page not found</h1>
          <p>
            No wiki page exists for <code>{slug}</code> in this project.
          </p>
          <button type="button" className="aig-button" onClick={() => router.push("/")}>
            <ArrowLeft size={14} />
            <span>Return to Overview</span>
          </button>
        </div>
        <style>{`
          .aig-empty { max-width: 480px; }
          .aig-empty p { color: var(--aig-foreground-muted); margin: 12px 0 24px; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="aig-wiki">
      <div className="aig-wiki__header">
        <div className="aig-text-pixel aig-wiki__eyebrow">Wiki</div>
        <h1 className="aig-wiki__title">{page.title}</h1>
        <div className="aig-wiki__meta">
          <span className="aig-tag">{page.slug}</span>
          {page.generatedAt && (
            <span className="aig-text-pixel">Updated {new Date(page.generatedAt).toLocaleString()}</span>
          )}
        </div>
      </div>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: trusted markdown from gitnexus wiki */}
      <div ref={contentRef} className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />

      <style>{`
        .aig-wiki {
          max-width: 860px;
        }
        .aig-wiki__header {
          margin-bottom: 28px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--aig-fence-light);
        }
        .aig-wiki__eyebrow {
          font-size: var(--aig-text-size-xs);
          color: var(--aig-accent-dim);
          margin-bottom: 8px;
        }
        .aig-wiki__title {
          font-family: var(--aig-font-display);
          font-size: var(--aig-text-size-4xl);
          font-weight: 600;
          color: var(--aig-foreground);
          margin: 0;
          line-height: 1.15;
        }
        .aig-wiki__meta {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 14px;
          font-size: var(--aig-text-size-xs);
          color: var(--aig-foreground-ghost);
        }
      `}</style>
    </div>
  );
}
