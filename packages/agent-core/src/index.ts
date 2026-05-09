// Aigency Agent Core — shared types, enums, and constants

// ─── Agent Identities ───────────────────────────────────────────────────────

export type AgentCallsign =
  | "THE_ARCHITECT"
  | "ZENITH"
  | "VECTOR"
  | "CIPHER"
  | "ECHO"
  | "ATLAS"
  | "COMPASS"
  | "IRIS"
  | "HERALD"
  | "ORACLE"
  | "LIBRARIAN";

export interface AgentIdentity {
  callsign: AgentCallsign;
  name: string;
  role: string;
  color: string; // hex — used in SynapTree + Membraned Interface
  substrate: string; // runtime platform
}

export const AGENT_REGISTRY: Record<AgentCallsign, AgentIdentity> = {
  THE_ARCHITECT: {
    callsign: "THE_ARCHITECT",
    name: "Antonio Reid",
    role: "Founder & Chief Architect",
    color: "#FFD700",
    substrate: "human",
  },
  ZENITH: {
    callsign: "ZENITH",
    name: "Newton Hughes",
    role: "Chief of Staff & Orchestrator",
    color: "#00E5CC",
    substrate: "OpenClaw",
  },
  VECTOR: {
    callsign: "VECTOR",
    name: "Dominique Osei",
    role: "Strategy & Intelligence",
    color: "#7B2FFF",
    substrate: "NullClaw", // Zig — 678KB binary, sub-2ms boot, pure signal / zero overhead
  },
  CIPHER: {
    callsign: "CIPHER",
    name: "Roman Voss",
    role: "Engineering & DevOps",
    color: "#39FF14",
    substrate: "GitClaw", // git-native runtime — agent IS a git repo; SOUL.md/RULES.md/skills/ in VCS
  },
  ECHO: {
    callsign: "ECHO",
    name: "Selene Navarro",
    role: "Marketing & Content",
    color: "#FF2D78",
    substrate: "DenchClaw", // TypeScript — CRM automation + outreach agents + knowledge work
  },
  ATLAS: {
    callsign: "ATLAS",
    name: "Jordan Mercer",
    role: "Revenue & Sales Ops",
    color: "#FFB300",
    substrate: "Paperclip", // Node.js — orchestrates AI teams into a company w/ budgets + governance
  },
  COMPASS: {
    callsign: "COMPASS",
    name: "Imara Adeyemi",
    role: "Finance & Operations",
    color: "#00BFA5",
    substrate: "IronClaw", // Rust — WASM sandbox, AES-256-GCM, zero-trust, no telemetry
  },
  IRIS: {
    callsign: "IRIS",
    name: "Vivienne Calloway",
    role: "Design & Brand Systems",
    color: "#C77DFF",
    substrate: "OpenFang", // Rust Agent OS — autonomous scheduling 24/7, brand monitoring
  },
  HERALD: {
    callsign: "HERALD",
    name: "Dax Okafor",
    role: "Communications",
    color: "#FFFFFF",
    substrate: "Hermes", // Python — only claw-family substrate with built-in learning loop (Nous Research)
  },
  ORACLE: {
    callsign: "ORACLE",
    name: "Sable Quinn",
    role: "Persistent Memory Agent",
    color: "#1A237E",
    substrate: "Letta/MemGPT",
  },
  LIBRARIAN: {
    callsign: "LIBRARIAN",
    name: "Ren Nakamura",
    role: "Knowledge Graph Curator",
    color: "#FF6D00",
    substrate: "ZeroClaw",
  },
};

// ─── Task Complexity ─────────────────────────────────────────────────────────

export type TaskComplexity = "SIMPLE" | "MEDIUM" | "COMPLEX" | "REASONING";

// ─── Routing Context ─────────────────────────────────────────────────────────

export interface AgentRoutingContext {
  /** The agent making the request */
  agent: AgentCallsign;
  /** The agent the request is targeted at (if any) */
  targetAgent?: AgentCallsign;
  /** Estimated task complexity — informs model selection */
  complexity: TaskComplexity;
  /** Whether the task requires local inference (privacy/latency) */
  preferLocal?: boolean;
  /** Session ID for ORACLE memory threading */
  sessionId?: string;
}

// ─── Memory Block Types ───────────────────────────────────────────────────────

export type MemoryBlockType =
  | "agent"
  | "peer"
  | "directive"
  | "pattern"
  | "timeline"
  | "graph_edge";

// ─── Events ──────────────────────────────────────────────────────────────────

export interface AigencyEvent {
  type: string;
  agent: AgentCallsign;
  timestamp: string; // ISO 8601
  payload: Record<string, unknown>;
}
