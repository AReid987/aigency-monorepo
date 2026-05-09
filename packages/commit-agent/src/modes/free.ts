import { confirm, input } from "@inquirer/prompts";
import type { CommitIntent } from "../types.js";

export async function freeCommit(): Promise<CommitIntent> {
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
