import { Upload } from "lucide-react";
import { useRouter } from "next/router";

export function OnboardingView() {
  const router = useRouter();

  return (
    <div className="aig-onboarding">
      <div className="aig-glass aig-onboarding__card">
        <div className="aig-onboarding__brand">
          <span className="aig-logo">
            <Upload size={24} />
          </span>
          <div>
            <h1 className="aig-view__title" style={{ margin: 0 }}>GitNexus</h1>
            <p className="aig-text-pixel">Aigency Knowledge Graph</p>
          </div>
        </div>

        <p className="aig-onboarding__body">
          Drop a repository folder or connect to a running GitNexus backend to build a live knowledge graph.
          For now, the dashboard has loaded the static wiki generated in <code>.gitnexus/wiki</code>.
        </p>

        <div className="aig-onboarding__actions">
          <button type="button" className="aig-button aig-button--primary" onClick={() => router.push("/")}>
            Open Mission Control
          </button>
          <button type="button" className="aig-button" onClick={() => router.push("/graph")}>
            Explore Graph
          </button>
        </div>

        <div className="aig-onboarding__note aig-text-pixel">
          Backend ingestion is out of scope for this build.
        </div>
      </div>

      <style>{`
        .aig-onboarding {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100%;
        }
        .aig-onboarding__card {
          max-width: 480px;
          padding: 36px;
          width: 100%;
        }
        .aig-onboarding__brand {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .aig-onboarding__brand .aig-logo {
          width: 48px;
          height: 48px;
        }
        .aig-onboarding__brand p {
          margin: 4px 0 0;
          font-size: var(--aig-text-size-xs);
          color: var(--aig-foreground-muted);
        }
        .aig-onboarding__body {
          color: var(--aig-foreground-body);
          line-height: 1.6;
          margin: 0 0 24px;
        }
        .aig-onboarding__body code {
          color: var(--aig-accent);
          background: var(--aig-void-raised);
          padding: 1px 4px;
        }
        .aig-onboarding__actions {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }
        .aig-onboarding__note {
          font-size: var(--aig-text-size-xs);
          color: var(--aig-foreground-ghost);
        }
      `}</style>
    </div>
  );
}
