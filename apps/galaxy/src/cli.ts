#!/usr/bin/env node

import { createGalaxy } from "./index.js";

// ─── CLI ─────────────────────────────────────────────────────────────────────

const HELP = `
galaxy — Hermes + OMP Orchestrator

Usage:
  galaxy status              Check Hermes and OMP connectivity
  galaxy venture list        List all ventures
  galaxy venture create <id> <name>  Create a new venture
  galaxy task <venture-id> <task>    Execute a task on a venture
  galaxy chat <message>      Send a direct message to OMP
  galaxy help                Show this help

Environment:
  HERMES_BASE_URL            Hermes API URL (default: http://galaxy-oracle:8080)
  HERMES_API_KEY             Hermes API key
  OMP_SSH_HOST               OMP SSH host (default: macbook-pro)
  OMP_SSH_USER               OMP SSH user
  OMP_SSH_KEY_PATH           OMP SSH private key path
  OMP_SSH_PORT               OMP SSH port (default: 22)
  GALAXY_VENTURES_DIR        Ventures base directory (default: ~/galaxy/ventures)
  GALAXY_DEFAULT_SKILLS      Comma-separated skills (default: gstack,paul,carl)
  GALAXY_TASK_TIMEOUT        Task timeout in ms (default: 600000)
  GALAXY_DEFAULT_MODEL       Model as provider/modelId
`;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "help") {
    console.info(HELP);
    return;
  }

  if (command === "status") {
    await handleStatus();
    return;
  }

  if (command === "venture") {
    await handleVenture(args.slice(1));
    return;
  }

  if (command === "task") {
    await handleTask(args.slice(1));
    return;
  }

  if (command === "chat") {
    await handleChat(args.slice(1));
    return;
  }

  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

async function handleStatus(): Promise<void> {
  const galaxy = await createGalaxy();

  try {
    await galaxy.hermes.healthCheck();
    await galaxy.ompClient.getState();
    console.info("Status check complete");
  } finally {
    galaxy.dispose();
  }
}

async function handleVenture(args: string[]): Promise<void> {
  const subcommand = args[0];

  if (subcommand === "list") {
    const galaxy = await createGalaxy();
    try {
      const ventures = galaxy.orchestrator.listVentures();
      console.info(`Ventures: ${ventures.length}`);
      if (ventures.length === 0) {
        console.info("No ventures found. Run `galaxy venture create <id> <name>` to add one.");
      } else {
        for (const venture of ventures) {
          console.info(`  - ${venture.id}: ${venture.name}`);
        }
      }
    } finally {
      galaxy.dispose();
    }
    return;
  }

  if (subcommand === "create") {
    const id = args[1];
    const name = args.slice(2).join(" ");
    if (!id || !name) {
      console.error("Usage: galaxy venture create <id> <name>");
      process.exit(1);
    }
    const galaxy = await createGalaxy();
    try {
      const venture = galaxy.orchestrator.createVenture(id, name);
      console.info(`Created venture: ${venture.id} - ${venture.name}`);
    } finally {
      galaxy.dispose();
    }
    return;
  }

  console.error("Usage: galaxy venture [list|create]");
  process.exit(1);
}

async function handleTask(args: string[]): Promise<void> {
  const ventureId = args[0];
  const task = args.slice(1).join(" ");

  if (!ventureId || !task) {
    console.error("Usage: galaxy task <venture-id> <task description>");
    process.exit(1);
  }

  const galaxy = await createGalaxy();
  try {
    const result = await galaxy.orchestrator.executeTask({ ventureId, task });

    if (result.output) {
      console.info(result.output);
    }

    if (result.error) {
      console.error(`\nError: ${result.error}`);
    }
  } finally {
    galaxy.dispose();
  }
}

async function handleChat(args: string[]): Promise<void> {
  const message = args.join(" ");
  if (!message) {
    console.error("Usage: galaxy chat <message>");
    process.exit(1);
  }

  const galaxy = await createGalaxy();
  try {
    const ack = await galaxy.ompClient.prompt(message);
    if (ack.success) {
      console.info("Message delivered to OMP.");
    } else {
      console.error(`Error: ${ack.error ?? "unknown"}`);
    }
  } finally {
    galaxy.dispose();
  }
}

main().catch((error) => {
  console.error("Galaxy error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
