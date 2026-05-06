/** @type {import('jest').Config} */
export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          module: "ESNext",
          moduleResolution: "bundler",
          noUnusedLocals: false,
          noUnusedParameters: false,
          strict: false,
        },
        diagnostics: {
          ignoreCodes: [2678, 2339, 6133],
        },
      },
    ],
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.d.ts",
    "!src/**/__mocks__/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "text-summary", "lcov", "json"],
  // Thresholds are enforced by scripts/automation/coverage-check.sh
  // and codecov.yml, not by Jest itself. This allows tests to run
  // and generate reports even when coverage is below target.
  testMatch: ["**/*.test.ts"],
  passWithNoTests: true,
};
