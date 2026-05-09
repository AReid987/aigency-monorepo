export const VALID_TYPES = [
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "chore",
  "revert",
] as const;

export const VALID_SCOPES = [
  "agent",
  "api",
  "app",
  "auth",
  "ci",
  "config",
  "core",
  "deps",
  "docs",
  "infra",
  "pkg",
  "packages",
  "scripts",
  "test",
  "ui",
  "util",
] as const;

export type CommitMode = "guided" | "suggested" | "auto" | "free";
export type BackendType = "mlx" | "llamacpp" | "llamafile" | "heuristic";

export interface CommitIntent {
  type: string;
  scope?: string;
  subject: string;
  body?: string;
  breaking?: boolean;
  breakingDescription?: string;
  coAuthors?: string[];
  author?: "human" | "agent";
  timestamp?: Date;
  footer?: string;
}

export interface ValidatedMessage {
  valid: boolean;
  message: string;
  errors?: string[];
  warnings?: string[];
}

export interface Suggester {
  suggest(files: string[], diff?: string): Promise<Partial<CommitIntent>>;
}

export interface Author {
  type: "human" | "agent";
  id?: string;
  timestamp: Date;
}
