import { describe, expect, it } from "vitest";
import { AGENT_REGISTRY } from "./index.js";

describe("Agent Core", () => {
  it("should export AGENT_REGISTRY with all agents", () => {
    expect(AGENT_REGISTRY).toBeDefined();
    expect(Object.keys(AGENT_REGISTRY).length).toBeGreaterThan(0);
  });

  it("should have THE_ARCHITECT as a valid agent", () => {
    const architect = AGENT_REGISTRY.THE_ARCHITECT;
    expect(architect).toBeDefined();
    expect(architect.callsign).toBe("THE_ARCHITECT");
    expect(architect.name).toBe("Antonio Reid");
    expect(architect.role).toBe("Founder & Chief Architect");
  });

  it("should have all required agent properties", () => {
    for (const [, agent] of Object.entries(AGENT_REGISTRY)) {
      expect(agent.callsign).toBeDefined();
      expect(agent.name).toBeDefined();
      expect(agent.role).toBeDefined();
      expect(agent.color).toMatch(/^#/);
      expect(agent.substrate).toBeDefined();
    }
  });
});
