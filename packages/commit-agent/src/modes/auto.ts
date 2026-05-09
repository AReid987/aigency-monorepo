import { getStagedFiles } from "../services/git.js";
import { generateCommitMessage } from "../services/slm.js";
import { validateCommitMessage } from "../services/validator.js";
import type { CommitIntent } from "../types.js";

export async function autoCommit(): Promise<CommitIntent> {
  const files = getStagedFiles();

  const result = generateCommitMessage(files);

  if (!result.message) {
    throw new Error("AI commit generation failed: no message returned");
  }

  const validation = validateCommitMessage(result.message);

  if (!validation.valid) {
    for (const _err of validation.errors) {
    }
  }

  const headerMatch = result.message.match(/^(\w+)(?:\(([^)]+)\))?!?: (.+)$/);
  const type = headerMatch?.[1] ?? "feat";
  const scope = headerMatch?.[2] ?? "";
  const subject = headerMatch?.[3] ?? result.message;

  const bodyMatch = result.message.match(/^\S.+\n\n([\s\S]+)$/);
  const body = bodyMatch?.[1];

  return {
    type,
    scope: scope || undefined,
    subject,
    body,
    breaking: result.message.includes("!:"),
  };
}
