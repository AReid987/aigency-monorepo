import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface VaultConfig {
  vaultRoot: string;
  llmBackend: "mlx" | "llama_cpp" | "claude" | "openai";
  mlxEndpoint?: string;       // e.g. "http://localhost:8080"
  tailnetNodes?: string[];    // e.g. ["http://100.x.x.1:8080", "http://100.x.x.2:8080"]
  compilationModel?: string;  // model ID to use for compile pass
  lintThresholds: {
    minHealthScore: number;   // default: 85
    minWikiDensity: number;   // default: 0.70
    minVaultAgeDays: number;  // default: 90
  };
}

export const DEFAULT_CONFIG: VaultConfig = {
  vaultRoot: process.cwd(),
  llmBackend: "claude",
  lintThresholds: {
    minHealthScore: 85,
    minWikiDensity: 0.70,
    minVaultAgeDays: 90,
  },
};

export function loadConfig(vaultRoot: string): VaultConfig {
  const configPath = join(vaultRoot, "config", "vault.json");
  if (!existsSync(configPath)) return { ...DEFAULT_CONFIG, vaultRoot };

  const raw = readFileSync(configPath, "utf-8");
  return { ...DEFAULT_CONFIG, ...JSON.parse(raw), vaultRoot };
}
