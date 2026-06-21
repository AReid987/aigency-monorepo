import { EventEmitter } from "node:events";
import {
  type DelegateTaskOptions,
  type OmpRpcClient,
  TaskDelegator,
  type TaskResult,
} from "@aigency/galaxy-bridge";
import type { HermesClient } from "@aigency/hermes-client";
import type { GalaxyConfig } from "./config.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Venture {
  id: string;
  name: string;
  status: "ideation" | "planning" | "building" | "review" | "shipped" | "paused";
  workingDir: string;
  createdAt: string;
  updatedAt: string;
}

export interface VentureTask {
  ventureId: string;
  task: string;
  skills?: string[];
  budgetLimit?: number;
}

export interface OrchestratorEvent {
  type: "task_started" | "task_completed" | "task_failed" | "venture_created" | "status_update";
  ventureId?: string;
  message: string;
  data?: unknown;
}

// ─── GalaxyOrchestrator ──────────────────────────────────────────────────────

/**
 * The Galaxy orchestrator — bridges Hermes (VPS CEO) and OMP (MacBook CTO).
 *
 * Flow:
 * 1. User sends task via Hermes messaging (Telegram, Discord, etc.)
 * 2. Hermes routes to Galaxy orchestrator
 * 3. Orchestrator delegates to OMP via RPC over SSH
 * 4. OMP executes with gstack/PAUL/CARL skills
 * 5. Results flow back: OMP → Orchestrator → Hermes → User
 */
export class GalaxyOrchestrator extends EventEmitter {
  private readonly hermes: HermesClient;
  private readonly ompClient: OmpRpcClient;
  private readonly delegator: TaskDelegator;
  private readonly config: GalaxyConfig;
  private readonly ventures = new Map<string, Venture>();

  constructor(options: {
    hermes: HermesClient;
    ompClient: OmpRpcClient;
    config: GalaxyConfig;
  }) {
    super();
    this.hermes = options.hermes;
    this.ompClient = options.ompClient;
    this.delegator = new TaskDelegator(this.ompClient);
    this.config = options.config;
  }

  // ── Venture Management ─────────────────────────────────────────────────

  createVenture(id: string, name: string): Venture {
    const venture: Venture = {
      id,
      name,
      status: "ideation",
      workingDir: `${this.config.ventures.baseDir}/${id}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.ventures.set(id, venture);
    this.emit("venture_created", venture);
    return venture;
  }

  getVenture(id: string): Venture | undefined {
    return this.ventures.get(id);
  }

  listVentures(): Venture[] {
    return Array.from(this.ventures.values());
  }

  updateVentureStatus(id: string, status: Venture["status"]): void {
    const venture = this.ventures.get(id);
    if (venture) {
      venture.status = status;
      venture.updatedAt = new Date().toISOString();
      this.emit("status_update", { ventureId: id, status });
    }
  }

  // ── Task Execution ─────────────────────────────────────────────────────

  async executeTask(ventureTask: VentureTask): Promise<TaskResult> {
    const { ventureId, task, skills, budgetLimit } = ventureTask;

    this.emit("task_started", { ventureId, task });
    this.updateVentureStatus(ventureId, "building");

    const options: DelegateTaskOptions = {
      task,
      ventureId,
      workingDir: `${this.config.ventures.baseDir}/${ventureId}`,
      skills: skills ?? this.config.defaultSkills,
      budgetLimit: budgetLimit ?? this.config.task.budgetLimit,
      timeout: this.config.task.timeoutMs,
      model: this.config.task.defaultModel,
    };

    try {
      const result = await this.delegator.delegate(options);
      await this.reportToHermes(ventureId, task, result);

      if (result.success) {
        this.updateVentureStatus(ventureId, "review");
      }

      this.emit("task_completed", { ventureId, result });
      return result;
    } catch (error) {
      const errorResult: TaskResult = {
        success: false,
        output: "",
        toolCalls: [],
        durationMs: 0,
        error: error instanceof Error ? error.message : String(error),
        events: [],
      };

      this.emit("task_failed", { ventureId, error: errorResult.error });
      return errorResult;
    }
  }

  async handleHermesMessage(message: string): Promise<string> {
    const parsed = this.parseTaskMessage(message);

    if (parsed) {
      const result = await this.executeTask(parsed);
      return this.formatResultMessage(parsed.ventureId, result);
    }

    const ack = await this.ompClient.prompt(message);
    return ack.success ? "Task sent to OMP." : `Error: ${ack.error ?? "unknown"}`;
  }

  // ── Internal ───────────────────────────────────────────────────────────

  private async reportToHermes(ventureId: string, task: string, result: TaskResult): Promise<void> {
    try {
      const costStr = result.cost ? `$${result.cost.toFixed(2)}` : "unknown cost";
      await this.hermes.storeMemory(
        `[Galaxy] Venture ${ventureId}: ${task} — ${result.success ? "DONE" : "FAILED"} (${result.durationMs}ms, ${costStr})`,
        ["galaxy", "task-result", ventureId]
      );
    } catch {
      this.emit("status_update", {
        ventureId,
        message: "Warning: Failed to report results to Hermes memory",
      });
    }
  }

  private formatResultMessage(ventureId: string, result: TaskResult): string {
    const status = result.success ? "DONE" : "FAILED";
    const duration = `${(result.durationMs / 1000).toFixed(1)}s`;
    const cost = result.cost ? `$${result.cost.toFixed(2)}` : "unknown cost";
    const toolCount = result.toolCalls.length;

    let message = `Venture ${ventureId}: ${status} (${duration}, ${cost}, ${toolCount} tool calls)`;

    if (result.error) {
      message += `\nError: ${result.error}`;
    }

    if (result.output) {
      const truncated =
        result.output.length > 500 ? `...${result.output.slice(-500)}` : result.output;
      message += `\n\n${truncated}`;
    }

    return message;
  }

  private parseTaskMessage(message: string): VentureTask | null {
    const taskPattern = /^(?:task|build|implement|fix)\s+(\S+?)(?:\s*:\s*|\s+)(.+)$/i;
    const match = message.match(taskPattern);

    if (!match) {
      return null;
    }

    return {
      ventureId: match[1] ?? "",
      task: match[2] ?? "",
    };
  }
}
