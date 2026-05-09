import { VALID_SCOPES, VALID_TYPES } from "../types.js";
import type { CommitIntent } from "../types.js";

const HEADER_PATTERN = /^(\w+)(?:\(([^)]+)\))?!?: (.+)$/;
const MAX_LENGTH = 100;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateCommitMessage(message: string): ValidationResult {
  const errors: string[] = [];

  if (!message || !message.trim()) {
    errors.push("Commit message cannot be empty");
    return { valid: false, errors };
  }

  const lines = message.split("\n");
  const header = lines[0];

  if (header.length > MAX_LENGTH) {
    errors.push(`Header exceeds ${MAX_LENGTH} characters (${header.length})`);
  }

  const match = HEADER_PATTERN.exec(header);
  if (!match) {
    errors.push("Header must be in format: type(scope): subject");
    return { valid: false, errors };
  }

  const [, type, scope, subject] = match;

  if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    errors.push(`Invalid type "${type}". Must be one of: ${VALID_TYPES.join(", ")}`);
  }

  if (scope && !VALID_SCOPES.includes(scope as (typeof VALID_SCOPES)[number])) {
    errors.push(`Unknown scope "${scope}". Valid scopes: ${VALID_SCOPES.join(", ")}`);
  }

  if (!subject || subject.trim().length < 3) {
    errors.push("Subject must be at least 3 characters");
  }

  if (subject.endsWith(".")) {
    errors.push("Subject must not end with a period");
  }

  return { valid: errors.length === 0, errors };
}

export function parseCommitMessage(message: string): CommitIntent {
  const lines = message.split("\n");
  const header = lines[0];

  const match = HEADER_PATTERN.exec(header);
  if (!match) {
    return { type: "free", subject: header };
  }

  const [, type, scope, subject] = match;
  const body = lines.slice(2).join("\n").trim() || undefined;

  return {
    type,
    scope,
    subject,
    body,
    breaking: header.includes("!:"),
  };
}

export function formatCommitMessage(intent: CommitIntent): string {
  const scope = intent.scope ? `(${intent.scope})` : "";
  const breaking = intent.breaking ? "!" : "";
  let msg = `${intent.type}${scope}${breaking}: ${intent.subject}`;

  if (intent.body) {
    msg += `\n\n${intent.body}`;
  }

  if (intent.footer) {
    msg += `\n\n${intent.footer}`;
  }

  return msg;
}
