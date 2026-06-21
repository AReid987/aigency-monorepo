/**
 * Hermes Agent API Types
 *
 * Based on Hermes Agent docs (https://hermes-agent.nousresearch.com/docs).
 * Hermes is a Python autonomous agent by Nous Research with 70+ tools,
 * 20 messaging platforms, cron, memory, and skill self-improvement.
 */

// ─── Messaging ───────────────────────────────────────────────────────────────

export type HermesPlatform =
  | "telegram"
  | "discord"
  | "slack"
  | "whatsapp"
  | "signal"
  | "matrix"
  | "mattermost"
  | "email"
  | "sms"
  | "teams"
  | "gchat"
  | "webhook"
  | "api_server";

export interface HermesSendMessageOptions {
  /** Target platform. */
  platform: HermesPlatform;
  /** Channel/chat/user ID on the platform. */
  target: string;
  /** Message text. */
  message: string;
  /** Optional: reply to a specific message. */
  replyTo?: string;
}

export interface HermesIncomingMessage {
  /** Platform the message came from. */
  platform: HermesPlatform;
  /** Sender identifier. */
  sender: string;
  /** Message text. */
  text: string;
  /** Timestamp. */
  timestamp: string;
  /** Message ID on the platform. */
  messageId?: string;
  /** Reply-to message ID. */
  replyTo?: string;
}

// ─── Tools ───────────────────────────────────────────────────────────────────

export interface HermesToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  toolset: string;
}

export type HermesToolsetName =
  | "web"
  | "search"
  | "terminal"
  | "file"
  | "browser"
  | "vision"
  | "image_gen"
  | "tts"
  | "todo"
  | "memory"
  | "session_search"
  | "cronjob"
  | "code_execution"
  | "delegation"
  | "clarify"
  | "homeassistant"
  | "messaging"
  | "spotify"
  | "discord"
  | "discord_admin"
  | "debugging"
  | "safe"
  | "skills";

// ─── Memory ──────────────────────────────────────────────────────────────────

export interface HermesMemoryEntry {
  /** Unique ID. */
  id: string;
  /** Memory content. */
  content: string;
  /** When it was created. */
  createdAt: string;
  /** Relevance score (0.0–1.0). */
  relevance?: number;
  /** Tags for categorization. */
  tags?: string[];
}

export interface HermesMemorySearchOptions {
  query: string;
  limit?: number;
  tags?: string[];
}

// ─── Skills ──────────────────────────────────────────────────────────────────

export interface HermesSkill {
  name: string;
  description: string;
  enabled: boolean;
  /** Source: bundled, optional, user, hub. */
  source: string;
}

// ─── Cron ────────────────────────────────────────────────────────────────────

export interface HermesCronJob {
  id: string;
  /** Human-readable name. */
  name: string;
  /** Cron expression or interval. */
  schedule: string;
  /** Prompt to execute. */
  prompt: string;
  /** Target platform for delivery. */
  deliveryPlatform?: HermesPlatform;
  /** Delivery target (channel/user ID). */
  deliveryTarget?: string;
  /** Whether the job is paused. */
  paused: boolean;
  /** Attached skills for this job. */
  skills?: string[];
  /** Next run time. */
  nextRun?: string;
}

export interface HermesCronCreateOptions {
  name: string;
  schedule: string;
  prompt: string;
  deliveryPlatform?: HermesPlatform;
  deliveryTarget?: string;
  skills?: string[];
}

// ─── Subagents ───────────────────────────────────────────────────────────────

export interface HermesDelegateTaskOptions {
  /** Task description. */
  task: string;
  /** Skills to attach to the subagent. */
  skills?: string[];
  /** Working directory. */
  workingDir?: string;
  /** Timeout in seconds. */
  timeout?: number;
}

export interface HermesDelegateResult {
  success: boolean;
  output: string;
  error?: string;
}

// ─── Session ─────────────────────────────────────────────────────────────────

export interface HermesSession {
  id: string;
  platform: HermesPlatform;
  createdAt: string;
  lastActivity: string;
  messageCount: number;
}

// ─── Config ──────────────────────────────────────────────────────────────────

export interface HermesClientOptions {
  /** Base URL for the Hermes API (e.g., http://galaxy-oracle:8080). */
  baseUrl: string;
  /** API key for authentication. */
  apiKey?: string;
  /** Request timeout in ms. Default: 30_000 */
  timeout?: number;
}
