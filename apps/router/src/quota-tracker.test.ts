import { existsSync, readFileSync } from "node:fs";
import type { ModelConfig } from "./config/schema.js";
import { logger } from "./lib/logging/logger.js";
// src/quota-tracker.test.ts
import { QuotaTracker } from "./quota-tracker.js";

// Mock setInterval and clearInterval to prevent background tasks from keeping tests alive
jest.useFakeTimers();

jest.mock("node:fs", () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

jest.mock("./lib/logging/logger.js", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
  initLogger: jest.fn(),
}));

describe("QuotaTracker", () => {
  let tracker: QuotaTracker;
  const mockDataDir = "./.test-simplellmrouter";

  beforeEach(() => {
    jest.clearAllMocks();
    (existsSync as jest.Mock).mockReturnValue(false); // Assume no file exists by default
    (readFileSync as jest.Mock).mockReturnValue("[]"); // Empty array by default
    tracker = new QuotaTracker(mockDataDir);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.useRealTimers(); // Restore real timers after all tests in this suite
  });

  it("should log warning when quota is approaching limits", () => {
    // Given
    const modelId = "test-provider/test-model";
    const quotaConfig: ModelConfig["quota"] = {
      dailyRequests: 10,
      quotaSize: "tiny",
    };

    // When
    // Record 7 requests to reach 70% (below warning threshold)
    for (let i = 0; i < 7; i++) {
      tracker.recordRequest(modelId, 1, quotaConfig);
    }
    // Record 1 more request to reach 80% (warning threshold)
    tracker.recordRequest(modelId, 1, quotaConfig);

    // Then
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining(`WARNING: ${modelId} at 80% of daily quota`)
    );
    expect(logger.error).not.toHaveBeenCalled(); // Ensure no critical error is logged
  });

  it("should log critical alert when quota is exceeded", () => {
    // Given
    const modelId = "test-provider/test-model";
    const quotaConfig: ModelConfig["quota"] = {
      dailyRequests: 10,
      quotaSize: "tiny",
    };

    // When
    // Record 9 requests to reach 90% (below critical threshold)
    for (let i = 0; i < 9; i++) {
      tracker.recordRequest(modelId, 1, quotaConfig);
    }
    // Record 1 more request to reach 100% (critical threshold)
    tracker.recordRequest(modelId, 1, quotaConfig);

    // Then
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining(`CRITICAL: ${modelId} at 100% of daily quota`)
    );
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining(`WARNING: ${modelId} at 90% of daily quota`)
    );
  });
});
