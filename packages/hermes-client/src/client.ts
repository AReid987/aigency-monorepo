import type {
  HermesClientOptions,
  HermesCronCreateOptions,
  HermesCronJob,
  HermesDelegateResult,
  HermesDelegateTaskOptions,
  HermesIncomingMessage,
  HermesMemoryEntry,
  HermesMemorySearchOptions,
  HermesSendMessageOptions,
  HermesSession,
  HermesSkill,
  HermesToolDefinition,
} from "./types.js";

// ─── HermesClient ────────────────────────────────────────────────────────────

/**
 * Client for Hermes Agent's HTTP API.
 *
 * Hermes runs on the VPS (Oracle ARM) and exposes an API for:
 * - Sending/receiving messages across 20 platforms
 * - Managing cron jobs (agent tasks, not shell tasks)
 * - Querying memory (SQLite + FTS5)
 * - Managing skills (auto-created, self-improving)
 * - Delegating tasks to subagents
 *
 * Usage:
 *   const hermes = new HermesClient({ baseUrl: "http://galaxy-oracle:8080" });
 *   await hermes.sendMessage({ platform: "telegram", target: "@user", message: "Done!" });
 */
export class HermesClient {
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly timeout: number;

  constructor(options: HermesClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.timeout = options.timeout ?? 30_000;
  }

  // ── Health ─────────────────────────────────────────────────────────────

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.request("GET", "/health");
      return response.ok;
    } catch {
      return false;
    }
  }

  // ── Messaging ──────────────────────────────────────────────────────────

  /** Send a message to a platform. */
  async sendMessage(options: HermesSendMessageOptions): Promise<void> {
    await this.request("POST", "/api/messages/send", options);
  }

  /** Get recent incoming messages. */
  async getMessages(platform?: string, limit = 50): Promise<HermesIncomingMessage[]> {
    const params = new URLSearchParams();
    if (platform) {
      params.set("platform", platform);
    }
    params.set("limit", String(limit));
    const response = await this.request("GET", `/api/messages?${params.toString()}`);
    return (await response.json()) as HermesIncomingMessage[];
  }

  // ── Tools ──────────────────────────────────────────────────────────────

  /** List all available tools. */
  async listTools(): Promise<HermesToolDefinition[]> {
    const response = await this.request("GET", "/api/tools");
    return (await response.json()) as HermesToolDefinition[];
  }

  /** List available toolsets. */
  async listToolsets(): Promise<string[]> {
    const response = await this.request("GET", "/api/tools/toolsets");
    return (await response.json()) as string[];
  }

  // ── Memory ─────────────────────────────────────────────────────────────

  /** Search memory with FTS5. */
  async searchMemory(options: HermesMemorySearchOptions): Promise<HermesMemoryEntry[]> {
    const response = await this.request("POST", "/api/memory/search", options);
    return (await response.json()) as HermesMemoryEntry[];
  }

  /** Store a memory entry. */
  async storeMemory(content: string, tags?: string[]): Promise<HermesMemoryEntry> {
    const response = await this.request("POST", "/api/memory/store", { content, tags });
    return (await response.json()) as HermesMemoryEntry;
  }

  // ── Skills ─────────────────────────────────────────────────────────────

  /** List all skills. */
  async listSkills(): Promise<HermesSkill[]> {
    const response = await this.request("GET", "/api/skills");
    return (await response.json()) as HermesSkill[];
  }

  /** Enable/disable a skill. */
  async setSkillEnabled(name: string, enabled: boolean): Promise<void> {
    await this.request("POST", `/api/skills/${encodeURIComponent(name)}/toggle`, { enabled });
  }

  // ── Cron ───────────────────────────────────────────────────────────────

  /** List all cron jobs. */
  async listCronJobs(): Promise<HermesCronJob[]> {
    const response = await this.request("GET", "/api/cron/jobs");
    return (await response.json()) as HermesCronJob[];
  }

  /** Create a cron job. */
  async createCronJob(options: HermesCronCreateOptions): Promise<HermesCronJob> {
    const response = await this.request("POST", "/api/cron/jobs", options);
    return (await response.json()) as HermesCronJob;
  }

  /** Pause/resume a cron job. */
  async setCronJobPaused(jobId: string, paused: boolean): Promise<void> {
    await this.request("POST", `/api/cron/jobs/${encodeURIComponent(jobId)}/toggle`, { paused });
  }

  /** Delete a cron job. */
  async deleteCronJob(jobId: string): Promise<void> {
    await this.request("DELETE", `/api/cron/jobs/${encodeURIComponent(jobId)}`);
  }

  /** Run a cron job immediately. */
  async runCronJob(jobId: string): Promise<void> {
    await this.request("POST", `/api/cron/jobs/${encodeURIComponent(jobId)}/run`);
  }

  // ── Delegation ─────────────────────────────────────────────────────────

  /** Delegate a task to a Hermes subagent. */
  async delegateTask(options: HermesDelegateTaskOptions): Promise<HermesDelegateResult> {
    const response = await this.request("POST", "/api/delegate", options);
    return (await response.json()) as HermesDelegateResult;
  }

  // ── Sessions ───────────────────────────────────────────────────────────

  /** List active sessions. */
  async listSessions(): Promise<HermesSession[]> {
    const response = await this.request("GET", "/api/sessions");
    return (await response.json()) as HermesSession[];
  }

  // ── Chat (direct prompt) ───────────────────────────────────────────────

  /** Send a direct prompt to Hermes and get a response. */
  async chat(message: string, sessionId?: string): Promise<string> {
    const response = await this.request("POST", "/api/chat", { message, sessionId });
    const result = (await response.json()) as { response: string };
    return result.response;
  }

  // ── Internal ───────────────────────────────────────────────────────────

  private async request(method: string, path: string, body?: unknown): Promise<Response> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "unknown error");
        throw new Error(`Hermes API error ${response.status}: ${text}`);
      }

      return response;
    } finally {
      clearTimeout(timer);
    }
  }
}
