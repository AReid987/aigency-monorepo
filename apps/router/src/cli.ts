#!/usr/bin/env node
/**
 * SimpleLLMRouter CLI
 */

import "dotenv/config";
import { initializeConfig } from "./config/index.js";
import { startServer } from "./server.js";

const args = process.argv.slice(2);
const command = args[0];

if (command === "start" || !command) {
  // Parse port from args
  const portArg = args.find((arg) => arg.startsWith("--port="));
  const port = portArg ? Number.parseInt(portArg.split("=")[1]) : undefined;

  // Initialize configuration first
  initializeConfig()
    .then(() => {
      // Start server after config is loaded
      return startServer({ port });
    })
    .catch((err) => {
      console.error("Failed to start server:", err);
      process.exit(1);
    });
} else if (command === "help" || command === "--help" || command === "-h") {
} else {
  console.error(`Unknown command: ${command}`);
  console.error('Run "simplellmrouter help" for usage information');
  process.exit(1);
}
