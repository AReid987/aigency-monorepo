import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts", "src/index.ts"],
  format: ["esm", "cjs"],
  dts: false,
  clean: true,
  // Shebang added via post-build script to avoid ESM issues
  external: ["commander", "chalk", "ora", "@inquirer/prompts"],
});
