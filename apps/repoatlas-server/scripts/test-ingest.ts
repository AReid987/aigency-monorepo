import { readFileSync } from "node:fs";
import { createSqlClient, getWikiPages } from "../src/db/index.js";
import { ingestGitnexusTarball } from "../src/lib/extract.js";

async function main() {
  const sql = createSqlClient("postgres://repoatlas:repoatlas@localhost:5433/repoatlas");
  const buffer = readFileSync("/tmp/aigency-router-v2.gitnexus.tar.gz");
  const result = await ingestGitnexusTarball(sql, "aigency-router-v2", buffer);
  console.log("ingest result", result);
  const pages = await getWikiPages(sql, "aigency-router-v2");
  console.log("pages in db after ingest", pages.length, pages.slice(0, 2).map((p) => p.slug));
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
