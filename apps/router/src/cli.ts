#!/usr/bin/env node
/**
 * SimpleLLMRouter CLI
 */

import 'dotenv/config';
import { startServer } from './server.js';
import { initializeConfig } from './config/index.js';

const args = process.argv.slice(2);
const command = args[0];

if (command === 'start' || !command) {
  // Parse port from args
  const portArg = args.find(arg => arg.startsWith('--port='));
  const port = portArg ? parseInt(portArg.split('=')[1]) : undefined;

  console.log('SimpleLLMRouter v1.0.0');
  console.log('Intelligent LLM routing for OpenClaw\n');

  // Initialize configuration first
  initializeConfig().then(() => {
    // Start server after config is loaded
    return startServer({ port });
  }).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
} else if (command === 'help' || command === '--help' || command === '-h') {
  console.log(`
SimpleLLMRouter - Intelligent LLM Router for OpenClaw

Usage:
  simplellmrouter start [--port=8402]    Start the router server
  simplellmrouter help                   Show this help message

Environment Variables:
  PROVIDER_MISTRAL_API_KEY    Mistral API key
  PROVIDER_GROQ_API_KEY       Groq API key
  PROVIDER_GEMINI_API_KEY     Gemini API key
  PROVIDER_CEREBRAS_API_KEY   Cerebras API key
  PROVIDER_OPENROUTER_API_KEY OpenRouter API key
  PROVIDER_VOIDAI_API_KEY     VoidAI API key
  PROVIDER_ZAI_API_KEY        z.ai API key
  PROVIDER_KIMI_API_KEY       Kimi API key

Configuration:
  Config files are loaded from config/ directory:
  - config/providers.{environment}.yaml (environment-specific)
  - config/providers.yaml (default)

Example:
  export PROVIDER_MISTRAL_API_KEY="your_key"
  export PROVIDER_GROQ_API_KEY="your_key"
  simplellmrouter start
  `);
} else {
  console.error(`Unknown command: ${command}`);
  console.error('Run "simplellmrouter help" for usage information');
  process.exit(1);
}
