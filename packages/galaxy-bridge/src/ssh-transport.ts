import { type ChildProcess, spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import type { OmpRpcTransport } from "./omp-rpc-client.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SshOmpTransportOptions {
  /** SSH host (IP or hostname resolvable by Tailscale). */
  host: string;
  /** SSH user. Default: current user. */
  user?: string;
  /** SSH private key path. Default: ~/.ssh/id_rsa */
  keyPath?: string;
  /** SSH port. Default: 22 */
  port?: number;
  /** OMP command to run remotely. Default: "omp --mode rpc" */
  ompCommand?: string;
  /** Additional SSH args. */
  sshArgs?: string[];
  /** Connection timeout in ms. Default: 30_000 */
  connectTimeout?: number;
}

// ─── SshOmpTransport ─────────────────────────────────────────────────────────

/**
 * Transport that SSHs into a remote machine and runs OMP in RPC mode.
 * Lines flow over the SSH session's stdin/stdout.
 *
 * Usage:
 *   const transport = new SshOmpTransport({ host: "macbook-pro" });
 *   const client = new OmpRpcClient({ transport });
 *   await client.waitForReady();
 */
export class SshOmpTransport extends EventEmitter implements OmpRpcTransport {
  private process: ChildProcess | null = null;
  private lineBuffer = "";
  private _alive = false;
  private readonly options: Required<SshOmpTransportOptions>;

  constructor(options: SshOmpTransportOptions) {
    super();
    this.options = {
      host: options.host,
      user: options.user ?? "",
      keyPath: options.keyPath ?? "",
      port: options.port ?? 22,
      ompCommand: options.ompCommand ?? "omp --mode rpc",
      sshArgs: options.sshArgs ?? [],
      connectTimeout: options.connectTimeout ?? 30_000,
    };
  }

  get alive(): boolean {
    return this._alive;
  }

  /** Spawn the SSH connection and OMP RPC process. */
  connect(): void {
    const args = this.buildSshArgs();
    this.process = spawn("ssh", args, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    this._alive = true;

    this.process.stdout?.on("data", (chunk: Buffer) => {
      this.lineBuffer += chunk.toString();
      const lines = this.lineBuffer.split("\n");
      // Keep incomplete last line in buffer
      this.lineBuffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.trim()) {
          this.emit("line", line);
        }
      }
    });

    this.process.stderr?.on("data", (chunk: Buffer) => {
      this.emit("stderr", chunk.toString());
    });

    this.process.on("close", (code) => {
      this._alive = false;
      this.emit("close", code);
    });

    this.process.on("error", (err) => {
      this._alive = false;
      this.emit("error", err);
    });

    // Kill on timeout if OMP doesn't emit "ready"
    setTimeout(() => {
      if (!this._alive) {
        return;
      }
      // Don't kill — just emit timeout warning. waitForReady handles this.
      this.emit("connect_timeout");
    }, this.options.connectTimeout);
  }

  write(line: string): void {
    if (!this.process?.stdin) {
      throw new Error("SSH transport not connected");
    }
    this.process.stdin.write(line);
  }

  onLine(callback: (line: string) => void): void {
    this.on("line", callback);
  }

  kill(): void {
    if (this.process) {
      this.process.kill("SIGTERM");
      this._alive = false;
    }
  }

  private buildSshArgs(): string[] {
    const args: string[] = ["-o", "StrictHostKeyChecking=accept-new", "-o", "BatchMode=yes"];

    if (this.options.port !== 22) {
      args.push("-p", String(this.options.port));
    }
    if (this.options.keyPath) {
      args.push("-i", this.options.keyPath);
    }
    args.push(...this.options.sshArgs);

    const target = this.options.user
      ? `${this.options.user}@${this.options.host}`
      : this.options.host;
    args.push(target, this.options.ompCommand);

    return args;
  }
}

// ─── Local OMP Transport ─────────────────────────────────────────────────────

/**
 * Transport for running OMP locally (no SSH). Useful when Hermes runs
 * on the same machine as OMP, or for testing.
 */
export class LocalOmpTransport extends EventEmitter implements OmpRpcTransport {
  private process: ChildProcess | null = null;
  private lineBuffer = "";
  private _alive = false;
  private readonly ompArgs: string[];

  constructor(ompArgs: string[] = ["--mode", "rpc"]) {
    super();
    this.ompArgs = ompArgs;
  }

  get alive(): boolean {
    return this._alive;
  }

  spawn(ompPath = "omp"): void {
    this.process = spawn(ompPath, this.ompArgs, {
      stdio: ["pipe", "pipe", "pipe"],
    });
    this._alive = true;

    this.process.stdout?.on("data", (chunk: Buffer) => {
      this.lineBuffer += chunk.toString();
      const lines = this.lineBuffer.split("\n");
      this.lineBuffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.trim()) {
          this.emit("line", line);
        }
      }
    });

    this.process.stderr?.on("data", (chunk: Buffer) => {
      this.emit("stderr", chunk.toString());
    });

    this.process.on("close", (code) => {
      this._alive = false;
      this.emit("close", code);
    });

    this.process.on("error", (err) => {
      this._alive = false;
      this.emit("error", err);
    });
  }

  write(line: string): void {
    if (!this.process?.stdin) {
      throw new Error("Local transport not spawned");
    }
    this.process.stdin.write(line);
  }

  onLine(callback: (line: string) => void): void {
    this.on("line", callback);
  }

  kill(): void {
    if (this.process) {
      this.process.kill("SIGTERM");
      this._alive = false;
    }
  }
}
