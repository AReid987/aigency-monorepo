import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export interface ProjectConfig {
  projectId: string;
  apiUrl: string;
}

const globalDir = join(homedir(), ".repoatlas");
const globalPath = join(globalDir, "config.json");
const localFilename = ".repoatlas.json";

export interface GlobalConfig {
  apiUrl?: string;
  token?: string;
}

export async function loadGlobalConfig(): Promise<GlobalConfig> {
  if (!existsSync(globalPath)) {
    return {};
  }
  const raw = await readFile(globalPath, "utf-8");
  return JSON.parse(raw) as GlobalConfig;
}

export async function saveGlobalConfig(config: GlobalConfig): Promise<void> {
  await mkdir(globalDir, { recursive: true });
  await writeFile(globalPath, JSON.stringify(config, null, 2));
}

export async function loadProjectConfig(cwd: string): Promise<ProjectConfig | null> {
  const path = join(cwd, localFilename);
  if (!existsSync(path)) {
    return null;
  }
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw) as ProjectConfig;
}

export async function saveProjectConfig(cwd: string, config: ProjectConfig): Promise<void> {
  await writeFile(join(cwd, localFilename), JSON.stringify(config, null, 2));
}

export async function findProjectConfig(
  startDir: string
): Promise<{ config: ProjectConfig; root: string } | null> {
  let dir = startDir;
  while (true) {
    const config = await loadProjectConfig(dir);
    if (config) {
      return { config, root: dir };
    }
    const parent = join(dir, "..");
    if (parent === dir) {
      return null;
    }
    dir = parent;
  }
}
