import { select } from "@inquirer/prompts";
import { getStagedFiles } from "../services/git.js";
import { generateCommitMessage } from "../services/slm.js";
import { validateCommitMessage } from "../services/validator.js";
import type { CommitIntent } from "../types.js";

export async function suggestedCommit(): Promise<CommitIntent> {
  const files = getStagedFiles();

  const result = generateCommitMessage(files);

  if (!result.message) {
    const { guidedCommit } = await import("./guided.js");
    return guidedCommit();
  }

  const validation = validateCommitMessage(result.message);

  if (!validation.valid) {
    for (const _err of validation.errors) {
    }
  }

  // Parse the suggested message
  const headerMatch = result.message.match(/^(\w+)(?:\(([^)]+)\))?!?: (.+)$/);
  const suggestedType = headerMatch?.[1] ?? "feat";
  const suggestedScope = headerMatch?.[2] ?? "";
  const suggestedSubject = headerMatch?.[3] ?? result.message;

  const bodyMatch = result.message.match(/^\S.+\n\n([\s\S]+)$/);
  const suggestedBody = bodyMatch?.[1];

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
      type: suggestedType,
      scope: suggestedScope || undefined,
      subject: suggestedSubject,
      body: suggestedBody,
      breaking: result.message.includes("!:"),
    };
  }

  if (action === "edit") {
    const { input } = await import("@inquirer/prompts");
    const subject = await input({
      message: "Subject:",
      default: suggestedSubject,
    });
    return {
      type: suggestedType,
      scope: suggestedScope || undefined,
      subject,
      body: suggestedBody,
      breaking: result.message.includes("!:"),
    };
  }

  // manual
  const { guidedCommit } = await import("./guided.js");
  return guidedCommit();
}
