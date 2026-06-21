import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import process from "node:process";
import { config } from "./lib/config.js";
import { createSqlClient, migrate } from "./db/index.js";
import { createPublicRoutes } from "./routes/public.js";
import { createUploadRoutes } from "./routes/upload.js";

async function main() {
  const sql = createSqlClient(config.databaseUrl);

  if (config.applyMigrations) {
    await migrate(sql);
  }

  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: config.corsOrigin === "*" ? "*" : config.corsOrigin.split(","),
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Authorization", "Content-Type"],
    })
  );

  app.route("/", createPublicRoutes(sql));
  app.route("/", createUploadRoutes(sql));

  serve({
    fetch: app.fetch,
    port: config.port,
  });

  console.log(`RepoAtlas server listening on http://localhost:${config.port}`);

  process.on("SIGINT", async () => {
    await sql.end();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
