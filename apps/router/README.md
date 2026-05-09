# @aigency/router

> Aigency LLM Router — OpenAI-compatible proxy with quota-aware routing, local SLM support, and agent-identity context.

## Overview

The router provides:

- OpenAI-compatible `/v1/chat/completions` endpoint
- Quota-aware provider routing
- Local SLM support (MLX, Llama.cpp)
- Environment-based configuration

## Usage

```bash
# Start the router
pnpm dev

# Or use the CLI
node dist/cli.js
```

The router listens on `http://127.0.0.1:8402` by default.

## Configuration

Set `OPENAI_API_BASE` to use the router:

```bash
export OPENAI_API_BASE="http://127.0.0.1:8402/v1"
export OPENAI_API_KEY="dummy"
```

## Commands

```bash
pnpm dev           # start dev server
pnpm build         # build with tsup
pnpm test          # run tests
pnpm test:coverage # run tests with coverage
pnpm typecheck     # TypeScript check
```
