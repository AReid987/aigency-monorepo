import { existsSync, readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import type { ViteDevServer } from "vite";

type NextFunction = () => void;

function serveGitNexusWiki() {
  return {
    name: "serve-gitnexus-wiki",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(
        "/.gitnexus/wiki",
        (req: IncomingMessage, res: ServerResponse, next: NextFunction) => {
          const filePath = resolve(
            __dirname,
            "../../.gitnexus/wiki",
            req.url?.replace(/^\//, "") ?? ""
          );
          if (existsSync(filePath)) {
            const content = readFileSync(filePath, "utf-8");
            const ext = filePath.split(".").pop();
            const mime: Record<string, string> = {
              json: "application/json",
              md: "text/markdown",
              html: "text/html",
            };
            res.setHeader("Content-Type", mime[ext ?? ""] ?? "text/plain");
            res.end(content);
          } else {
            next();
          }
        }
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), serveGitNexusWiki()],
  server: {
    port: 3000,
    open: true,
    fs: {
      allow: ["..", resolve(__dirname, "../../.gitnexus")],
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  publicDir: false,
});
