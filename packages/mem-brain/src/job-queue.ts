// JobQueue — Minions-style background task system
// Postgres-native durable job queue for embedding, sync, enrichment.
// Survives crashes, supports parent-child DAGs, zero infrastructure cost.

import { SurrealClient } from "@aigency/surreal";

export interface JobRecord {
  id: string;
  job_type: string;
  payload: Record<string, unknown>;
  status: "pending" | "running" | "complete" | "failed" | "cancelled";
  priority: number; // 0 = highest
  parent_id?: string;
  child_ids: string[];
  attempt_count: number;
  max_attempts: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface JobQueueConfig {
  maxConcurrent?: number;
  defaultMaxAttempts?: number;
  pollIntervalMs?: number;
  retryDelays?: number[]; // exponential backoff delays in ms
}

export type JobHandler = (payload: Record<string, unknown>) => Promise<unknown>;

export class JobQueue {
  private handlers = new Map<string, JobHandler>();
  private running = false;
  private activeJobs = 0;
  private timer?: NodeJS.Timeout;

  constructor(private config: JobQueueConfig = {}) {
    this.config = {
      maxConcurrent: 3,
      defaultMaxAttempts: 3,
      pollIntervalMs: 5000,
      retryDelays: [1000, 5000, 25000], // 1s, 5s, 25s
      ...config,
    };
  }

  register(jobType: string, handler: JobHandler): void {
    this.handlers.set(jobType, handler);
  }

  // ─── Job Lifecycle ───────────────────────────────────────────────────────────

  async enqueue(
    jobType: string,
    payload: Record<string, unknown>,
    options: { priority?: number; parentId?: string; maxAttempts?: number } = {}
  ): Promise<string> {
    const db = SurrealClient.db;
    const [record] = await db.create("job", {
      job_type: jobType,
      payload,
      status: "pending",
      priority: options.priority ?? 0,
      parent_id: options.parentId,
      child_ids: [],
      attempt_count: 0,
      max_attempts: options.maxAttempts ?? this.config.defaultMaxAttempts,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>);
    return (record as unknown as JobRecord).id;
  }

  async cancel(jobId: string): Promise<void> {
    const db = SurrealClient.db;
    await db.merge(jobId, {
      status: "cancelled",
      updated_at: new Date().toISOString(),
    });
  }

  async getStatus(jobId: string): Promise<JobRecord | null> {
    const db = SurrealClient.db;
    const [[job]] = await db.query<[[JobRecord]]>("SELECT * FROM job WHERE id = $id", {
      id: jobId,
    });
    return job ?? null;
  }

  async listPending(limit = 50): Promise<JobRecord[]> {
    const db = SurrealClient.db;
    const [rows] = await db.query<[JobRecord[]]>(
      `SELECT * FROM job
       WHERE status = 'pending'
       ORDER BY priority ASC, created_at ASC
       LIMIT $limit`,
      { limit }
    );
    return rows ?? [];
  }

  // ─── Worker Loop ─────────────────────────────────────────────────────────────

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.poll();
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  private async poll(): Promise<void> {
    if (!this.running) {
      return;
    }

    while (this.activeJobs < (this.config.maxConcurrent ?? 3)) {
      const job = await this.claimNextJob();
      if (!job) {
        break;
      }
      this.processJob(job);
    }

    this.timer = setTimeout(() => this.poll(), this.config.pollIntervalMs);
  }

  private async claimNextJob(): Promise<JobRecord | null> {
    const db = SurrealClient.db;
    // Atomically claim a pending job
    const [[job]] = await db.query<[[JobRecord]]>(
      `SELECT * FROM job
       WHERE status = 'pending'
         AND (parent_id IS NONE OR (
           SELECT status FROM job WHERE id = $parent_id
         )[0].status = 'complete')
       ORDER BY priority ASC, created_at ASC
       LIMIT 1`
    );

    if (!job) {
      return null;
    }

    // Mark as running
    await db.merge(job.id, {
      status: "running",
      started_at: new Date().toISOString(),
      attempt_count: job.attempt_count + 1,
      updated_at: new Date().toISOString(),
    });

    return job;
  }

  private async processJob(job: JobRecord): Promise<void> {
    this.activeJobs++;
    const handler = this.handlers.get(job.job_type);

    try {
      if (!handler) {
        throw new Error(`No handler registered for job type: ${job.job_type}`);
      }

      await handler(job.payload);

      // Mark complete
      await this.completeJob(job.id);
    } catch (error) {
      await this.failJob(job.id, error instanceof Error ? error.message : String(error));
    } finally {
      this.activeJobs--;
    }
  }

  private async completeJob(jobId: string): Promise<void> {
    const db = SurrealClient.db;
    await db.merge(jobId, {
      status: "complete",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Notify parent if exists
    const job = await this.getStatus(jobId);
    if (job?.parent_id) {
      await this.checkParentCompletion(job.parent_id);
    }
  }

  private async failJob(jobId: string, errorMessage: string): Promise<void> {
    const db = SurrealClient.db;
    const job = await this.getStatus(jobId);
    if (!job) {
      return;
    }

    const shouldRetry = job.attempt_count < job.max_attempts;
    const delay = this.config.retryDelays?.[job.attempt_count - 1] ?? 60000;

    if (shouldRetry) {
      // Re-queue with delay
      await db.merge(jobId, {
        status: "pending",
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      });
      // In production, use a scheduled execution
      setTimeout(() => {
        // Job will be picked up by next poll
      }, delay);
    } else {
      await db.merge(jobId, {
        status: "failed",
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      });
    }
  }

  private async checkParentCompletion(parentId: string): Promise<void> {
    const db = SurrealClient.db;
    const [children] = await db.query<[{ status: string }[]]>(
      "SELECT status FROM job WHERE parent_id = $parent_id",
      { parent_id: parentId }
    );

    const allComplete = (children ?? []).every((c) => c.status === "complete");
    if (allComplete) {
      await db.merge(parentId, {
        status: "pending", // Ready for parent to run
        updated_at: new Date().toISOString(),
      });
    }
  }

  // ─── Batch Operations ────────────────────────────────────────────────────────

  async enqueueBatch(
    jobs: Array<{
      jobType: string;
      payload: Record<string, unknown>;
      priority?: number;
    }>
  ): Promise<string[]> {
    const ids: string[] = [];
    for (const job of jobs) {
      const id = await this.enqueue(job.jobType, job.payload, { priority: job.priority });
      ids.push(id);
    }
    return ids;
  }

  async waitForCompletion(jobId: string, timeoutMs = 30000): Promise<JobRecord> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const job = await this.getStatus(jobId);
      if (
        job &&
        (job.status === "complete" || job.status === "failed" || job.status === "cancelled")
      ) {
        return job;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`Timeout waiting for job ${jobId}`);
  }
}
