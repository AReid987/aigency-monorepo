import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { getProcess, type ProcessStep } from "../services/backend-client";
import { useNexusStore } from "../store";

export function ProcessView() {
  const repo = useNexusStore((s) => s.currentRepo);
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!repo) {
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    getProcess(repo)
      .then((data) => {
        if (mounted) setSteps(data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [repo]);

  const fallbackSteps: ProcessStep[] = [
    { step: 1, title: "Repository Ingest", status: "done", detail: "Static wiki loaded" },
    { step: 2, title: "Parse Modules", status: "done", detail: `${steps.length ? "" : "Tree parsed from module_tree.json"}` },
    { step: 3, title: "Build Graph", status: "done", detail: "Sigma graph ready" },
    { step: 4, title: "Generate Wiki", status: "done", detail: "Markdown pages loaded" },
    { step: 5, title: "Agent Bridge", status: "pending", detail: "Awaiting localhost:4747 backend" },
  ];

  const displaySteps = steps.length > 0 ? steps : fallbackSteps;

  return (
    <div className="aig-view">
      <div className="aig-view__header">
        <div>
          <h1 className="aig-view__title">Process Pipeline</h1>
          <p className="aig-view__subtitle">Indexing and enrichment stages for the loaded repository.</p>
        </div>
      </div>

      {loading && steps.length === 0 ? (
        <div className="aig-loading">Fetching process state…</div>
      ) : (
        <div className="aig-process">
          {displaySteps.map((s, idx) => (
            <div key={idx} className={`aig-process-step aig-process-step--${s.status}`}>
              <div className="aig-process-step__icon">
                {s.status === "done" && <CheckCircle2 size={18} />}
                {s.status === "running" && <Loader2 size={18} className="aig-spin" />}
                {s.status === "error" && <XCircle size={18} />}
                {s.status === "pending" && <Circle size={18} />}
              </div>
              <div className="aig-process-step__body">
                <div className="aig-process-step__title">
                  <span className="aig-text-pixel">Step {s.step}</span>
                  <span>{s.title}</span>
                </div>
                {s.detail && <div className="aig-process-step__detail">{s.detail}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .aig-process {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 640px;
        }
        .aig-process-step {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px;
          background: var(--aig-surface);
          box-shadow: var(--aig-border-subtle);
        }
        .aig-process-step__icon {
          color: var(--aig-foreground-ghost);
          margin-top: 2px;
        }
        .aig-process-step--done .aig-process-step__icon { color: var(--aig-signal-go); }
        .aig-process-step--running .aig-process-step__icon { color: var(--aig-signal-conditional); }
        .aig-process-step--error .aig-process-step__icon { color: var(--aig-signal-avoid); }
        .aig-process-step__title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 500;
          color: var(--aig-foreground);
        }
        .aig-process-step__title .aig-text-pixel {
          color: var(--aig-accent-dim);
          font-size: var(--aig-text-size-xs);
        }
        .aig-process-step__detail {
          margin-top: 4px;
          font-size: var(--aig-text-size-sm);
          color: var(--aig-foreground-muted);
        }
        .aig-spin { animation: aig-spin 1s linear infinite; }
        @keyframes aig-spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
