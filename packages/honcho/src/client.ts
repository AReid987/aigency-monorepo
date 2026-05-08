// HonchoClient — Aigency wrapper around Honcho SDK
// One workspace per environment (dev / staging / prod).
// One peer per Aigency agent callsign.

import type { AgentCallsign } from "@aigency/agent-core";
import Honcho from "honcho-ai";

export interface HonchoClientConfig {
  apiKey: string;
  workspaceId: string; // "aigency-dev" | "aigency-prod"
  baseUrl?: string; // default: https://demo.honcho.dev
}

export class HonchoClient {
  private client: Honcho;
  private workspaceId: string;

  constructor(config: HonchoClientConfig) {
    this.client = new Honcho({
      apiKey: config.apiKey,
      baseURL: config.baseUrl ?? "https://demo.honcho.dev",
    });
    this.workspaceId = config.workspaceId;
  }

  /** Get or create a peer record for an agent callsign. */
  async getPeer(callsign: AgentCallsign) {
    const peers = await this.client.apps.users.list(this.workspaceId, {
      filter: JSON.stringify({ callsign }),
    } as any);

    if (peers.items.length > 0) {
      return peers.items[0];
    }

    return this.client.apps.users.create(this.workspaceId, {
      metadata: { callsign },
    } as any);
  }

  /** Start a new session for an agent. */
  async startSession(callsign: AgentCallsign, metadata?: Record<string, unknown>) {
    const peer = await this.getPeer(callsign);
    return this.client.apps.users.sessions.create(this.workspaceId, peer.id, {
      metadata: { agent: callsign, started_at: new Date().toISOString(), ...metadata },
    });
  }

  /** Append a message to an existing session. */
  async addMessage(
    callsign: AgentCallsign,
    sessionId: string,
    content: string,
    isUser: boolean,
    metadata?: Record<string, unknown>
  ) {
    const peer = await this.getPeer(callsign);
    return this.client.apps.users.sessions.messages.create(this.workspaceId, peer.id, sessionId, {
      content,
      is_user: isUser,
      metadata,
    });
  }

  /** Trigger Honcho "dreaming" — async background inference for a peer. */
  async dream(callsign: AgentCallsign, query: string): Promise<string> {
    const peer = await this.getPeer(callsign);
    const sessions = await this.client.apps.users.sessions.list(this.workspaceId, peer.id);
    if (sessions.items.length === 0) {
      throw new Error(`No sessions for ${callsign}`);
    }

    const latestSession = sessions.items[0];
    const result = await this.client.apps.users.sessions.chat(
      this.workspaceId,
      peer.id,
      latestSession.id,
      { queries: [query] }
    );

    return result.content ?? "";
  }
}
