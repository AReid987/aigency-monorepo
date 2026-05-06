import { describe, expect, it } from "vitest";
import { SurrealClient } from "./client.js";

describe("SurrealClient", () => {
  it("should be defined", () => {
    expect(SurrealClient).toBeDefined();
  });
});
