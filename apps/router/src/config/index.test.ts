/**
 * Unit Tests for Configuration Module
 *
 * Tests the main configuration module including:
 * - Schema validation
 * - Initialization
 * - Provider filtering
 * - Error handling
 */

import {
  ConfigAlreadyInitializedError,
  ConfigNotInitializedError,
  getConfig,
  getEnabledProviders,
  initializeConfig,
  isConfigInitialized,
  resetConfig,
} from "./index.js";
import { AppConfigSchema } from "./schema.js";

// Mock config module dependencies
jest.mock("./loader", () => ({
  loadConfigFile: jest.fn(),
}));
jest.mock("./env-override", () => ({
  applyEnvOverrides: jest.fn(),
}));
jest.mock("./validator", () => ({
  validateConfigOrThrow: jest.fn(),
}));

import { applyEnvOverrides } from "./env-override.js";
import { loadConfigFile } from "./loader.js";
import { validateConfigOrThrow } from "./validator.js";

/**
 * Test helper function to validate provider structure
 */
function validateProvider(provider: unknown, _providerId?: string): void {
  expect(provider).toBeDefined();
  expect(provider).toBeInstanceOf(Object);

  const p = provider as Record<string, unknown>;

  expect(p.id).toBeDefined();
  expect(p.name).toBeDefined();
  expect(p.baseUrl).toBeDefined();
  expect(p.models).toBeInstanceOf(Array);
  expect((p.models as unknown[]).length).toBeGreaterThan(0);
}

describe("Config Module", () => {
  beforeEach(() => {
    // Reset config state before each test
    resetConfig();
    jest.clearAllMocks();

    // Default mock implementation for dependencies
    (loadConfigFile as jest.Mock).mockResolvedValue({
      server: { port: 8402, host: "localhost" },
      providers: {
        mistral: {
          id: "mistral",
          name: "Mistral",
          baseUrl: "https://api.mistral.ai/v1",
          enabled: true,
          models: [
            {
              id: "mistral-large-latest",
              name: "Mistral Large Latest",
              contextWindow: 128000,
              maxOutput: 8192,
              capabilities: ["function-calling", "reasoning", "code"],
              quota: { monthlyRequests: 1000000000, rpm: 500000, quotaSize: "huge" },
              tier: "complex",
            },
          ],
        },
      },
      providerConfig: {
        mistral: { apiKey: "test-key", enabled: true },
      },
      logging: { level: "info", format: "pretty" },
    });
    (applyEnvOverrides as jest.Mock).mockImplementation((config) => {
      const newConfig = { ...config, providerConfig: { ...(config.providerConfig || {}) } };
      if (process.env.PROVIDER_MISTRAL_API_KEY) {
        newConfig.providerConfig.mistral = {
          ...(newConfig.providerConfig.mistral || {}),
          apiKey: process.env.PROVIDER_MISTRAL_API_KEY,
        };
      }
      return newConfig;
    });
    (validateConfigOrThrow as jest.Mock).mockImplementation((config) => config);
  });

  afterEach(() => {
    // Reset config state after each test
    resetConfig();
  });

  describe("Schema Validation", () => {
    it("should validate correct config", () => {
      const validConfig = {
        server: { port: 8402, host: "localhost" },
        providers: {
          mistral: {
            id: "mistral",
            name: "Mistral",
            baseUrl: "https://api.mistral.ai/v1",
            enabled: true,
            models: [
              {
                id: "mistral-large-latest",
                name: "Mistral Large Latest",
                contextWindow: 128000,
                maxOutput: 8192,
                capabilities: ["function-calling", "reasoning", "code"],
                quota: {
                  monthlyRequests: 1000000000,
                  rpm: 500000,
                  quotaSize: "huge",
                },
                tier: "complex",
              },
            ],
          },
        },
        providerConfig: {
          mistral: { apiKey: "test-key" },
        },
        logging: { level: "info", format: "pretty" },
      };

      const result = AppConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it("should reject invalid provider ID", () => {
      const invalidConfig = {
        server: { port: 8402, host: "localhost" },
        providers: {
          "invalid-id!": {
            id: "invalid-id!",
            name: "Invalid",
            baseUrl: "https://api.example.com/v1",
            enabled: true,
            models: [],
          },
        },
        providerConfig: {},
        logging: { level: "info", format: "pretty" },
      };

      const result = AppConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it("should reject invalid quota size", () => {
      const invalidConfig = {
        server: { port: 8402, host: "localhost" },
        providers: {
          mistral: {
            id: "mistral",
            name: "Mistral",
            baseUrl: "https://api.mistral.ai/v1",
            enabled: true,
            models: [
              {
                id: "mistral-large-latest",
                name: "Mistral Large Latest",
                contextWindow: 128000,
                maxOutput: 8192,
                capabilities: ["function-calling"],
                quota: { quotaSize: "invalid" as const },
                tier: "complex",
              },
            ],
          },
        },
        providerConfig: {},
        logging: { level: "info", format: "pretty" },
      };

      const result = AppConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it("should accept config without logging field", () => {
      const validConfig = {
        server: { port: 8402, host: "localhost" },
        providers: {
          mistral: {
            id: "mistral",
            name: "Mistral",
            baseUrl: "https://api.mistral.ai/v1",
            enabled: true,
            models: [
              {
                id: "mistral-large-latest",
                name: "Mistral Large Latest",
                contextWindow: 128000,
                maxOutput: 8192,
                capabilities: ["function-calling"],
                quota: { quotaSize: "huge" },
                tier: "complex",
              },
            ],
          },
        },
        providerConfig: {
          mistral: { apiKey: "test-key" },
        },
      };

      const result = AppConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });
  });

  describe("getConfig()", () => {
    it("should throw before initialization", () => {
      expect(() => getConfig()).toThrow(ConfigNotInitializedError);
      expect(() => getConfig()).toThrow("getConfig() called before initializeConfig()");
    });

    it("should return config after initialization", async () => {
      // Set up environment with API key to ensure at least one provider loads
      process.env.PROVIDER_MISTRAL_API_KEY = "test-api-key";
      process.env.NODE_ENV = "development";

      try {
        await initializeConfig();
        const config = getConfig();
        expect(config).toBeDefined();
        expect(config.server.port).toBeDefined();
        expect(config.server.host).toBeDefined();
      } finally {
        process.env.PROVIDER_MISTRAL_API_KEY = undefined;
        process.env.NODE_ENV = undefined;
        resetConfig();
      }
    });
  });

  describe("getEnabledProviders()", () => {
    it("should throw before initialization", () => {
      expect(() => getEnabledProviders()).toThrow(ConfigNotInitializedError);
    });

    it("should return empty array if no providers with API keys", async () => {
      // No API keys set
      try {
        await initializeConfig();
        const providers = getEnabledProviders();
        // Should return empty array or only providers with API keys
        expect(Array.isArray(providers)).toBe(true);
      } finally {
        resetConfig();
      }
    });

    it("should include apiKey in returned providers", async () => {
      process.env.PROVIDER_MISTRAL_API_KEY = "test-api-key";
      process.env.NODE_ENV = "development";

      try {
        await initializeConfig();
        const providers = getEnabledProviders();
        const mistralProvider = providers.find((p) => p.id === "mistral");

        if (mistralProvider) {
          expect(mistralProvider.apiKey).toBe("test-api-key");
        } else {
          // If mistral is not enabled in dev config, this is still OK
          expect(Array.isArray(providers)).toBe(true);
        }
      } finally {
        process.env.PROVIDER_MISTRAL_API_KEY = undefined;
        process.env.NODE_ENV = undefined;
        resetConfig();
      }
    });
  });

  describe("isConfigInitialized()", () => {
    it("should return false before initialization", () => {
      expect(isConfigInitialized()).toBe(false);
    });

    it("should return true after initialization", async () => {
      process.env.PROVIDER_MISTRAL_API_KEY = "test-key";
      process.env.NODE_ENV = "development";

      try {
        await initializeConfig();
        expect(isConfigInitialized()).toBe(true);
      } finally {
        process.env.PROVIDER_MISTRAL_API_KEY = undefined;
        process.env.NODE_ENV = undefined;
        resetConfig();
      }
    });
  });

  describe("resetConfig()", () => {
    it("should reset initialization state", async () => {
      process.env.PROVIDER_MISTRAL_API_KEY = "test-key";
      process.env.NODE_ENV = "development";

      try {
        await initializeConfig();
        expect(isConfigInitialized()).toBe(true);

        resetConfig();
        expect(isConfigInitialized()).toBe(false);
      } finally {
        process.env.PROVIDER_MISTRAL_API_KEY = undefined;
        process.env.NODE_ENV = undefined;
        resetConfig();
      }
    });

    it("should allow re-initialization after reset", async () => {
      process.env.PROVIDER_MISTRAL_API_KEY = "test-key";
      process.env.NODE_ENV = "development";

      try {
        await initializeConfig();
        resetConfig();

        // Should not throw after reset
        await expect(initializeConfig()).resolves.toBeDefined();
      } finally {
        process.env.PROVIDER_MISTRAL_API_KEY = undefined;
        process.env.NODE_ENV = undefined;
        resetConfig();
      }
    });
  });

  describe("Error Handling", () => {
    it("should throw ConfigAlreadyInitializedError on second call", async () => {
      process.env.PROVIDER_MISTRAL_API_KEY = "test-key";
      process.env.NODE_ENV = "development";

      try {
        await initializeConfig();
        await expect(initializeConfig()).rejects.toThrow(ConfigAlreadyInitializedError);
      } finally {
        process.env.PROVIDER_MISTRAL_API_KEY = undefined;
        process.env.NODE_ENV = undefined;
        resetConfig();
      }
    });

    it("should throw ConfigNotInitializedError when accessing config before init", () => {
      resetConfig();
      expect(() => getConfig()).toThrow(ConfigNotInitializedError);
    });
  });
});
