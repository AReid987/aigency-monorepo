import type { OmpRpcClient } from "./omp-rpc-client.js";
import type { OmpRpcAgentEvent, OmpTodoPhase } from "./omp-rpc-types.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DelegateTaskOptions {
  /** Task description for OMP. */
  task: string;
  /** Venture ID (e.g., "notetaker-2026-001"). */
  ventureId?: string;
  /** Working directory on the remote machine. */
  workingDir?: string;
  /** Skills to load (gstack, paul, carl, etc.). Included in the prompt. */
  skills?: string[];
  /** Pre-seed todo phases before prompting. */
  todos?: OmpTodoPhase[];
  /** Model to use for this task. */
  model?: { provider: string; modelId: string };
  /** Budget limit in USD (informational — OMP tracks cost). */
  budgetLimit?: number;
  /** Timeout for the entire task in ms. Default: 600_000 (10 min) */
  timeout?: number;
}

export interface TaskResult {
  /** Whether the task completed successfully. */
  success: boolean;
  /** Full text output from the agent. */
  output: string;
  /** Tool calls made during execution. */
  toolCalls: ToolCallRecord[];
  /** Cost in USD (if reported by OMP). */
  cost?: number;
  /** Duration in ms. */
  durationMs: number;
  /** Error message if failed. */
  error?: string;
  /** Raw events from the RPC stream. */
  events: OmpRpcAgentEvent[];
  /** Session file path (for resuming). */
  sessionFile?: string;
}

export interface ToolCallRecord {
  toolName: string;
  args?: Record<string, unknown>;
  result?: unknown;
}

// ─── TaskDelegator ───────────────────────────────────────────────────────────

/**
 * High-level task delegation to OMP. Wraps OmpRpcClient with:
 * - Skill-aware prompt construction
 * - Todo pre-seeding
 * - Event collection and result aggregation
 * - Timeout enforcement
 */
export class TaskDelegator {
  private readonly client: OmpRpcClient;

  constructor(client: OmpRpcClient) {
    this.client = client;
  }

  /**
   * Delegate a task to OMP and collect the full result.
   *
   * Flow:
   * 1. Set model if specified
   * 2. Pre-seed todos if provided
   * 3. Send prompt with skill/venture context
   * 4. Collect all events until agent_end or timeout
   * 5. Return aggregated TaskResult
   */
  async delegate(options: DelegateTaskOptions): Promise<TaskResult> {
    const startTime = Date.now();
    const events: OmpRpcAgentEvent[] = [];
    const toolCalls: ToolCallRecord[] = [];
    const outputChunks: string[] = [];

    // ── Pre-flight setup ─────────────────────────────────────────────────

    if (options.model) {
      await this.client.setModel(options.model.provider, options.model.modelId);
    }

    if (options.todos && options.todos.length > 0) {
      await this.client.setTodos(options.todos);
    }

    // ── Build prompt with context ────────────────────────────────────────

    const prompt = this.buildPrompt(options);

    // ── Collect events until agent_end ───────────────────────────────────

    const timeout = options.timeout ?? 600_000;
    let agentEnded = false;
    let agentError: string | undefined;

    const onAgentEvent = (event: OmpRpcAgentEvent) => {
      events.push(event);

      switch (event.type) {
        case "message_update":
          if (event.assistantMessageEvent.type === "text_delta") {
            outputChunks.push(event.assistantMessageEvent.delta);
          }
          break;
        case "tool_execution_start":
          toolCalls.push({
            toolName: event.toolName,
            args: event.args as Record<string, unknown> | undefined,
          });
          break;
        case "tool_execution_end": {
          const last = toolCalls[toolCalls.length - 1];
          if (last && last.toolName === event.toolName) {
            last.result = event.result;
          }
          break;
        }
        case "agent_end":
          agentEnded = true;
          break;
      }
    };

    this.client.on("agent_event", onAgentEvent);

    try {
      const ack = await this.client.prompt(prompt);

      if (!ack.success) {
        return {
          success: false,
          output: "",
          toolCalls: [],
          durationMs: Date.now() - startTime,
          error: ack.error ?? "Prompt rejected",
          events,
        };
      }

      await this.waitForCompletion(timeout, () => agentEnded);

      return {
        success: !agentError,
        output: outputChunks.join(""),
        toolCalls,
        durationMs: Date.now() - startTime,
        error: agentError,
        events,
      };
    } catch (error) {
      return {
        success: false,
        output: outputChunks.join(""),
        toolCalls,
        durationMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        events,
      };
    } finally {
      this.client.off("agent_event", onAgentEvent);
    }
  }

  private buildPrompt(options: DelegateTaskOptions): string {
    const parts: string[] = [];

    if (options.skills && options.skills.length > 0) {
      parts.push(`Load skills: ${options.skills.join(", ")}`);
    }

    if (options.ventureId) {
      parts.push(`Venture: ${options.ventureId}`);
    }

    if (options.workingDir) {
      parts.push(`Working directory: ${options.workingDir}`);
    }

    if (options.budgetLimit) {
      parts.push(`Budget limit: $${options.budgetLimit.toFixed(2)}`);
    }

    parts.push("");
    parts.push(options.task);

    return parts.join("\n");
  }

  private waitForCompletion(timeout: number, isDone: () => boolean): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const deadline = Date.now() + timeout;

      const check = () => {
        if (isDone()) {
          resolve();
          return;
        }
        if (Date.now() > deadline) {
          reject(new Error(`Task timed out after ${timeout}ms`));
          return;
        }
        setTimeout(check, 500);
      };

      check();
    });
  }
}
