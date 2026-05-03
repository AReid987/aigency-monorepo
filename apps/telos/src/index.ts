/**
 * @aigency/telos — Deep Context Framework runtime
 *
 * Current: placeholder. Future home of:
 *   - TELOS parser/validator
 *   - Interview engine
 *   - CLI commands
 *   - Web UI dev server
 *   - Markdown → HTML renderer
 */

export const VERSION = "0.1.0";

export interface TelosContextFile {
  entity: string;
  mission: string;
  problems: string[];
  goals: string[];
  kpis: string[];
  strategies: string[];
  risks: string[];
  narrative: string;
  projects?: string[];
  activityLog: string[];
}

export function parseTelos(markdown: string): TelosContextFile {
  // TODO: implement markdown parser
  throw new Error("Not implemented — see Roadmap Phase 2");
}
