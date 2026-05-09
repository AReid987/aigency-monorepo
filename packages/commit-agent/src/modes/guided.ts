import { confirm, editor, input, select } from "@inquirer/prompts";
import { getStagedFiles } from "../services/git.js";
import { generateCommitMessage } from "../services/slm.js";
import type { CommitIntent } from "../types.js";
import { VALID_SCOPES, VALID_TYPES } from "../types.js";

export async function guidedCommit(): Promise<CommitIntent> {
  const files = getStagedFiles();
  for (const _f of files.slice(0, 10)) {
  }
  if (files.length > 10) {
  }

  // AI suggestion for type and subject
  const suggestion = generateCommitMessage(files);
  const parsed = suggestion.message.match(/^(\w+)(?:\(([^)]+)\))?: (.+)$/);
  const suggestedType = parsed?.[1] ?? "feat";
  const suggestedScope = parsed?.[2] ?? "";
  const suggestedSubject = parsed?.[3] ?? "";

  const type = await select({
    message: "Commit type:",
    choices: VALID_TYPES.map((t) => ({
      name: t,
      value: t,
      description: t === suggestedType ? "💡 AI suggestion" : undefined,
    })),
    default: suggestedType,
  });

  const scopeChoices = [
    { name: "(none)", value: "" },
    ...VALID_SCOPES.map((s) => ({
      name: s,
      value: s,
      description: s === suggestedScope ? "💡 AI suggestion" : undefined,
    })),
    { name: "Other (custom)", value: "__custom__" },
  ];

  let scope = await select({
    message: "Scope (optional):",
    choices: scopeChoices,
    default: suggestedScope || "",
  });

  if (scope === "__custom__") {
    scope = await input({ message: "Custom scope:" });
  }

  const subject = await input({
    message: "Subject:",
    default: suggestedSubject,
    validate: (value) => value.length >= 3 || "Subject must be at least 3 characters",
  });

  const addBody = await confirm({ message: "Add a body?", default: false });
  let body: string | undefined;
  if (addBody) {
    body = await editor({
      message: "Commit body:",
      default: "",
    });
  }

  const isBreaking = await confirm({ message: "Is this a breaking change?", default: false });

  return {
    type,
    scope: scope || undefined,
    subject,
    body: body || undefined,
    breaking: isBreaking,
  };
}
