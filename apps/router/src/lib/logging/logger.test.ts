// src/lib/logging/logger.test.ts
import { initLogger, logger } from "./logger.js";

describe("Logger", () => {
  it("should be initialized without errors", () => {
    expect(() => initLogger({ level: "info" })).not.toThrow();
  });

  it("should have a log method", () => {
    expect(logger).toHaveProperty("info");
  });
});
