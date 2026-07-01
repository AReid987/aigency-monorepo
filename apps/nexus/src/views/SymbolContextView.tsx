import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { type StaticSymbolContext, computeStaticSymbolContext } from "../data/gitnexus";
import { type SymbolContext, getSymbolContext } from "../services/backend-client";
import { useNexusStore } from "../store";

type ContextShape = SymbolContext | StaticSymbolContext;

export function SymbolContextView({ symbol: symbolProp }: { symbol?: string }) {
  const router = useRouter();
  const symbol =
    symbolProp ?? (typeof router.query.symbol === "string" ? router.query.symbol : undefined);
  const repo = useNexusStore((s) => s.currentRepo);
  const pages = useNexusStore((s) => s.pages);
  const [context, setContext] = useState<ContextShape | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!repo) {
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    getSymbolContext(repo, symbol ?? "")
      .then((data) => {
        if (!mounted) {
          return;
        }
        if (data || pages.length === 0) {
          setContext(data);
          return;
        }
        setContext(computeStaticSymbolContext(symbol ?? "", pages));
      })
      .catch(() => {
        if (!mounted || pages.length === 0) {
          return;
        }
        setContext(computeStaticSymbolContext(symbol ?? "", pages));
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [repo, symbol, pages]);

  if (loading) {
    return <div className="aig-loading">Loading symbol context…</div>;
  }
  if (!context) {
    return (
      <div className="aig-view">
        <h1 className="aig-view__title">Symbol: {symbol}</h1>
        <p className="aig-view__subtitle">
          No backend context available. Connect GitNexus backend for symbol details.
        </p>
      </div>
    );
  }

  return (
    <div className="aig-view">
      <div className="aig-view__header">
        <div>
          <h1 className="aig-view__title">{context.name}</h1>
          <p className="aig-view__subtitle aig-text-mono">{context.file}</p>
        </div>
      </div>

      <div className="aig-symbol-grid">
        <section className="aig-pane aig-symbol-card">
          <div className="aig-pane__header">
            <span className="aig-text-pixel">Summary</span>
          </div>
          <div className="aig-symbol-card__body">
            <p>{context.summary}</p>
            <div className="aig-text-pixel">
              Lines {context.lines[0]}–{context.lines[1]}
            </div>
          </div>
        </section>

        <section className="aig-pane aig-symbol-card">
          <div className="aig-pane__header">
            <span className="aig-text-pixel">References</span>
          </div>
          <div className="aig-symbol-card__body">
            {context.references.length === 0 ? (
              <p className="aig-foreground-muted">No references found.</p>
            ) : (
              <ul className="aig-symbol-list">
                {context.references.map((ref) => (
                  <li key={`${ref.file}:${ref.line}`} className="aig-text-mono">
                    {ref.file}:{ref.line}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <style>{`
        .aig-symbol-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 16px;
          max-width: 900px;
        }
        .aig-symbol-card__body {
          padding: 16px;
          color: var(--aig-foreground-body);
          font-size: var(--aig-text-size-sm);
        }
        .aig-symbol-card__body p {
          margin: 0 0 12px;
          line-height: 1.6;
        }
        .aig-symbol-list {
          margin: 0;
          padding-left: 1.2em;
          color: var(--aig-foreground-muted);
        }
        .aig-symbol-list li {
          margin: 4px 0;
        }
      `}</style>
    </div>
  );
}
