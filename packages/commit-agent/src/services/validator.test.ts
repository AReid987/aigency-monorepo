import { describe, expect, it } from "vitest";
import type { CommitIntent } from "../types.js";
import { formatCommitMessage, parseCommitMessage, validateCommitMessage } from "./validator.js";

describe("validateCommitMessage", () => {
  it("accepts valid conventional commit", () => {
    const result = validateCommitMessage("feat(auth): Add login form");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects empty message", () => {
    const result = validateCommitMessage("");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Commit message cannot be empty");
  });

  it("rejects invalid type", () => {
    const result = validateCommitMessage("invalid(scope): Something");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Invalid type"))).toBe(true);
  });

  it("rejects subject ending with period", () => {
    const result = validateCommitMessage("feat: Something.");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Subject must not end with a period");
  });

  it("rejects header over 100 chars", () => {
    const result = validateCommitMessage(`feat: ${"a".repeat(100)}`);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("100"))).toBe(true);
  });
});

describe("formatCommitMessage", () => {
  it("formats basic intent", () => {
    const intent: CommitIntent = { type: "feat", subject: "Add feature" };
    expect(formatCommitMessage(intent)).toBe("feat: Add feature");
  });

  it("includes scope", () => {
    const intent: CommitIntent = { type: "fix", scope: "api", subject: "Patch bug" };
    expect(formatCommitMessage(intent)).toBe("fix(api): Patch bug");
  });

  it("includes breaking marker", () => {
    const intent: CommitIntent = { type: "feat", subject: "Breaking change", breaking: true };
    expect(formatCommitMessage(intent)).toBe("feat!: Breaking change");
  });
});

describe("parseCommitMessage", () => {
  it("parses conventional commit", () => {
    const result = parseCommitMessage("feat(ui): Update button");
    expect(result.type).toBe("feat");
    expect(result.scope).toBe("ui");
    expect(result.subject).toBe("Update button");
  });

  it("returns free type for non-conventional", () => {
    const result = parseCommitMessage("some random message");
    expect(result.type).toBe("free");
    expect(result.subject).toBe("some random message");
  });
});
