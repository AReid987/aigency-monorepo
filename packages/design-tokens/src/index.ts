// @aigency/design-tokens — SynapTree W3C DTCG token exports
// Tokens live in synapttree-design-tokens.json (three tiers: atoms → molecules → organisms)
// See: aigency-vault/agents/iris/wiki/synapttree-design-tokens.json for full spec

import tokens from "./synapttree-design-tokens.json" assert { type: "json" };

export { tokens };
export default tokens;

// Type-safe accessors

export const agentColor = (callsign: string): string => {
  const key = callsign.toLowerCase().replace("_", "") as keyof typeof tokens.atoms.color.agent;
  return (tokens.atoms.color.agent as Record<string, { $value: string }>)[key]?.$value ?? "#FFFFFF";
};

export const nodeShape = (nodeType: string): string => {
  const key = nodeType.toLowerCase() as keyof typeof tokens.atoms.shape;
  return (
    (tokens.atoms.shape as Record<string, { $value: string }>)[key]?.$value ?? "SphereGeometry"
  );
};

export const opacityForAge = (ageHours: number): number => {
  if (ageHours < 24) {
    return tokens.atoms.opacity.fresh.$value as number;
  }
  if (ageHours < 72) {
    return tokens.atoms.opacity["semi-fresh"].$value as number;
  }
  if (ageHours < 168) {
    return tokens.atoms.opacity.aging.$value as number;
  }
  if (ageHours < 720) {
    return tokens.atoms.opacity.stale.$value as number;
  }
  if (ageHours < 2160) {
    return tokens.atoms.opacity.archived.$value as number;
  }
  return tokens.atoms.opacity.deprecated.$value as number;
};
