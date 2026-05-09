import { select } from "@inquirer/prompts";
import { getStagedFiles } from "../services/git.js";
import { generateCommitMessage } from "../services/slm.js";
import { validateCommitMessage } from "../services/validator.js";
import type { CommitIntent, CommitOptions } from "../types.js";

export async function suggestedCommit(options: CommitOptions = {}): Promise<CommitIntent> {
  const files = getStagedFiles();

  const result = generateCommitMessage(files);

  if (!result.message) {
    const { guidedCommit } = await import("./guided.js");
    return guidedCommit(options);
  }

  const validation = validateCommitMessage(result.message);

  if (!validation.valid) {
    for (const _err of validation.errors) {
      // errors logged by caller
    }
  }

  // Parse the suggested message
  const headerMatch = result.message.match(/^(\w+)(?:\(([^)]+)\))?!?: (.+)$/);
  const suggestedType = headerMatch?.[1] ?? "feat";
  const suggestedScope = headerMatch?.[2] ?? "";
  const suggestedSubject = headerMatch?.[3] ?? result.message;

  const bodyMatch = result.message.match(/^\S.+\n\n([\s\S]+)$/);
  const suggestedBody = bodyMatch?.[1];

  // Auto-accept when --yes or non-interactive
  if (options.yes || options.nonInteractive) {
    return {
      type: options.type ?? suggestedType,
      scope: options.scope || suggestedScope || undefined,
      subject: options.subject ?? suggestedSubject,
      body: options.body ?? suggestedBody,
      breaking: options.breaking ?? result.message.includes("!:"),
    };
  }

  const action = await select({
    message: "What would you like to do?",
    choices: [
      { name: "✅ Accept", value: "accept" },
      { name: "✏️  Edit", value: "edit" },
      { name: "❌ Reject / manual", value: "manual" },
    ],
  });

  if (action === "accept") {
    return {
      type: options.type ?? suggestedType,
      scope: options.scope || suggestedScope || undefined,
      subject: options.subject ?? suggestedSubject,
      body: options.body ?? suggestedBody,
      breaking: options.breaking ?? result.message.includes("!:"),
    };
  }

  if (action === "edit") {
    const { input } = await import("@inquirer/prompts");
    const subject = await input({
      message: "Subject:",
      default: options.subject ?? suggestedSubject,
    });
    return {
      type: options.type ?? suggestedType,
      scope: options.scope || suggestedScope || undefined,
      subject,
      body: options.body ?? suggestedBody,
      breaking: options.breaking ?? result.message.includes("!:"),
    };
  }

  // manual
  const { guidedCommit } = await import("./guided.js");
  return guidedCommit(options);
}
