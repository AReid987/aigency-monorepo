import { confirm, input } from "@inquirer/prompts";
import type { CommitIntent, CommitOptions } from "../types.js";

export async function freeCommit(options: CommitOptions = {}): Promise<CommitIntent> {
  // Agent path: use --message directly
  if (options.message) {
    return {
      type: "free",
      subject: options.message,
      breaking: options.breaking ?? false,
    };
  }

  // Non-interactive fallback: require --message
  if (options.nonInteractive) {
    throw new Error(
      "Free mode in non-interactive mode requires --message or AIGENCY_COMMIT_MESSAGE"
    );
  }

  // Human path: interactive prompts
  const message = await input({
    message: "Commit message:",
    validate: (value) => value.trim().length > 0 || "Message cannot be empty",
  });

  const isBreaking = await confirm({
    message: "Mark as breaking change?",
    default: false,
  });

  return {
    type: "free",
    subject: message,
    breaking: isBreaking,
  };
}
