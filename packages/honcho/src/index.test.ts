import { describe, expect, it } from "vitest";
import * as honcho from "./index.js";

describe("Honcho", () => {
  it("should export module", () => {
    expect(honcho).toBeDefined();
  });
});
