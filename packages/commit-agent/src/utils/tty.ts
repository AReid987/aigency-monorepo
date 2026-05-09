export function isInteractive(): boolean {
  return Boolean(
    process.stdin.isTTY &&
      process.stdout.isTTY &&
      process.env.AIGENCY_COMMIT_NON_INTERACTIVE !== "1" &&
      process.env.CI !== "true" &&
      process.env.GITHUB_ACTIONS !== "true"
  );
}

export function detectAuthor(): "human" | "agent" {
  if (process.env.AIGENCY_COMMIT_AGENT === "1") {
    return "agent";
  }
  if (process.env.CI === "true") {
    return "agent";
  }
  if (!isInteractive()) {
    return "agent";
  }
  return "human";
}

export function getEnvOrDefault<T>(
  key: string,
  defaultValue: T,
  transform?: (val: string) => T
): T {
  const val = process.env[key];
  if (val === undefined) {
    return defaultValue;
  }
  return transform ? transform(val) : (val as unknown as T);
}
