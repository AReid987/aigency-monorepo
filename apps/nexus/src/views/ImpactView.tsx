import { Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { type ImpactEntry, getImpact } from "../services/backend-client";
import { useNexusStore } from "../store";

export function ImpactView() {
  const repo = useNexusStore((s) => s.currentRepo);
  const symbol = useNexusStore((s) => s.selectedSymbol);
  const [impact, setImpact] = useState<ImpactEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!repo) {
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    getImpact(repo, symbol ?? "")
      .then((data) => {
        if (mounted) {
          setImpact(data);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [repo, symbol]);

  return (
    <div className="aig-view">
      <div className="aig-view__header">
        <div>
          <h1 className="aig-view__title">Impact Analysis</h1>
          <p className="aig-view__subtitle">
            {symbol ? `Blast radius for ${symbol}` : "Select a symbol to analyze impact."}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="aig-loading">Computing impact…</div>
      ) : impact.length === 0 ? (
        <div className="aig-empty">
          <Shield size={32} />
          <p>No impact data available.</p>
          <span className="aig-text-pixel">
            Connect a GitNexus backend to enable real impact analysis.
          </span>
        </div>
      ) : (
        <div className="aig-impact-grid">
          {impact.map((entry) => (
            <div
              key={`${entry.file}:${entry.symbol}:${entry.risk}`}
              className={`aig-impact-card aig-impact-card--${entry.risk}`}
            >
              <div className="aig-impact-card__risk aig-text-pixel">{entry.risk}</div>
              <div className="aig-impact-card__file">{entry.file}</div>
              <div className="aig-impact-card__symbol">{entry.symbol}</div>
              <div className="aig-impact-card__reason">{entry.reason}</div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .aig-view { display: flex; flex-direction: column; gap: 24px; }
        .aig-empty {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
          padding: 48px;
          color: var(--aig-foreground-muted);
          background: var(--aig-surface);
          box-shadow: var(--aig-border-subtle);
        }
        .aig-empty p { margin: 0; }
        .aig-impact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .aig-impact-card {
          padding: 16px;
          background: var(--aig-surface);
          box-shadow: var(--aig-border-subtle);
          border-left: 3px solid var(--aig-foreground-muted);
        }
        .aig-impact-card--high { border-left-color: var(--aig-signal-avoid); }
        .aig-impact-card--medium { border-left-color: var(--aig-signal-conditional); }
        .aig-impact-card--low { border-left-color: var(--aig-signal-go); }
        .aig-impact-card__risk {
          font-size: var(--aig-text-size-xs);
          color: var(--aig-foreground-ghost);
          margin-bottom: 8px;
        }
        .aig-impact-card__file {
          font-family: var(--aig-font-mono);
          font-size: var(--aig-text-size-xs);
          color: var(--aig-accent);
          margin-bottom: 4px;
        }
        .aig-impact-card__symbol {
          font-weight: 500;
          color: var(--aig-foreground);
          margin-bottom: 8px;
        }
        .aig-impact-card__reason {
          font-size: var(--aig-text-size-sm);
          color: var(--aig-foreground-body);
        }
      `}</style>
    </div>
  );
}
