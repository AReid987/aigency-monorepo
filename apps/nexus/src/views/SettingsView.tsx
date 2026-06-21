import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { backendBaseUrl } from "../services/backend-client";
import { useNexusStore } from "../store";

export function SettingsView() {
  const backend = useNexusStore((s) => s.backend);
  const [copied, setCopied] = useState(false);
  const url = backendBaseUrl();

  const copyUrl = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="aig-view">
      <div className="aig-view__header">
        <div>
          <h1 className="aig-view__title">Settings</h1>
          <p className="aig-view__subtitle">Configure the GitNexus backend and display preferences.</p>
        </div>
      </div>

      <div className="aig-settings-grid">
        <section className="aig-pane aig-settings-card">
          <div className="aig-pane__header">
            <span className="aig-text-pixel">Backend</span>
          </div>
          <div className="aig-settings-card__body">
            <div className="aig-settings-row">
              <span className="aig-settings-row__label">Status</span>
              <span className={`aig-tag ${backend.online ? "aig-tag--accent" : ""}`}>
                {backend.online ? "ONLINE" : "OFFLINE"}
              </span>
            </div>
            <div className="aig-settings-row">
              <span className="aig-settings-row__label">Endpoint</span>
              <div className="aig-settings-url">
                <code className="aig-text-mono">{url}</code>
                <button type="button" className="aig-button aig-button--ghost" onClick={copyUrl} aria-label="Copy URL">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <div className="aig-settings-row">
              <span className="aig-settings-row__label">Version</span>
              <span className="aig-text-mono">{backend.version ?? "—"}</span>
            </div>
            <p className="aig-settings-hint">
              Set <code>VITE_GITNEXUS_BACKEND_URL</code> to point at a running GitNexus backend. Without a backend, the app falls back to static wiki data.
            </p>
          </div>
        </section>

        <section className="aig-pane aig-settings-card">
          <div className="aig-pane__header">
            <span className="aig-text-pixel">Appearance</span>
          </div>
          <div className="aig-settings-card__body">
            <div className="aig-settings-row">
              <span className="aig-settings-row__label">Theme</span>
              <span className="aig-tag">Aigency Dark</span>
            </div>
            <div className="aig-settings-row">
              <span className="aig-settings-row__label">Grid beam</span>
              <span className="aig-tag aig-tag--accent">Enabled</span>
            </div>
            <div className="aig-settings-row">
              <span className="aig-settings-row__label">Particles</span>
              <span className="aig-tag aig-tag--accent">Enabled</span>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .aig-settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 16px;
          max-width: 820px;
        }
        .aig-settings-card__body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .aig-settings-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .aig-settings-row__label {
          font-family: var(--aig-font-pixel);
          font-size: var(--aig-text-size-xs);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--aig-foreground-muted);
        }
        .aig-settings-url {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 8px;
          background: var(--aig-void-base);
          box-shadow: var(--aig-border-subtle);
        }
        .aig-settings-url code {
          font-size: var(--aig-text-size-xs);
          color: var(--aig-accent);
        }
        .aig-settings-hint {
          font-size: var(--aig-text-size-xs);
          color: var(--aig-foreground-ghost);
          margin: 0;
          line-height: 1.5;
        }
        .aig-settings-hint code {
          color: var(--aig-foreground-body);
          background: var(--aig-void-raised);
          padding: 1px 4px;
        }
      `}</style>
    </div>
  );
}
