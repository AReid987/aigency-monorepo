// src/server.test.ts
import type { Server } from "node:http";
import request from "supertest";

// Mock the config module BEFORE importing from it
jest.mock("./config/index.js", () => ({
  initializeConfig: jest.fn(),
  getConfig: jest.fn(),
  getEnabledProviders: jest.fn(),
  resetConfig: jest.fn(),
  isConfigInitialized: jest.fn(),
}));

import { getConfig, getEnabledProviders, initializeConfig, resetConfig } from "./config/index.js";
import { logger } from "./lib/logging/logger.js";
import { startServer } from "./server.js";

// Mock fetch globally for Node.js 18+
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// Helper function to create mock Response objects
function createMockResponse(data: any, status = 200): Response {
  const body = JSON.stringify(data);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: new Map([["content-type", "application/json"]]) as any,
    json: async () => data,
    text: async () => body,
    body: {
      getReader: () => ({
        read: async () => ({ done: true, value: undefined }),
        releaseLock: () => {},
      }),
    },
    url: "http://localhost",
    type: "basic",
    redirected: false,
    clone: () => ({}) as Response,
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => ({}) as Blob,
    formData: async () => new FormData(),
  } as unknown as Response;
}

// Mock the logger
jest.mock("./lib/logging/logger.js", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
  initLogger: jest.fn(),
}));

// Mock process.exit to prevent it from terminating the test runner
const mockExit = jest.spyOn(process, "exit").mockImplementation((() => {}) as any);

// Mock config module dependencies (these will be mocked directly here)
jest.mock("./config/loader.js", () => ({
  loadConfigFile: jest.fn(),
}));
jest.mock("./config/env-override.js", () => ({
  applyEnvOverrides: jest.fn(),
}));
jest.mock("./config/validator.js", () => ({
  validateConfigOrThrow: jest.fn(),
}));

describe("Server", () => {
  jest.setTimeout(90000); // 90 seconds timeout for all tests in this suite

  beforeEach(async () => {
    jest.clearAllMocks(); // Clear all mocks before each test
    mockFetch.mockClear();

    // Reset config state before each test
    resetConfig();

    // Setup mock return values for the config module
    const mockConfig = {
      server: { port: 0, host: "127.0.0.1" },
      providers: {
        "test-provider": {
          id: "test-provider",
          name: "Test Provider",
          baseUrl: "http://localhost:1234",
          enabled: true,
          models: [
            {
              id: "test-model",
              name: "Test Model",
              contextWindow: 4096,
              maxOutput: 1024,
              capabilities: [],
              quota: { quotaSize: "tiny" },
              tier: "simple",
            },
            {
              id: "rate-limited-model",
              name: "Rate Limited Model",
              contextWindow: 4096,
              maxOutput: 1024,
              capabilities: [],
              quota: { quotaSize: "tiny" },
              tier: "simple",
            },
          ],
        },
      },
      providerConfig: {
        "test-provider": {
          apiKey: "test-key",
          enabled: true,
        },
      },
      logging: { level: "info" },
    };

    const mockProviders = [
      {
        id: "test-provider",
        name: "Test Provider",
        baseUrl: "http://localhost:1234",
        apiKey: "test-key",
        enabled: true,
        models: [
          {
            id: "test-model",
            name: "Test Model",
            contextWindow: 4096,
            maxOutput: 1024,
            capabilities: [],
            quota: { quotaSize: "tiny" },
            tier: "simple",
          },
          {
            id: "rate-limited-model",
            name: "Rate Limited Model",
            contextWindow: 4096,
            maxOutput: 1024,
            capabilities: [],
            quota: { quotaSize: "tiny" },
            tier: "simple",
          },
        ],
      },
    ];

    // Mock the config module functions
    (getConfig as jest.Mock).mockReturnValue(mockConfig);
    (getEnabledProviders as jest.Mock).mockReturnValue(mockProviders);
    (initializeConfig as jest.Mock).mockResolvedValue(mockConfig);

    // Explicitly initialize config for each test
    await initializeConfig();
  });

  afterEach(async () => {
    resetConfig(); // Reset config state after tests
  });

  afterAll(() => {
    mockExit.mockRestore(); // Restore original process.exit
  });

  it("should log request with correlation ID", async () => {
    let serverInstance: Server | undefined;
    try {
      serverInstance = await startServer({ port: 0 });
      // Given
      const requestBody = {
        model: "test-provider/test-model", // Use full model ID as expected by routeRequest
        messages: [{ role: "user", content: "test prompt" }],
      };

      // When - Mock fetch to return a proper Response object
      mockFetch.mockResolvedValueOnce(
        createMockResponse(
          {
            id: "chatcmpl-123",
            object: "chat.completion",
            created: 1678888888,
            model: "test-model",
            choices: [
              { index: 0, message: { role: "assistant", content: "hello" }, finish_reason: "stop" },
            ],
            usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
          },
          200
        )
      );

      await request(serverInstance).post("/v1/chat/completions").send(requestBody).expect(200);

      // Then
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationId: expect.any(String),
          prompt: "test prompt",
        }),
        "Incoming chat completion request"
      );
    } finally {
      if (serverInstance) {
        await new Promise<void>((resolve) => serverInstance?.close(() => resolve()));
      }
    }
  });

  it("should log routing decision with tier and confidence", async () => {
    let serverInstance: Server | undefined;
    try {
      serverInstance = await startServer({ port: 0 });
      // Given
      const requestBody = {
        model: "test-provider/test-model",
        messages: [{ role: "user", content: "test prompt" }],
      };

      // When
      mockFetch.mockResolvedValueOnce(
        createMockResponse(
          {
            id: "chatcmpl-123",
            object: "chat.completion",
            created: 1678888888,
            model: "test-model",
            choices: [
              { index: 0, message: { role: "assistant", content: "hello" }, finish_reason: "stop" },
            ],
            usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
          },
          200
        )
      );

      await request(serverInstance).post("/v1/chat/completions").send(requestBody).expect(200);

      // Then
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationId: expect.any(String),
          tier: "SIMPLE",
          confidence: expect.any(Number),
          model: expect.any(String),
          reasoning: expect.any(String),
          fallbackChain: expect.any(Array),
          quotaSize: expect.any(String),
        }),
        expect.stringContaining("Routing Decision: SIMPLE")
      );
    } finally {
      if (serverInstance) {
        await new Promise<void>((resolve) => serverInstance?.close(() => resolve()));
      }
    }
  });

  it("should log selected model and fallback details", async () => {
    let serverInstance: Server | undefined;
    try {
      serverInstance = await startServer({ port: 0 });
      // Given
      const requestBody = {
        model: "test-provider/test-model", // Use full model ID as expected by routeRequest
        messages: [{ role: "user", content: "test prompt" }],
      };

      // When
      mockFetch.mockResolvedValueOnce(
        createMockResponse(
          {
            id: "chatcmpl-123",
            object: "chat.completion",
            created: 1678888888,
            model: "test-model",
            choices: [
              { index: 0, message: { role: "assistant", content: "hello" }, finish_reason: "stop" },
            ],
            usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
          },
          200
        )
      );

      await request(serverInstance).post("/v1/chat/completions").send(requestBody).expect(200);

      // Then
      const allInfoCalls = (logger.info as jest.Mock).mock.calls;

      // Check the "Trying" log (e.g., the 3rd or 4th call depending on exact logging)
      // Find the call that matches "Trying 1/"
      const tryingCall = allInfoCalls.find(
        (call: any[]) => typeof call[1] === "string" && call[1].startsWith("Trying 1/")
      );
      expect(tryingCall).toBeDefined();
      expect(tryingCall[0]).toEqual(
        expect.objectContaining({
          correlationId: expect.any(String),
          attempt: 1,
          totalAttempts: expect.any(Number),
          modelId: "test-provider/test-model",
        })
      );
      expect(tryingCall[1]).toEqual(expect.stringContaining("Trying 1/"));

      // Check the "Success" log (this should be the last call if successful)
      const successCall = allInfoCalls.find(
        (call: any[]) => typeof call[1] === "string" && call[1].startsWith("Success with")
      );
      expect(successCall).toBeDefined();
      expect(successCall[0]).toEqual(
        expect.objectContaining({
          correlationId: expect.any(String),
          modelId: "test-provider/test-model",
          status: expect.any(Number),
        })
      );
      expect(successCall[1]).toEqual(
        expect.stringContaining("Success with test-provider/test-model")
      );
    } finally {
      if (serverInstance) {
        await new Promise<void>((resolve) => serverInstance?.close(() => resolve()));
      }
    }
  });

  it("should throw an error if no providers are configured", async () => {
    let serverInstance: Server | undefined;
    try {
      // Given
      // Mock getConfig to return a config with no providers for this specific test
      (getConfig as jest.Mock).mockReturnValueOnce({
        server: { port: 0, host: "127.0.0.1" },
        providers: {},
        providerConfig: {},
        logging: { level: "info" },
      });
      (getEnabledProviders as jest.Mock).mockReturnValueOnce([]); // Mock no providers

      // When & Then
      await expect(startServer({ port: 0 })).rejects.toThrow(
        "No providers configured. Server cannot start."
      );
      expect(logger.error).toHaveBeenCalledWith("[Server] ERROR: No providers configured!");
    } finally {
      if (serverInstance) {
        await new Promise<void>((resolve) => serverInstance?.close(() => resolve()));
      }
    }
  });

  it("should log rate limit events", async () => {
    let serverInstance: Server | undefined;
    try {
      serverInstance = await startServer({ port: 0 });
      // Given - The request uses a specific model, but routing may select a different one
      const requestModelId = "test-provider/rate-limited-model";
      // The server routing selects test-model (based on tier/quota matching)
      const selectedModelId = "test-provider/test-model";

      // Re-mock getEnabledProviders for this specific test as it expects a provider
      (getEnabledProviders as jest.Mock).mockReturnValue([
        {
          id: "test-provider",
          name: "Test Provider",
          baseUrl: "http://localhost:1234",
          apiKey: "test-key",
          enabled: true,
          models: [
            {
              id: "test-model",
              name: "Test Model",
              contextWindow: 4096,
              maxOutput: 1024,
              capabilities: [],
              quota: { quotaSize: "tiny" },
              tier: "simple",
            },
            {
              id: "rate-limited-model",
              name: "Rate Limited Model",
              contextWindow: 4096,
              maxOutput: 1024,
              capabilities: [],
              quota: { quotaSize: "tiny" },
              tier: "simple",
            },
          ],
        },
      ]);

      const requestBody = {
        model: requestModelId,
        messages: [{ role: "user", content: "test prompt" }],
      };

      // When - Mock rate limit response first, then successful fallback
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ error: "rate limited" }, 429))
        .mockResolvedValueOnce(
          createMockResponse(
            {
              id: "chatcmpl-123",
              object: "chat.completion",
              created: 1678888888,
              model: "test-provider/test-model",
              choices: [
                {
                  index: 0,
                  message: { role: "assistant", content: "hello" },
                  finish_reason: "stop",
                },
              ],
              usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
            },
            200
          )
        );

      await request(serverInstance).post("/v1/chat/completions").send(requestBody).expect(200);

      // Then - The actual model logged is the one selected by routing (test-model), not the requested one
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("Rate limited:"));
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationId: expect.any(String),
          modelId: selectedModelId,
          error: "Provider error",
          status: 429,
          errorBody: '{"error":"rate limited"}',
        }),
        expect.stringContaining(`Provider error from ${selectedModelId}, trying fallback`)
      );
    } finally {
      if (serverInstance) {
        await new Promise<void>((resolve) => serverInstance?.close(() => resolve()));
      }
    }
  });
});
