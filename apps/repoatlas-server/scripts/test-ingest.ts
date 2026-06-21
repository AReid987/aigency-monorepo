import { readFileSync } from "node:fs";
import { createSqlClient, getWikiPages } from "../src/db/index.js";
import { ingestGitnexusTarball } from "../src/lib/extract.js";

async function main() {
  const sql = createSqlClient("postgres://repoatlas:repoatlas@localhost:5433/repoatlas");
  const buffer = readFileSync("/tmp/aigency-router-v2.gitnexus.tar.gz");
  const _result = await ingestGitnexusTarball(sql, "aigency-router-v2", buffer);
  const _pages = await getWikiPages(sql, "aigency-router-v2");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
