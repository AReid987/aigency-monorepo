// vault-tools/compile.ts — port of compile.py
// Reads raw/ session docs and compiles them into wiki/ articles via LLM.
// Respects config.llmBackend: mlx | llama_cpp | claude

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, basename } from "node:path";
import type { VaultConfig } from "./config.js";

const COMPILE_SYSTEM_PROMPT = `You are the LIBRARIAN (Ren Nakamura), knowledge graph curator for Aigency.
Your task: transform a raw session note into a polished wiki article.
- Extract key decisions, patterns, and insights
- Write in clear, direct prose — no fluff
- Preserve all technical specifics
- Format with ## headers, no bullet dumps
- Output markdown only`;

async function callLLM(config: VaultConfig, prompt: string): Promise<string> {
  const endpoint =
    config.llmBackend === "mlx" || config.llmBackend === "llama_cpp"
      ? config.mlxEndpoint ?? "http://localhost:8080"
      : "https://api.anthropic.com/v1";

  if (config.llmBackend === "claude") {
    // Delegate to claude API — only for heavy compilation tasks
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic();
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: COMPILE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });
    return (msg.content[0] as { text: string }).text;
  }

  // OpenAI-compatible endpoint (MLX / Llama.cpp)
  const res = await fetch(`${endpoint}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.compilationModel ?? "local",
      messages: [
        { role: "system", content: COMPILE_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      max_tokens: 4096,
    }),
  });

  const data = (await res.json()) as { choices: [{ message: { content: string } }] };
  return data.choices[0].message.content;
}

export async function compile(
  config: VaultConfig,
  target: string = "_global"
): Promise<{ compiled: number; skipped: number }> {
  const targetRaw  = join(config.vaultRoot, target, "raw");
  const targetWiki = join(config.vaultRoot, target, "wiki");

  if (!existsSync(targetRaw)) {
    console.warn(`[compile] No raw/ directory at ${targetRaw}`);
    return { compiled: 0, skipped: 0 };
  }

  mkdirSync(targetWiki, { recursive: true });

  const rawFiles = readdirSync(targetRaw).filter((f) => f.endsWith(".md"));
  let compiled = 0;
  let skipped  = 0;

  for (const file of rawFiles) {
    const wikiFile = join(targetWiki, file.replace(/^session-/, "wiki-"));
    if (existsSync(wikiFile)) { skipped++; continue; }

    const raw = readFileSync(join(targetRaw, file), "utf-8");
    const prompt = `Transform this raw session note into a wiki article:\n\n${raw}`;

    console.log(`[compile] Processing ${file}...`);
    const article = await callLLM(config, prompt);
    writeFileSync(wikiFile, article, "utf-8");
    compiled++;
  }

  console.log(`[compile] Done. ${compiled} compiled, ${skipped} skipped.`);
  return { compiled, skipped };
}
