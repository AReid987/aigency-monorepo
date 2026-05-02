import type { AgentCallsign } from "@aigency/agent-core";

export interface AigencyPeer {
  id: string;
  callsign: AgentCallsign;
  workspaceId: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AigencySession {
  id: string;
  peerId: string;
  agent: AgentCallsign;
  started_at: string;
  ended_at?: string;
  metadata: Record<string, unknown>;
}
