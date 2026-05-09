import { confirm, editor, input, select } from "@inquirer/prompts";
import { getStagedFiles } from "../services/git.js";
import { generateCommitMessage } from "../services/slm.js";
import type { CommitIntent, CommitOptions } from "../types.js";
import { VALID_SCOPES, VALID_TYPES } from "../types.js";

export async function guidedCommit(options: CommitOptions = {}): Promise<CommitIntent> {
  const files = getStagedFiles();

  // AI suggestion for type and subject
  const suggestion = generateCommitMessage(files);
  const parsed = suggestion.message.match(/^(\w+)(?:\(([^)]+)\))?: (.+)$/);
  const suggestedType = parsed?.[1] ?? "feat";
  const suggestedScope = parsed?.[2] ?? "";
  const suggestedSubject = parsed?.[3] ?? "";

  // Use provided values or prompt
  const type =
    options.type ??
    (options.nonInteractive
      ? suggestedType
      : await select({
          message: "Commit type:",
          choices: VALID_TYPES.map((t) => ({
            name: t,
            value: t,
            description: t === suggestedType ? "💡 AI suggestion" : undefined,
          })),
          default: suggestedType,
        }));

  let scope: string | undefined;
  if (options.scope !== undefined) {
    scope = options.scope;
  } else if (options.nonInteractive) {
    scope = suggestedScope || undefined;
  } else {
    const scopeChoices = [
      { name: "(none)", value: "" },
      ...VALID_SCOPES.map((s) => ({
        name: s,
        value: s,
        description: s === suggestedScope ? "💡 AI suggestion" : undefined,
      })),
      { name: "Other (custom)", value: "__custom__" },
    ];

    scope = await select({
      message: "Scope (optional):",
      choices: scopeChoices,
      default: suggestedScope || "",
    });

    if (scope === "__custom__") {
      scope = await input({ message: "Custom scope:" });
    }
  }

  const subject =
    options.subject ??
    (options.nonInteractive
      ? suggestedSubject
      : await input({
          message: "Subject:",
          default: suggestedSubject,
          validate: (value) => value.length >= 3 || "Subject must be at least 3 characters",
        }));

  let body: string | undefined;
  if (options.body !== undefined) {
    body = options.body;
  } else if (!options.nonInteractive) {
    const addBody = await confirm({ message: "Add a body?", default: false });
    if (addBody) {
      body = await editor({
        message: "Commit body:",
        default: "",
      });
    }
  }

  const isBreaking =
    options.breaking ??
    (options.nonInteractive
      ? false
      : await confirm({ message: "Is this a breaking change?", default: false }));

  return {
    type,
    scope: scope || undefined,
    subject,
    body: body || undefined,
    breaking: isBreaking,
  };
}
