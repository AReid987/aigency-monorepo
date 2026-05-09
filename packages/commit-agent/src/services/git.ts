import { execSync } from "node:child_process";

export function getStagedFiles(): string[] {
  try {
    const output = execSync("git diff --name-only --cached", { encoding: "utf-8" });
    return output.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

export function getStagedDiff(maxLength = 5000): string {
  try {
    const output = execSync("git diff --cached", { encoding: "utf-8" });
    if (output.length > maxLength) {
      return `${output.slice(0, maxLength)}\n... [truncated]`;
    }
    return output;
  } catch {
    return "";
  }
}

export function hasStagedChanges(): boolean {
  try {
    execSync("git diff --cached --quiet");
    return false; // No changes if exit 0
  } catch {
    return true; // Exit non-zero means changes exist
  }
}

export function commit(message: string): void {
  execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { stdio: "inherit" });
}

export function getRepoRoot(): string {
  try {
    return execSync("git rev-parse --show-toplevel", { encoding: "utf-8" }).trim();
  } catch {
    return process.cwd();
  }
}
