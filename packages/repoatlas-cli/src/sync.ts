import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { create } from "tar";
import type { GlobalConfig, ProjectConfig } from "./config.js";

function run(cmd: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd, stdio: "inherit" });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited with ${code}`));
    });
  });
}

export async function analyzeAndBuildWiki(cwd: string): Promise<void> {
  if (!existsSync(join(cwd, ".git"))) {
    throw new Error("Not a git repository: " + cwd);
  }

  await run("npx", ["gitnexus", "analyze"], cwd);
  await run("npx", ["gitnexus", "wiki"], cwd);
}

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
  if (!apiUrl) throw new Error("No API URL configured. Run 'repoatlas login <url> <token>' first.");
  if (!token) throw new Error("No API token configured. Run 'repoatlas login <url> <token>' first.");

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

  const body = (await res.json()) as { projectName?: string; wikiCount?: number };
  console.log(`Synced ${body.projectName ?? projectConfig.projectId} (${body.wikiCount ?? 0} wiki pages) to ${apiUrl}`);
}
