#!/usr/bin/env node
import { basename, resolve } from "node:path";
import { program } from "commander";
import {
  findProjectConfig,
  loadGlobalConfig,
  saveGlobalConfig,
  saveProjectConfig,
} from "./config.js";
import { analyzeAndBuildWiki, createTarball, uploadTarball } from "./sync.js";

program
  .name("repoatlas")
  .description("RepoAtlas CLI for syncing project docs to RepoAtlas")
  .version("0.1.0");

program
  .command("login")
  .description("Save the RepoAtlas API URL and token")
  .argument("<url>", "RepoAtlas server URL")
  .argument("<token>", "API token")
  .action(async (url: string, token: string) => {
    await saveGlobalConfig({ apiUrl: url.replace(/\/$/, ""), token });
  });

program
  .command("logout")
  .description("Remove saved credentials")
  .action(async () => {
    await saveGlobalConfig({});
  });

program
  .command("init")
  .description("Register this repository with RepoAtlas")
  .argument("[path]", "Repository path", ".")
  .option("-i, --id <id>", "Project ID")
  .option("-n, --name <name>", "Project name")
  .option("-r, --remote-url <url>", "Repository remote URL")
  .action(async (repoPath: string, options: { id?: string; name?: string; remoteUrl?: string }) => {
    const cwd = resolve(repoPath);
    const globalConfig = await loadGlobalConfig();
    if (!globalConfig.apiUrl || !globalConfig.token) {
      console.error("Run 'repoatlas login <url> <token>' first.");
      process.exit(1);
    }

    const projectId = options.id ?? basename(cwd);
    const projectName = options.name ?? projectId;

    const res = await fetch(`${globalConfig.apiUrl}/api/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${globalConfig.token}`,
      },
      body: JSON.stringify({ id: projectId, name: projectName, remoteUrl: options.remoteUrl }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`Failed to register project (${res.status}): ${text}`);
      process.exit(1);
    }

    await saveProjectConfig(cwd, { projectId, apiUrl: globalConfig.apiUrl });
  });

program
  .command("sync")
  .description("Analyze with gitnexus and upload docs to RepoAtlas")
  .argument("[path]", "Repository path", ".")
  .option("--no-analyze", "Skip gitnexus analyze + wiki")
  .action(async (repoPath: string, options: { analyze: boolean }) => {
    const cwd = resolve(repoPath);
    const found = await findProjectConfig(cwd);
    if (!found) {
      console.error("No .repoatlas.json found. Run 'repoatlas init' first.");
      process.exit(1);
    }

    const globalConfig = await loadGlobalConfig();
    if (!globalConfig.token) {
      console.error("Run 'repoatlas login <url> <token>' first.");
      process.exit(1);
    }

    if (options.analyze) {
      await analyzeAndBuildWiki(found.root, {
        projectId: found.config.projectId,
        projectName: found.config.projectId,
      });
    }

    const tarPath = await createTarball(found.root);
    await uploadTarball(tarPath, found.config, globalConfig);
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
