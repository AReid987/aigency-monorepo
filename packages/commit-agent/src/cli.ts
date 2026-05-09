import chalk from "chalk";
import { Command } from "commander";
import { autoCommit } from "./modes/auto.js";
import { freeCommit } from "./modes/free.js";
import { guidedCommit } from "./modes/guided.js";
import { suggestedCommit } from "./modes/suggested.js";
import { commit, hasStagedChanges } from "./services/git.js";
import { formatCommitMessage, validateCommitMessage } from "./services/validator.js";
import type { CommitIntent } from "./types.js";

const program = new Command();

program
  .name("aigency-commit")
  .description("Human-agent interchangeable commit orchestrator")
  .version("0.1.0")
  .option("-m, --mode <mode>", "Commit mode: guided | suggested | auto | free", "suggested")
  .option("-y, --yes", "Skip confirmation (auto mode only)", false)
  .option("--dry-run", "Show message without committing", false)
  .parse();

async function main(): Promise<void> {
  const options = program.opts();

  if (!hasStagedChanges()) {
    process.exit(1);
  }

  let intent: CommitIntent;

  switch (options.mode as string) {
    case "guided":
      intent = await guidedCommit();
      break;
    case "suggested":
      intent = await suggestedCommit();
      break;
    case "auto":
      intent = await autoCommit();
      break;
    case "free":
      intent = await freeCommit();
      break;
    default:
      process.exit(1);
  }

  const message = formatCommitMessage(intent);

  // Validate unless free mode
  if (options.mode !== "free") {
    const validation = validateCommitMessage(message);
    if (!validation.valid) {
      for (const _err of validation.errors) {
      }
      process.exit(1);
    }
  }

  if (options.dryRun) {
    return;
  }

  commit(message);
}

main().catch((err) => {
  console.error(chalk.red("\n❌ Error:"), err.message || err);
  process.exit(1);
});
