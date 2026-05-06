import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
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
