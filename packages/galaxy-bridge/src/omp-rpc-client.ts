import { EventEmitter } from "node:events";
import type {
  OmpRpcAgentEvent,
  OmpRpcCommand,
  OmpRpcFrame,
  OmpRpcResponse,
  OmpThinkingLevel,
  OmpTodoPhase,
} from "./omp-rpc-types.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OmpRpcClientOptions {
  /** Underlying transport that reads/writes JSONL lines. */
  transport: OmpRpcTransport;
  /** Timeout for command responses in ms. Default: 120_000 */
  responseTimeout?: number;
}

export interface OmpRpcTransport {
  /** Write a line to OMP's stdin. Must include trailing newline. */
  write(line: string): void;
  /** Register a callback for each line from OMP's stdout. */
  onLine(callback: (line: string) => void): void;
  /** Kill the underlying process. */
  kill(): void;
  /** Whether the transport is still connected. */
  readonly alive: boolean;
}

export interface PendingRequest {
  resolve: (frame: OmpRpcResponse) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

// ─── OmpRpcClient ────────────────────────────────────────────────────────────

/**
 * Client for OMP's RPC mode. Sends commands over JSONL stdin, reads responses
 * and events from JSONL stdout. Provides typed request/response correlation.
 */
export class OmpRpcClient extends EventEmitter {
  private readonly transport: OmpRpcTransport;
  private readonly responseTimeout: number;
  private readonly pending = new Map<string, PendingRequest>();
  private readyResolve: (() => void) | null = null;
  private disposed = false;

  constructor(options: OmpRpcClientOptions) {
    super();
    this.transport = options.transport;
    this.responseTimeout = options.responseTimeout ?? 120_000;
    this.transport.onLine((line) => this.handleLine(line));
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────

  waitForReady(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.readyResolve = resolve;
    });
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.transport.kill();
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error("Client disposed"));
    }
    this.pending.clear();
  }

  get alive(): boolean {
    return !this.disposed && this.transport.alive;
  }

  // ── Commands ───────────────────────────────────────────────────────────

  async prompt(message: string, id?: string): Promise<OmpRpcResponse> {
    return this.sendCommand({ type: "prompt", message, id });
  }

  async abort(id?: string): Promise<OmpRpcResponse> {
    return this.sendCommand({ type: "abort", id });
  }

  async abortAndPrompt(message: string, id?: string): Promise<OmpRpcResponse> {
    return this.sendCommand({ type: "abort_and_prompt", message, id });
  }

  async getState(id?: string): Promise<OmpRpcResponse> {
    return this.sendCommand({ type: "get_state", id });
  }

  async setModel(provider: string, modelId: string, id?: string): Promise<OmpRpcResponse> {
    return this.sendCommand({ type: "set_model", provider, modelId, id });
  }

  async setTodos(phases: OmpTodoPhase[], id?: string): Promise<OmpRpcResponse> {
    return this.sendCommand({ type: "set_todos", phases, id });
  }

  async newSession(parentSession?: string, id?: string): Promise<OmpRpcResponse> {
    return this.sendCommand({ type: "new_session", parentSession, id });
  }

  async switchSession(sessionPath: string, id?: string): Promise<OmpRpcResponse> {
    return this.sendCommand({ type: "switch_session", sessionPath, id });
  }

  async compact(customInstructions?: string, id?: string): Promise<OmpRpcResponse> {
    return this.sendCommand({ type: "compact", customInstructions, id });
  }

  async getMessages(id?: string): Promise<OmpRpcResponse> {
    return this.sendCommand({ type: "get_messages", id });
  }

  async setThinkingLevel(level: OmpThinkingLevel, id?: string): Promise<OmpRpcResponse> {
    return this.sendCommand({ type: "set_thinking_level", level, id });
  }

  async setSubagentSubscription(
    level: "off" | "progress" | "events",
    id?: string,
  ): Promise<OmpRpcResponse> {
    return this.sendCommand({ type: "set_subagent_subscription", level, id });
  }

  async bash(command: string, id?: string): Promise<OmpRpcResponse> {
    return this.sendCommand({ type: "bash", command, id });
  }

  // ── Internal ───────────────────────────────────────────────────────────

  private sendCommand(cmd: OmpRpcCommand): Promise<OmpRpcResponse> {
    return new Promise<OmpRpcResponse>((resolve, reject) => {
      const id = cmd.id ?? crypto.randomUUID();
      const cmdWithId = { ...cmd, id };

      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`OMP RPC timeout for command: ${cmd.type} (id: ${id})`));
      }, this.responseTimeout);

      this.pending.set(id, { resolve, reject, timer });
      this.transport.write(`${JSON.stringify(cmdWithId)}\n`);
    });
  }

  private handleLine(line: string): void {
    let frame: OmpRpcFrame;
    try {
      frame = JSON.parse(line) as OmpRpcFrame;
    } catch {
      this.emit("parse_error", line);
      return;
    }

    switch (frame.type) {
      case "ready": {
        if (this.readyResolve) {
          this.readyResolve();
          this.readyResolve = null;
        }
        this.emit("ready");
        break;
      }

      case "response": {
        const pending = this.pending.get(frame.id ?? "");
        if (pending) {
          this.pending.delete(frame.id ?? "");
          clearTimeout(pending.timer);
          pending.resolve(frame);
        }
        this.emit("response", frame);
        break;
      }

      case "prompt_result": {
        this.emit("prompt_result", frame);
        break;
      }

      case "command_output": {
        this.emit("command_output", frame);
        break;
      }

      case "subagent_lifecycle": {
        this.emit("subagent_lifecycle", frame);
        break;
      }

      case "subagent_progress": {
        this.emit("subagent_progress", frame);
        break;
      }

      default: {
        const agentEvent = frame as OmpRpcAgentEvent;
        this.emit("agent_event", agentEvent);
        this.emit(agentEvent.type, agentEvent);
        break;
      }
    }
  }
}
