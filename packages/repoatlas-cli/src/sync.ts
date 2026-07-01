import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { create } from "tar";
import type { GlobalConfig, ProjectConfig } from "./config.js";
import { analyzeAndBuildWiki } from "./lib/analyze.js";

export { analyzeAndBuildWiki };

export async function createTarball(cwd: string): Promise<string> {
  const gitnexusDir = join(cwd, ".gitnexus");
  if (!existsSync(gitnexusDir)) {
    throw new Error("No .gitnexus directory found. Run 'repoatlas sync' after gitnexus analyze.");
  }
  const tmpDir = join(cwd, "node_modules", ".cache", "repoatlas");
  await mkdir(tmpDir, { recursive: true });
  const tarPath = join(tmpDir, `repoatlas-${Date.now()}.tar.gz`);

  await create(
    {
      gzip: true,
      file: tarPath,
      cwd,
    },
    [".gitnexus"]
  );

  return tarPath;
}

export async function uploadTarball(
  tarPath: string,
  projectConfig: ProjectConfig,
  globalConfig: GlobalConfig
): Promise<void> {
  const apiUrl = globalConfig.apiUrl ?? projectConfig.apiUrl;
  const token = globalConfig.token;
  if (!apiUrl) {
    throw new Error("No API URL configured. Run 'repoatlas login <url> <token>' first.");
  }
  if (!token) {
    throw new Error("No API token configured. Run 'repoatlas login <url> <token>' first.");
  }

  const form = new FormData();
  const buffer = await readFile(tarPath);
  form.append("tarball", new Blob([buffer]), "gitnexus.tar.gz");

  const url = new URL(`/api/projects/${projectConfig.projectId}/sync`, apiUrl);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed (${res.status}): ${text}`);
  }

  await res.json();
}
