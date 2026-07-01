#!/usr/bin/env node
import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeAndBuildWiki } from "../../../packages/repoatlas-cli/src/sync.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "../../..");
const dataDir = join(scriptDir, "data", "aigency-monorepo");

async function main() {
  await analyzeAndBuildWiki(repoRoot, {
    projectId: "aigency-monorepo",
    projectName: "aigency-monorepo",
  });

  await rm(dataDir, { recursive: true, force: true });
  await mkdir(dataDir, { recursive: true });

  const sourceDir = join(repoRoot, ".gitnexus");
  await cp(join(sourceDir, "meta.json"), join(dataDir, "meta.json"));
  await cp(join(sourceDir, "wiki"), join(dataDir, "wiki"), { recursive: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
