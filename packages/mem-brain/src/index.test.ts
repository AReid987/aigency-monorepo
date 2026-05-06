import { describe, expect, it } from "vitest";
import * as memBrain from "./index.js";

describe("Mem Brain", () => {
  it("should export module", () => {
    expect(memBrain).toBeDefined();
  });
});
