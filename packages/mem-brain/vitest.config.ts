import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@aigency/surreal": path.resolve(__dirname, "../surreal/src/index.ts"),
      "@aigency/honcho": path.resolve(__dirname, "../honcho/src/index.ts"),
      "@aigency/agent-core": path.resolve(__dirname, "../agent-core/src/index.ts"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    reporter: ["default", "junit"],
    outputFile: {
      junit: "./coverage/junit.xml",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "lcov", "json"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/*.d.ts", "dist/**"],
      // Thresholds enforced by scripts/automation/coverage-check.sh
    },
  },
});
