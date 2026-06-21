// @aigency/design-tokens — SynapTree + Aigency token exports
// Tokens live in JSON files (W3C DTCG format).
// See: aigency-intel-ops/brand-spec.md and DESIGN.md for Aigency visual spec.

import aigencyTokens from "./aigency-design-tokens.json" assert { type: "json" };
import tokens from "./synapttree-design-tokens.json" assert { type: "json" };

export { aigencyTokens, tokens };
export default tokens;

// Type-safe accessors (SynapTree)

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

// Aigency helpers

function kebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function walkAigencyTokens(prefix: string, node: unknown, out: Record<string, string>): void {
  if (typeof node !== "object" || node === null) {
    return;
  }
  if ("$value" in node && typeof (node as { $value: unknown }).$value !== "object") {
    out[prefix] = String((node as { $value: unknown }).$value);
    return;
  }
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (key.startsWith("$")) {
      continue;
    }
    const nextPrefix = prefix ? `${prefix}-${kebabCase(key)}` : `--aig-${kebabCase(key)}`;
    walkAigencyTokens(nextPrefix, value, out);
  }
}

export function generateAigencyCssVariables(): string {
  const vars: Record<string, string> = {};
  walkAigencyTokens("", (aigencyTokens as { atoms: unknown }).atoms, vars);
  const entries = Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`);
  return `:root {\n${entries.join("\n")}\n}`;
}

export function aigencyValue(path: string): string | undefined {
  const parts = path.split(".");
  let node: unknown = aigencyTokens.atoms;
  for (const part of parts) {
    if (typeof node !== "object" || node === null) {
      return undefined;
    }
    node = (node as Record<string, unknown>)[part];
  }
  if (typeof node === "object" && node !== null && "$value" in node) {
    return String((node as { $value: unknown }).$value);
  }
  return undefined;
}
