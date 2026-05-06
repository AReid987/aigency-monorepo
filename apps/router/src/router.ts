import { getEnabledProviders } from "./config/index.js";
import { logger } from "./lib/logging/logger.js";

export type Tier = "SIMPLE" | "MEDIUM" | "COMPLEX" | "REASONING";

export interface RoutingDecision {
  tier: Tier;
  model: string; // Full model ID: "provider/model"
  confidence: number;
  reasoning: string;
  fallbackChain: string[];
  quotaSize: string;
}

export interface RequestClassification {
  messages: Array<{ role: string; content: string }>;
  sanitizedPrompt: string;
  tier: Tier;
  score: number;
  reasoning: string[];
}

export interface RouterConfig {
  preferLargeQuota: boolean; // Prefer models with larger quotas (default: true)
  enableFallback: boolean; // Enable automatic fallback on failure
  rateLimitCooldown: number; // Seconds to avoid rate-limited models (default: 60)
  minConfidenceThreshold: number; // Minimum confidence to use a model (0-1)
}

export const DEFAULT_ROUTER_CONFIG: RouterConfig = {
  preferLargeQuota: true,
  enableFallback: true,
  rateLimitCooldown: 60,
  minConfidenceThreshold: 0.3,
};

/**
 * Rate Limit Tracker
 * Tracks which models are rate-limited and should be avoided
 */
export class RateLimitTracker {
  private rateLimitedModels: Map<string, number> = new Map();
  private cooldownMs: number;

  constructor(cooldownSeconds = 60) {
    this.cooldownMs = cooldownSeconds * 1000;
  }

  markRateLimited(modelId: string): void {
    this.rateLimitedModels.set(modelId, Date.now() + this.cooldownMs);
    logger.warn(`⚠️  Rate limited: ${modelId} (cooldown: ${this.cooldownMs / 1000}s)`);
  }

  isRateLimited(modelId: string): boolean {
    const expiry = this.rateLimitedModels.get(modelId);
    if (!expiry) {
      return false;
    }

    if (Date.now() >= expiry) {
      this.rateLimitedModels.delete(modelId);
      return false;
    }

    return true;
  }

  getRateLimitedModels(): string[] {
    // Clean up expired entries
    const now = Date.now();
    const entries = Array.from(this.rateLimitedModels.entries());
    for (const [modelId, expiry] of entries) {
      if (now >= expiry) {
        this.rateLimitedModels.delete(modelId);
      }
    }
    return Array.from(this.rateLimitedModels.keys());
  }

  clear(): void {
    this.rateLimitedModels.clear();
  }
}

/**
 * Classify request into tier using 14-dimension scoring
 * Based on ClawRouter's proven classification system
 */
export function classifyRequest(
  messages: Array<{ role: string; content: string }>
): RequestClassification {
  const lastMessage = messages[messages.length - 1]?.content || "";
  const conversationLength = messages.length;

  // Basic sanitization: take first 100 characters and replace newlines
  const sanitizedPrompt = lastMessage.substring(0, 100).replace(/\n/g, "\\n");

  let score = 0;
  const reasoning: string[] = [];

  // 1. Token count estimate (0-3 points)
  const tokenEstimate = lastMessage.length / 4;
  if (tokenEstimate > 2000) {
    score += 3;
    reasoning.push("Long input (>2K tokens)");
  } else if (tokenEstimate > 500) {
    score += 1;
    reasoning.push("Medium input (500-2K tokens)");
  }

  // 2. Code presence (0-2 points)
  const hasCodeBlock = /```/.test(lastMessage);
  const hasInlineCode = /`[^`]+`/.test(lastMessage);
  if (hasCodeBlock) {
    score += 2;
    reasoning.push("Contains code blocks");
  } else if (hasInlineCode) {
    score += 1;
  }

  // 3. Reasoning keywords (0-3 points)
  const reasoningKeywords = [
    "analyze",
    "compare",
    "evaluate",
    "explain why",
    "reasoning",
    "step by step",
    "think through",
    "consider",
    "determine",
    "prove",
    "justify",
    "logic",
    "deduce",
    "infer",
  ];
  const reasoningCount = reasoningKeywords.filter((kw) =>
    lastMessage.toLowerCase().includes(kw)
  ).length;
  if (reasoningCount >= 3) {
    score += 3;
    reasoning.push("Multiple reasoning keywords");
  } else if (reasoningCount >= 1) {
    score += reasoningCount;
    reasoning.push("Reasoning keywords present");
  }

  // 4. Math/calculation (0-2 points)
  const hasMath = /(\d+[\+\-\*\/\^]\d+)|integral|derivative|equation|formula|calculate/i.test(
    lastMessage
  );
  if (hasMath) {
    score += 2;
    reasoning.push("Math/calculations required");
  }

  // 5. Multi-turn conversation (0-2 points)
  if (conversationLength > 5) {
    score += 2;
    reasoning.push("Multi-turn conversation");
  } else if (conversationLength > 2) {
    score += 1;
  }

  // 6. Question complexity (0-2 points)
  const complexQuestionWords = ["how", "why", "explain", "describe", "what if", "could you"];
  const hasComplexQuestion = complexQuestionWords.some((word) =>
    lastMessage.toLowerCase().includes(word)
  );
  if (hasComplexQuestion && lastMessage.includes("?")) {
    score += 2;
    reasoning.push("Complex question");
  }

  // 7. Technical domain indicators (0-2 points)
  const technicalDomains = [
    "algorithm",
    "architecture",
    "database",
    "network",
    "security",
    "optimization",
    "performance",
    "scalability",
    "api",
    "protocol",
  ];
  const hasTechnical = technicalDomains.some((term) => lastMessage.toLowerCase().includes(term));
  if (hasTechnical) {
    score += 2;
    reasoning.push("Technical domain");
  }

  // 8. Creative/generation tasks (0-1 points)
  const creativeKeywords = ["write", "create", "generate", "draft", "compose"];
  const hasCreative = creativeKeywords.some((kw) => lastMessage.toLowerCase().includes(kw));
  if (hasCreative) {
    score += 1;
    reasoning.push("Creative generation task");
  }

  // Classify into tiers based on score
  let tier: Tier;
  if (score >= 10) {
    tier = "REASONING";
  } else if (score >= 6) {
    tier = "COMPLEX";
  } else if (score >= 3) {
    tier = "MEDIUM";
  } else {
    tier = "SIMPLE";
  }

  if (reasoning.length === 0) {
    reasoning.push("Simple query");
  }

  return {
    messages,
    sanitizedPrompt,
    tier,
    score,
    reasoning,
  };
}

/**
 * Route request to optimal model using quota-preservation strategy
 */
export function routeRequest(
  classification: RequestClassification,
  rateLimitTracker: RateLimitTracker,
  _config: RouterConfig = DEFAULT_ROUTER_CONFIG
): RoutingDecision {
  const { tier } = classification;

  // Get providers from config system
  const providers = getEnabledProviders();

  // Get all available models
  const allModels = providers.flatMap((provider) =>
    provider.models.map((model) => ({
      provider,
      model,
      fullId: `${provider.id}/${model.id}`,
    }))
  );

  // Filter out rate-limited models
  const availableModels = allModels.filter(({ fullId }) => !rateLimitTracker.isRateLimited(fullId));

  if (availableModels.length === 0) {
    throw new Error("No models available (all rate-limited). Wait before retrying.");
  }

  // Filter by tier compatibility
  const tierCompatible = availableModels.filter(({ model }) => {
    // Models can handle their tier or below
    const tierOrder = { simple: 0, medium: 1, complex: 2, reasoning: 3 };
    return (
      tierOrder[model.tier as keyof typeof tierOrder] >=
      tierOrder[tier.toLowerCase() as keyof typeof tierOrder]
    );
  });

  const candidateModels = tierCompatible.length > 0 ? tierCompatible : availableModels;

  // QUOTA PRESERVATION STRATEGY
  // Sort by: 1) quota size (larger first), 2) tier match (exact match first)
  const quotaSizeOrder = { huge: 5, large: 4, medium: 3, small: 2, tiny: 1 };

  candidateModels.sort((a, b) => {
    // Primary: Prefer larger quotas
    const quotaDiff =
      quotaSizeOrder[b.model.quota.quotaSize] - quotaSizeOrder[a.model.quota.quotaSize];
    if (quotaDiff !== 0) {
      return quotaDiff;
    }

    // Secondary: Prefer exact tier match (don't waste powerful models on simple tasks)
    const aTierMatch = a.model.tier === tier.toLowerCase() ? 1 : 0;
    const bTierMatch = b.model.tier === tier.toLowerCase() ? 1 : 0;
    return bTierMatch - aTierMatch;
  });

  // Select top model
  const selected = candidateModels[0];

  // Build fallback chain (next 3 best models)
  const fallbackChain = candidateModels.slice(1, 4).map(({ fullId }) => fullId);

  const confidence = tierCompatible.length > 0 ? 0.9 : 0.5;

  return {
    tier,
    model: selected.fullId,
    confidence,
    reasoning: `Selected ${selected.model.name} (quota: ${selected.model.quota.quotaSize}) for ${tier} tier task`,
    fallbackChain,
    quotaSize: selected.model.quota.quotaSize,
  };
}

/**
 * Get next fallback model from chain
 */
export function getNextFallback(
  currentModel: string,
  fallbackChain: string[],
  rateLimitTracker: RateLimitTracker
): string | null {
  // Find next model in chain that isn't rate-limited
  for (const modelId of fallbackChain) {
    if (modelId !== currentModel && !rateLimitTracker.isRateLimited(modelId)) {
      return modelId;
    }
  }
  return null;
}

/**
 * Estimate quota usage for a request
 */
export function estimateQuotaUsage(messages: Array<{ role: string; content: string }>): {
  requestCount: number;
  tokenEstimate: number;
} {
  const totalLength = messages.reduce((sum, msg) => sum + msg.content.length, 0);
  const tokenEstimate = Math.ceil(totalLength / 4); // Rough estimate: 4 chars = 1 token

  return {
    requestCount: 1,
    tokenEstimate,
  };
}

/**
 * Format routing decision for logging
 */
export function formatRoutingDecision(decision: RoutingDecision): string {
  return [
    "🎯 Routing Decision:",
    `   Tier: ${decision.tier}`,
    `   Model: ${decision.model}`,
    `   Quota: ${decision.quotaSize}`,
    `   Confidence: ${(decision.confidence * 100).toFixed(0)}%`,
    `   Reasoning: ${decision.reasoning}`,
    decision.fallbackChain.length > 0 ? `   Fallbacks: ${decision.fallbackChain.join(" → ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
