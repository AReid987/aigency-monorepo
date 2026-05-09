/**
 * SimpleLLMRouter HTTP Proxy Server
 *
 * OpenAI-compatible API that routes requests to optimal LLM provider.
 * Integrates seamlessly with OpenClaw.
 */

import { randomUUID } from "node:crypto";
import { type IncomingMessage, type ServerResponse, createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { getConfig, getEnabledProviders } from "./config/index.js";
import type { AppConfig, RuntimeProvider } from "./config/schema.js";
import { logger } from "./lib/logging/logger.js";
import {
  DEFAULT_ROUTER_CONFIG,
  RateLimitTracker,
  type RouterConfig,
  classifyRequest,
  routeRequest,
} from "./router.js";

const connections = new Set<import("node:net").Socket>();

export interface ServerConfig {
  port?: number;
  host?: string;
  routerConfig?: RouterConfig;
}

interface ChatCompletionRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
  [key: string]: unknown;
}

/**
 * Make a request to an LLM provider
 */
async function makeProviderRequest(
  provider: RuntimeProvider,
  model: string,
  requestBody: ChatCompletionRequest,
  signal: AbortSignal
): Promise<Response> {
  const url = `${provider.baseUrl}/chat/completions`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${provider.apiKey}`,
  };

  // Special handling for different providers
  if (provider.id === "openrouter") {
    headers["HTTP-Referer"] = "https://github.com/yourusername/simplellmrouter";
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...requestBody,
      model, // Use the provider-specific model ID
    }),
    signal,
  });

  return response;
}

/**
 * Check if error indicates a provider issue worth retrying
 */
function isProviderError(status: number, body: string): boolean {
  if (status >= 500) {
    return true; // Server errors
  }

  if (status === 429) {
    return true; // Rate limit
  }

  // Check for provider-specific error patterns
  const errorPatterns = [
    /insufficient.*balance/i,
    /quota.*exceeded/i,
    /rate.*limit/i,
    /model.*unavailable/i,
    /service.*unavailable/i,
    /overloaded/i,
  ];

  return errorPatterns.some((pattern) => pattern.test(body));
}

/**
 * Handle /v1/chat/completions requests
 */
async function handleChatCompletion(
  req: IncomingMessage,
  res: ServerResponse,
  providers: RuntimeProvider[],
  rateLimitTracker: RateLimitTracker,
  routerConfig: RouterConfig,
  _config: AppConfig // Add this parameter
): Promise<void> {
  const correlationId = randomUUID();

  // Read request body
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const body = Buffer.concat(chunks).toString();

  let requestData: ChatCompletionRequest;
  try {
    requestData = JSON.parse(body) as ChatCompletionRequest;
  } catch {
    logger.info({ correlationId, error: "Invalid JSON", body }, "Request error");
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid JSON" }));
    return;
  }

  // Extract prompt from messages
  const lastUserMessage = requestData.messages.filter((m) => m.role === "user").slice(-1)[0];

  if (!lastUserMessage) {
    logger.info({ correlationId, error: "No user message found" }, "Request error");
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "No user message found" }));
    return;
  }

  const classification = classifyRequest(requestData.messages);
  logger.info(
    { correlationId, prompt: classification.sanitizedPrompt },
    "Incoming chat completion request"
  );
  const routing = routeRequest(classification, rateLimitTracker, routerConfig);

  logger.info(
    { correlationId, ...routing },
    `Routing Decision: ${routing.tier} -> ${routing.model} (${routing.reasoning})`
  );

  const modelsToTry = [routing.model, ...routing.fallbackChain];

  // Try each model until success
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180000); // 3 minute timeout

  let lastError: { status: number; body: string } | null = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const modelId = modelsToTry[i];
    const isLastAttempt = i === modelsToTry.length - 1;

    logger.info(
      { correlationId, attempt: i + 1, totalAttempts: modelsToTry.length, modelId },
      `Trying ${i + 1}/${modelsToTry.length}: ${modelId}`
    );

    // Parse modelId: "provider/model" or just "model"
    const [providerId, ...modelParts] = modelId.split("/");
    const modelName = modelParts.join("/");

    // Find provider in config
    const providerObj = providers.find((p) => p.id === providerId);
    if (!providerObj) {
      logger.warn({ correlationId, modelId }, `Provider ${providerId} not found, skipping`);
      continue;
    }

    // Find model in provider
    const model = providerObj.models.find((m) => m.id === modelName || m.id === modelId);
    if (!model) {
      logger.warn(
        { correlationId, modelId },
        `Model ${modelId} not found in provider ${providerId}, skipping`
      );
      continue;
    }

    try {
      const response = await makeProviderRequest(
        providerObj,
        model.id,
        requestData,
        controller.signal
      );

      if (response.ok) {
        clearTimeout(timeout);

        // Forward successful response
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          if (key !== "transfer-encoding" && key !== "connection") {
            responseHeaders[key] = value;
          }
        });

        res.writeHead(response.status, responseHeaders);

        if (response.body) {
          const reader = response.body.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                break;
              }
              res.write(Buffer.from(value));
            }
          } finally {
            reader.releaseLock();
          }
        }

        res.end();
        logger.info({ correlationId, modelId, status: response.status }, `Success with ${modelId}`);
        return;
      }

      // Request failed
      const errorBody = await response.text();
      lastError = { status: response.status, body: errorBody };

      // Track rate limits
      if (response.status === 429) {
        rateLimitTracker.markRateLimited(modelId);
      }

      // Check if we should retry with next model
      if (isProviderError(response.status, errorBody) && !isLastAttempt) {
        logger.warn(
          { correlationId, modelId, error: "Provider error", status: response.status, errorBody },
          `Provider error from ${modelId}, trying fallback`
        );
        continue;
      }

      // Not a retryable error or last attempt
      break;
    } catch (error) {
      lastError = {
        status: 500,
        body: error instanceof Error ? error.message : String(error),
      };

      if (!isLastAttempt) {
        logger.error(
          { correlationId, modelId, error: lastError.body },
          `Error from ${modelId}: ${lastError.body}, trying fallback`
        );
        continue;
      }

      break;
    }
  }

  clearTimeout(timeout);

  // All models failed
  const status = lastError?.status || 502;
  const errorMessage = lastError?.body || "All models failed";

  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      error: {
        message: errorMessage,
        type: "provider_error",
        code: status,
      },
    })
  );
}

/**
 * Start the SimpleLLMRouter server
 */
export async function startServer(
  serverConfig: ServerConfig = {}
): Promise<import("node:http").Server> {
  const routerConfig = serverConfig.routerConfig || DEFAULT_ROUTER_CONFIG;

  // Get configuration and enabled providers
  const config = getConfig();
  const providers = [...getEnabledProviders()]; // Convert readonly to mutable

  if (providers.length === 0) {
    logger.error("[Server] ERROR: No providers configured!");
    logger.error("[Server] Add API keys via environment variables:");
    logger.error("[Server]   PROVIDER_MISTRAL_API_KEY, PROVIDER_GROQ_API_KEY,");
    logger.error("[Server]   PROVIDER_GEMINI_API_KEY, PROVIDER_CEREBRAS_API_KEY, etc.");
    throw new Error("No providers configured. Server cannot start.");
  }

  const rateLimitTracker = new RateLimitTracker();

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    // Health check
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          providers: providers.length,
          models: providers.reduce((sum, p) => sum + p.models.length, 0),
        })
      );
      return;
    }

    // List models (OpenAI-compatible)
    if (req.url === "/v1/models" && req.method === "GET") {
      const models = [
        ...providers.flatMap((p) =>
          p.models.map((m) => ({
            id: `${p.id}/${m.id}`,
            object: "model",
            created: Date.now(),
            owned_by: p.id,
          }))
        ),
        // Add virtual router models
        {
          id: "llm-router",
          object: "model",
          created: Date.now(),
          owned_by: "system",
        },
        {
          id: "auto",
          object: "model",
          created: Date.now(),
          owned_by: "system",
        },
      ];

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ object: "list", data: models }));
      return;
    }

    // Chat completions (OpenAI-compatible)
    if (req.url === "/v1/chat/completions" && req.method === "POST") {
      try {
        await handleChatCompletion(req, res, providers, rateLimitTracker, routerConfig, config);
      } catch (error) {
        logger.error(
          { correlationId: "N/A", error },
          "[Server] Unhandled error in chat completion"
        );
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: {
                message: error instanceof Error ? error.message : String(error),
                type: "server_error",
              },
            })
          );
        } else {
          logger.error(
            { correlationId: "N/A", error },
            "[Server] Headers already sent, cannot send error response."
          );
        }
      }
      return;
    }

    // Not found
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });

  server.on("connection", (socket) => {
    connections.add(socket);
    socket.on("close", () => connections.delete(socket));
  });

  return new Promise((resolve) => {
    const serverPort = config.server.port;
    const serverHost = config.server.host;
    server.listen(serverPort, serverHost, () => {
      const addr = server.address() as AddressInfo;
      logger.info(`✓ SimpleLLMRouter listening on http://${addr.address}:${addr.port}`);
      logger.info("\nConfigure OpenClaw to use this router:");
      logger.info(`  export OPENAI_API_BASE="http://127.0.0.1:${addr.port}/v1"`);
      logger.info(`  export OPENAI_API_KEY="dummy"`);
      logger.info("  openclaw gateway\n");

      // Graceful shutdown
      const shutdownHandler = () => {
        logger.info("\n[Server] Shutting down...");
        server.close(() => {
          logger.info("[Server] Server closed");
          process.exit(0);
        });
        // Force close any open connections
        const sockets = Array.from(connections);
        for (const socket of sockets) {
          socket.destroy();
        }
      };

      process.on("SIGINT", shutdownHandler);

      // biome-ignore lint/suspicious/noExplicitAny: test cleanup accessor
      (server as any)._shutdownHandler = shutdownHandler;

      resolve(server);
    });
  });
}
