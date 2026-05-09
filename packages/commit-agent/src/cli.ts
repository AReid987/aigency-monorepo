import { writeFileSync } from "node:fs";
import chalk from "chalk";
import { Command } from "commander";
import { autoCommit } from "./modes/auto.js";
import { freeCommit } from "./modes/free.js";
import { guidedCommit } from "./modes/guided.js";
import { suggestedCommit } from "./modes/suggested.js";
import { commit, hasStagedChanges } from "./services/git.js";
import { formatCommitMessage, validateCommitMessage } from "./services/validator.js";
import type { CommitIntent, CommitOptions } from "./types.js";
import { detectAuthor, isInteractive } from "./utils/tty.js";

const program = new Command();

program
  .name("aigency-commit")
  .description("Human-agent interchangeable commit orchestrator")
  .version("0.1.0")
  .option("-m, --mode <mode>", "Commit mode: guided | suggested | auto | free", "suggested")
  .option("-y, --yes", "Skip confirmation (suggested and auto modes)", false)
  .option("--dry-run", "Show message without committing", false)
  .option("--json", "Output in JSON format (for agents)", false)
  .option("--non-interactive", "Force non-interactive mode", false)
  .option("--type <type>", "Commit type (overrides AI suggestion)")
  .option("--scope <scope>", "Commit scope (overrides AI suggestion)")
  .option("--subject <subject>", "Commit subject line (overrides AI suggestion)")
  .option("--body <body>", "Commit body")
  .option("--breaking", "Mark as breaking change", false)
  .option("--message <msg>", "Full commit message (free mode)")
  .option(
    "--prepare-commit-msg-file <file>",
    "Write message to file for git prepare-commit-msg hook"
  )
  .parse();

function buildOptions(): CommitOptions {
  const opts = program.opts();
  const nonInteractive = opts.nonInteractive || !isInteractive();

  return {
    type: opts.type || process.env.AIGENCY_COMMIT_TYPE || undefined,
    scope: opts.scope || process.env.AIGENCY_COMMIT_SCOPE || undefined,
    subject: opts.subject || process.env.AIGENCY_COMMIT_SUBJECT || undefined,
    body: opts.body || process.env.AIGENCY_COMMIT_BODY || undefined,
    breaking: opts.breaking || process.env.AIGENCY_COMMIT_BREAKING === "1" || false,
    message: opts.message || process.env.AIGENCY_COMMIT_MESSAGE || undefined,
    yes: opts.yes || nonInteractive || false,
    json: opts.json || false,
    nonInteractive,
  };
}

function outputJson(intent: CommitIntent, message: string, committed: boolean): void {
  const author = detectAuthor();
  const result = {
    intent,
    message,
    committed,
    author,
    valid: true,
  };
  console.log(JSON.stringify(result, null, 2));
}

function outputText(message: string, label = "Commit message"): void {
  console.log(chalk.bold(`\n${label}:`));
  console.log(chalk.cyan("─".repeat(60)));
  console.log(message);
  console.log(chalk.cyan("─".repeat(60)));
}

async function main(): Promise<void> {
  const options = program.opts();
  const isHookMode = Boolean(options.prepareCommitMsgFile);
  const commitOptions = buildOptions();

  if (!hasStagedChanges()) {
    if (isHookMode) {
      return;
    }
    if (commitOptions.json) {
      console.log(JSON.stringify({ error: "No staged changes", staged: false }, null, 2));
    } else {
      console.log(chalk.yellow("⚠️  No staged changes. Run `git add` first.\n"));
    }
    process.exit(1);
  }

  let intent: CommitIntent;

  switch (options.mode as string) {
    case "guided":
      intent = await guidedCommit(commitOptions);
      break;
    case "suggested":
      intent = await suggestedCommit(commitOptions);
      break;
    case "auto":
      intent = await autoCommit(commitOptions);
      break;
    case "free":
      intent = await freeCommit(commitOptions);
      break;
    default:
      if (!isHookMode && !commitOptions.json) {
        console.log(chalk.red(`Unknown mode: ${options.mode}`));
        console.log(chalk.gray("Valid modes: guided, suggested, auto, free"));
      }
      process.exit(1);
  }

  // Add author metadata
  intent.author = detectAuthor();
  intent.timestamp = new Date();

  const message = formatCommitMessage(intent);

  // Validate unless free mode
  if (options.mode !== "free") {
    const validation = validateCommitMessage(message);
    if (!validation.valid) {
      if (!isHookMode && !commitOptions.json) {
        console.log(chalk.red("\n❌ Commit message is invalid:"));
        for (const err of validation.errors) {
          console.log(`  ${chalk.red("•")} ${err}`);
        }
        console.log();
      }
      if (commitOptions.json) {
        console.log(
          JSON.stringify({ intent, message, valid: false, errors: validation.errors }, null, 2)
        );
      }
      process.exit(1);
    }
  }

  if (isHookMode) {
    writeFileSync(options.prepareCommitMsgFile as string, message, "utf-8");
    return;
  }

  if (options.dryRun) {
    if (commitOptions.json) {
      outputJson(intent, message, false);
    } else {
      outputText(message);
      console.log(chalk.gray("\n(dry run — no commit made)\n"));
    }
    return;
  }

  if (commitOptions.json) {
    commit(message);
    outputJson(intent, message, true);
    return;
  }

  outputText(message);
  commit(message);
  console.log(chalk.green("\n✅ Committed successfully\n"));
}

main().catch((err) => {
  const opts = program.opts();
  if (opts.json || process.env.AIGENCY_COMMIT_JSON === "1") {
    console.log(JSON.stringify({ error: err.message || String(err) }, null, 2));
  } else {
    console.error(chalk.red("\n❌ Error:"), err.message || err);
  }
  process.exit(1);
});
