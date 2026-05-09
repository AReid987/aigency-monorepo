import { writeFileSync } from "node:fs";
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
  .option(
    "--prepare-commit-msg-file <file>",
    "Write message to file for git prepare-commit-msg hook"
  )
  .parse();

async function main(): Promise<void> {
  const options = program.opts();
  const isHookMode = Boolean(options.prepareCommitMsgFile);

  if (!hasStagedChanges()) {
    if (isHookMode) {
      return;
    }
    console.log(chalk.yellow("⚠️  No staged changes. Run `git add` first.\n"));
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
      if (!isHookMode) {
        console.log(chalk.red(`Unknown mode: ${options.mode}`));
        console.log(chalk.gray("Valid modes: guided, suggested, auto, free"));
      }
      process.exit(1);
  }

  const message = formatCommitMessage(intent);

  // Validate unless free mode
  if (options.mode !== "free") {
    const validation = validateCommitMessage(message);
    if (!validation.valid) {
      if (!isHookMode) {
        console.log(chalk.red("\n❌ Commit message is invalid:"));
        for (const err of validation.errors) {
          console.log(`  ${chalk.red("•")} ${err}`);
        }
        console.log();
      }
      process.exit(1);
    }
  }

  if (isHookMode) {
    writeFileSync(options.prepareCommitMsgFile as string, message, "utf-8");
    return;
  }

  if (options.dryRun) {
    console.log(chalk.bold("\nCommit message:"));
    console.log(chalk.cyan("─".repeat(60)));
    console.log(message);
    console.log(chalk.cyan("─".repeat(60)));
    console.log(chalk.gray("\n(dry run — no commit made)\n"));
    return;
  }

  console.log(chalk.bold("\nCommit message:"));
  console.log(chalk.cyan("─".repeat(60)));
  console.log(message);
  console.log(chalk.cyan("─".repeat(60)));

  commit(message);
  console.log(chalk.green("\n✅ Committed successfully\n"));
}

main().catch((err) => {
  console.error(chalk.red("\n❌ Error:"), err.message || err);
  process.exit(1);
});
