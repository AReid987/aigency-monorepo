import { describe, expect, it } from "vitest";
import * as vaultTools from "./index.js";

describe("Vault Tools", () => {
  it("should export module", () => {
    expect(vaultTools).toBeDefined();
  });
});
