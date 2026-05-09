import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getRepoRoot } from "./git.js";

interface BackendInfo {
  type: string;
  model_path?: string;
  python_path?: string;
}

interface SuggestionResult {
  message: string;
  backend: string;
  error?: string;
}

function getBackendInfo(): BackendInfo | null {
  const repoRoot = getRepoRoot();
  const backendFile = join(repoRoot, "scripts", "automation", ".slm", "backend.json");

  if (!existsSync(backendFile)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(backendFile, "utf-8")) as BackendInfo;
  } catch {
    return null;
  }
}

function buildPrompt(files: string[], diff?: string): string {
  const fileList = files.slice(0, 30).join("\n");
  const hasDiff = diff && diff.length > 0;

  return `You are a commit message generator. Write a concise conventional commit message.

Staged files:
${fileList}

${hasDiff ? `Diff summary:\n${diff.slice(0, 2000)}\n\n` : ""}Rules:
- Format: type(scope): Subject line
- type must be one of: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
- Subject: max 50 chars, sentence case (capital first letter), no period at end
- Be specific about what changed
- Return ONLY the commit message, no explanation, no markdown

Commit message:`;
}

function cleanResponse(raw: string): string {
  // Remove <think> tags
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, "");
  // Remove code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "");
  cleaned = cleaned.replace(/^```[\w]*\n?/gm, "");
  cleaned = cleaned.replace(/```$/gm, "");
  // Take first non-empty line
  const lines = cleaned
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return "";
  }

  let message = lines[0];

  // Ensure sentence case
  if (message.length > 0) {
    message = message[0].toUpperCase() + message.slice(1);
  }

  return message;
}

function capitalizeSubject(message: string): string {
  const match = message.match(/^(\w+(?:\([^)]*\))?!?: )(.+)$/);
  if (!match) {
    return message;
  }
  const prefix = match[1];
  const subject = match[2];
  if (subject.length === 0) {
    return message;
  }
  return prefix + subject[0].toUpperCase() + subject.slice(1);
}

function tryLlamacpp(files: string[], diff?: string): SuggestionResult {
  const info = getBackendInfo();
  if (!info?.python_path || !info?.model_path) {
    return { message: "", backend: "llamacpp", error: "llama-cpp-python not configured" };
  }

  const prompt = buildPrompt(files, diff);

  // Write temp Python file to avoid heredoc escaping issues
  const tempPy = join("/tmp", `commit-agent-${Date.now()}.py`);
  const script = `
from llama_cpp import Llama

llm = Llama(
    model_path="${info.model_path.replace(/"/g, '\\"')}",
    n_ctx=2048,
    n_threads=4,
    verbose=False
)

output = llm(
    """${prompt.replace(/"/g, '\\"').replace(/\n/g, "\\n")}""",
    max_tokens=100,
    stop=["\\n", "</s>"],
    temperature=0.1,
)

print(output["choices"][0]["text"].strip())
`;

  try {
    writeFileSync(tempPy, script);

    const result = spawnSync(info.python_path, [tempPy], {
      encoding: "utf-8",
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024,
    });

    const raw = result.stdout?.trim() ?? "";
    const cleaned = cleanResponse(raw);

    if (cleaned?.includes(":")) {
      return {
        message: capitalizeSubject(cleaned),
        backend: "llamacpp",
      };
    }

    // Retry once
    const retry = spawnSync(info.python_path, [tempPy], {
      encoding: "utf-8",
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024,
    });

    const retryRaw = retry.stdout?.trim() ?? "";
    const retryCleaned = cleanResponse(retryRaw);

    if (retryCleaned?.includes(":")) {
      return {
        message: capitalizeSubject(retryCleaned),
        backend: "llamacpp",
      };
    }

    return { message: "", backend: "llamacpp", error: "Model returned invalid format" };
  } catch (e) {
    return { message: "", backend: "llamacpp", error: String(e) };
  }
}

function tryHeuristic(files: string[]): SuggestionResult {
  const fileGroups = groupFilesByType(files);

  let type = "chore";
  if (fileGroups.has("test") || fileGroups.has("spec")) {
    type = "test";
  } else if (fileGroups.has("fix") || files.some((f) => f.includes("fix"))) {
    type = "fix";
  } else if (fileGroups.has("feat") || files.some((f) => f.includes("feat"))) {
    type = "feat";
  } else if (fileGroups.has("doc") || files.some((f) => f.includes("doc"))) {
    type = "docs";
  } else if (fileGroups.has("style") || files.some((f) => f.includes("css"))) {
    type = "style";
  } else if (fileGroups.has("refactor")) {
    type = "refactor";
  }

  const dirs = [...new Set(files.map((f) => f.split("/")[0]))];
  const scope = dirs.length === 1 ? dirs[0] : undefined;

  const subject = `Update ${files.length === 1 ? files[0] : `${files.length} files`}`;

  const message = scope ? `${type}(${scope}): ${subject}` : `${type}: ${subject}`;

  return { message: capitalizeSubject(message), backend: "heuristic" };
}

function groupFilesByType(files: string[]): Set<string> {
  const groups = new Set<string>();
  for (const f of files) {
    if (f.includes("test") || f.includes("spec")) {
      groups.add("test");
    }
    if (f.endsWith(".md") || f.endsWith(".mdx")) {
      groups.add("doc");
    }
    if (f.endsWith(".css") || f.endsWith(".scss") || f.endsWith(".less")) {
      groups.add("style");
    }
    if (f.includes("refactor")) {
      groups.add("refactor");
    }
    if (f.includes("fix")) {
      groups.add("fix");
    }
    if (f.includes("feat")) {
      groups.add("feat");
    }
  }
  return groups;
}

export function generateCommitMessage(files: string[], diff?: string): SuggestionResult {
  if (files.length === 0) {
    return { message: "", backend: "none", error: "No staged files" };
  }

  const info = getBackendInfo();

  if (info?.type === "llamacpp") {
    const result = tryLlamacpp(files, diff);
    if (result.message) {
      return result;
    }
  }

  // MLX fallback would go here (spawn mlx_lm process)
  // llamafile fallback would go here

  // Final fallback
  return tryHeuristic(files);
}
