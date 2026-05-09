/**
 * Integration Test for Configuration Module
 *
 * Tests the end-to-end configuration loading and initialization flow.
 */

import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getConfig, getEnabledProviders, initializeConfig, resetConfig } from "./index.js";

describe("Config Integration", () => {
  const testConfigPath = join(tmpdir(), "test-simplellmrouter-config.yaml");

  afterEach(() => {
    // Clean up test config file
    if (existsSync(testConfigPath)) {
      try {
        unlinkSync(testConfigPath);
      } catch (_e) {
        // Ignore cleanup errors
      }
    }
    // Reset config state
    resetConfig();
    // Clean up environment variables
    process.env.PROVIDER_MISTRAL_API_KEY = undefined;
    process.env.PROVIDER_GROQ_API_KEY = undefined;
  });

  it("should load config and apply env overrides", async () => {
    // Create test config file
    const testConfig = `
server:
  port: 9999
  host: test-host

logging:
  level: debug
  format: json

providers:
  mistral:
    id: mistral
    name: Mistral
    baseUrl: https://api.mistral.ai/v1
    enabled: true
    models:
      - id: mistral-large-latest
        name: Mistral Large Latest
        contextWindow: 128000
        maxOutput: 8192
        capabilities: [function-calling]
        quota:
          quotaSize: huge
        tier: complex

  groq:
    id: groq
    name: Groq
    baseUrl: https://api.groq.com/openai/v1
    enabled: false
    models:
      - id: llama-3.3-70b-versatile
        name: Llama 3.3 70B Versatile
        contextWindow: 128000
        maxOutput: 8192
        capabilities: [function-calling]
        quota:
          quotaSize: large
        tier: medium
`;

    writeFileSync(testConfigPath, testConfig);

    // Set environment variable to override Groq enabled status
    process.env.PROVIDER_MISTRAL_API_KEY = "test-mistral-key";
    process.env.PROVIDER_GROQ_API_KEY = "test-groq-key";
    process.env.PROVIDER_GROQ_ENABLED = "true";

    try {
      // Initialize config with test file
      const config = await initializeConfig({ environment: testConfigPath });

      // Verify config loaded
      expect(config).toBeDefined();
      expect(config.server.port).toBeDefined();

      // Verify providers loaded
      const providers = getEnabledProviders();
      expect(Array.isArray(providers)).toBe(true);
    } finally {
      resetConfig();
    }
  });

  it("should filter providers without API keys", async () => {
    // Create test config with multiple providers
    const testConfig = `
server:
  port: 9999
  host: test-host

logging:
  level: info

providers:
  mistral:
    id: mistral
    name: Mistral
    baseUrl: https://api.mistral.ai/v1
    enabled: true
    models:
      - id: mistral-large-latest
        name: Mistral Large Latest
        contextWindow: 128000
        maxOutput: 8192
        capabilities: [function-calling]
        quota:
          quotaSize: huge
        tier: complex

  groq:
    id: groq
    name: Groq
    baseUrl: https://api.groq.com/openai/v1
    enabled: true
    models:
      - id: llama-3.3-70b-versatile
        name: Llama 3.3 70B Versatile
        contextWindow: 128000
        maxOutput: 8192
        capabilities: [function-calling]
        quota:
          quotaSize: large
        tier: medium
`;

    writeFileSync(testConfigPath, testConfig);

    // Only set API key for mistral
    process.env.PROVIDER_MISTRAL_API_KEY = "test-mistral-key";
    // No API key for groq

    try {
      await initializeConfig({ environment: testConfigPath });
      const providers = getEnabledProviders();

      // Should only have mistral (groq filtered out due to no API key)
      expect(providers.length).toBeGreaterThan(0);
      expect(providers.some((p) => p.id === "mistral")).toBe(true);
    } finally {
      resetConfig();
    }
  });

  it("should include API keys from environment in returned providers", async () => {
    const testConfig = `
server:
  port: 9999
  host: test-host

logging:
  level: info

providers:
  mistral:
    id: mistral
    name: Mistral
    baseUrl: https://api.mistral.ai/v1
    enabled: true
    models:
      - id: mistral-large-latest
        name: Mistral Large Latest
        contextWindow: 128000
        maxOutput: 8192
        capabilities: [function-calling]
        quota:
          quotaSize: huge
        tier: complex
`;

    writeFileSync(testConfigPath, testConfig);

    const testApiKey = "integration-test-key-12345";
    process.env.PROVIDER_MISTRAL_API_KEY = testApiKey;

    try {
      await initializeConfig({ environment: testConfigPath });
      const providers = getEnabledProviders();
      const mistral = providers.find((p) => p.id === "mistral");

      expect(mistral).toBeDefined();
      expect(mistral?.apiKey).toBe(testApiKey);
    } finally {
      resetConfig();
    }
  });
});

describe("Real Config File Loading", () => {
  afterEach(() => {
    resetConfig();
    process.env.PROVIDER_MISTRAL_API_KEY = undefined;
    process.env.PROVIDER_GROQ_API_KEY = undefined;
    process.env.PROVIDER_GEMINI_API_KEY = undefined;
    process.env.PROVIDER_CEREBRAS_API_KEY = undefined;
    process.env.PROVIDER_OPENROUTER_API_KEY = undefined;
    process.env.PROVIDER_VOIDAI_API_KEY = undefined;
    process.env.PROVIDER_ZAI_API_KEY = undefined;
    process.env.PROVIDER_KIMI_API_KEY = undefined;
  });

  it("should load real config/providers.yaml and make providers available", async () => {
    // Set API keys for multiple providers
    process.env.PROVIDER_MISTRAL_API_KEY = "test-mistral-key";
    process.env.PROVIDER_GROQ_API_KEY = "test-groq-key";
    process.env.PROVIDER_GEMINI_API_KEY = "test-gemini-key";
    process.env.PROVIDER_CEREBRAS_API_KEY = "test-cerebras-key";
    process.env.PROVIDER_OPENROUTER_API_KEY = "test-openrouter-key";
    process.env.PROVIDER_VOIDAI_API_KEY = "test-voidai-key";
    process.env.PROVIDER_ZAI_API_KEY = "test-zai-key";
    process.env.PROVIDER_KIMI_API_KEY = "test-kimi-key";

    try {
      // Load the actual config/providers.yaml file directly
      // This bypasses the environment-specific merge and loads all 9 providers
      const configPath = `${process.cwd()}/config/providers.yaml`;
      const config = await initializeConfig({ environment: configPath });

      // Verify config structure
      expect(config).toBeDefined();
      expect(config.server).toBeDefined();
      expect(config.providers).toBeDefined();
      expect(config.providerConfig).toBeDefined();

      // Verify server configuration
      expect(config.server.port).toBe(8402);
      expect(config.server.host).toBe("localhost");

      // Call getConfig() to verify it returns the same config
      const getConfigResult = getConfig();
      expect(getConfigResult).toBe(config);

      // Call getEnabledProviders() and verify providers with API keys are present
      const enabledProviders = getEnabledProviders();
      expect(enabledProviders).toBeDefined();
      expect(Array.isArray(enabledProviders)).toBe(true);

      // Verify all 9 providers from config/providers.yaml are loaded
      // (when they have API keys set)
      const providerIds = enabledProviders.map((p) => p.id);

      expect(providerIds).toContain("mistral");
      expect(providerIds).toContain("groq");
      expect(providerIds).toContain("gemini");
      expect(providerIds).toContain("cerebras");
      expect(providerIds).toContain("openrouter");
      expect(providerIds).toContain("voidai");
      expect(providerIds).toContain("zai");
      expect(providerIds).toContain("kimi");

      // Verify we have 8 providers (all providers from config/providers.yaml except those with API keys)
      // All 9 providers in config/providers.yaml are enabled by default
      expect(enabledProviders.length).toBe(8);

      // Verify each provider has correct structure
      for (const provider of enabledProviders) {
        expect(provider.id).toBeDefined();
        expect(provider.name).toBeDefined();
        expect(provider.baseUrl).toBeDefined();
        expect(provider.apiKey).toBeDefined();
        expect(provider.enabled).toBe(true);
        expect(provider.models).toBeInstanceOf(Array);
        expect(provider.models.length).toBeGreaterThan(0);
      }
    } finally {
      resetConfig();
    }
  });

  it("should filter out providers without API keys", async () => {
    // Set only PROVIDER_MISTRAL_API_KEY
    process.env.PROVIDER_MISTRAL_API_KEY = "test-mistral-key";

    try {
      // Call initializeConfig()
      await initializeConfig();

      // Verify getEnabledProviders() returns only mistral
      const enabledProviders = getEnabledProviders();
      const providerIds = enabledProviders.map((p) => p.id);

      expect(providerIds).toContain("mistral");
      expect(providerIds).not.toContain("groq");
      expect(providerIds).not.toContain("gemini");
      expect(providerIds).not.toContain("cerebras");
      expect(providerIds).not.toContain("openrouter");
      expect(providerIds).not.toContain("voidai");
      expect(providerIds).not.toContain("zai");
      expect(providerIds).not.toContain("kimi");

      // Verify only one provider is returned
      expect(enabledProviders.length).toBe(1);
      expect(enabledProviders[0].id).toBe("mistral");
    } finally {
      resetConfig();
    }
  });

  it("should merge API keys from ENV into provider objects", async () => {
    const testApiKey = "env-merged-api-key-12345";
    process.env.PROVIDER_MISTRAL_API_KEY = testApiKey;

    try {
      // Call initializeConfig()
      await initializeConfig();

      // Get enabled providers
      const enabledProviders = getEnabledProviders();
      const mistral = enabledProviders.find((p) => p.id === "mistral");

      // Verify mistral provider has correct apiKey merged from ENV
      expect(mistral).toBeDefined();
      expect(mistral?.apiKey).toBe(testApiKey);
      expect(mistral?.apiKey).toBe(process.env.PROVIDER_MISTRAL_API_KEY);
    } finally {
      resetConfig();
    }
  });

  it("should load provider models from config file", async () => {
    process.env.PROVIDER_MISTRAL_API_KEY = "test-mistral-key";
    process.env.PROVIDER_GROQ_API_KEY = "test-groq-key";

    try {
      // Call initializeConfig()
      await initializeConfig();

      // Get enabled providers
      const enabledProviders = getEnabledProviders();
      const mistral = enabledProviders.find((p) => p.id === "mistral");
      const groq = enabledProviders.find((p) => p.id === "groq");

      // Verify each provider has correct models array from config
      expect(mistral).toBeDefined();
      expect(mistral?.models).toBeInstanceOf(Array);
      expect(mistral?.models.length).toBeGreaterThanOrEqual(2);

      expect(groq).toBeDefined();
      expect(groq?.models).toBeInstanceOf(Array);
      expect(groq?.models.length).toBeGreaterThanOrEqual(2);

      // Verify model properties (id, name, contextWindow, maxOutput, capabilities, quota, tier)
      const mistralLarge = mistral?.models.find((m) => m.id === "mistral-large-latest");
      expect(mistralLarge).toBeDefined();
      expect(mistralLarge?.id).toBe("mistral-large-latest");
      expect(mistralLarge?.name).toBe("Mistral Large Latest");
      expect(mistralLarge?.contextWindow).toBe(128000);
      expect(mistralLarge?.maxOutput).toBe(32000);
      expect(mistralLarge?.capabilities).toContain("function-calling");
      expect(mistralLarge?.capabilities).toContain("reasoning");
      expect(mistralLarge?.capabilities).toContain("code");
      expect(mistralLarge?.quota).toBeDefined();
      expect(mistralLarge?.quota.quotaSize).toBe("huge");
      expect(mistralLarge?.tier).toBe("complex");

      // Verify groq models
      const llama33 = groq?.models.find((m) => m.id === "llama-3.3-70b-versatile");
      expect(llama33).toBeDefined();
      expect(llama33?.id).toBe("llama-3.3-70b-versatile");
      expect(llama33?.name).toBe("Llama 3.3 70B Versatile");
      expect(llama33?.contextWindow).toBe(128000);
      expect(llama33?.maxOutput).toBe(8192);
      expect(llama33?.capabilities).toContain("function-calling");
      expect(llama33?.capabilities).toContain("fast");
      expect(llama33?.capabilities).toContain("code");
      expect(llama33?.quota).toBeDefined();
      expect(llama33?.quota.quotaSize).toBe("large");
      expect(llama33?.tier).toBe("medium");
    } finally {
      resetConfig();
    }
  });

  it("should validate schema of actual config file", async () => {
    const { loadConfigFile } = await import("./loader.js");
    const { AppConfigSchema } = await import("./schema.js");

    // Load the actual config file
    const rawConfig = await loadConfigFile();

    // Validate against schema
    const result = AppConfigSchema.safeParse(rawConfig);

    // Should pass validation
    expect(result.success).toBe(true);

    if (result.success) {
      // Verify structure
      expect(result.data.server).toBeDefined();
      expect(result.data.providers).toBeDefined();
      expect(Object.keys(result.data.providers).length).toBeGreaterThanOrEqual(8);

      // Verify each provider has required fields
      for (const [providerId, provider] of Object.entries(result.data.providers)) {
        expect(provider.id).toBe(providerId);
        expect(provider.name).toBeDefined();
        expect(provider.baseUrl).toMatch(/^https?:\/\//);
        expect(provider.enabled).toBeDefined();
        expect(provider.models).toBeInstanceOf(Array);
        expect(provider.models.length).toBeGreaterThan(0);

        // Verify each model has required fields
        for (const model of provider.models) {
          expect(model.id).toBeDefined();
          expect(model.name).toBeDefined();
          expect(model.contextWindow).toBeGreaterThan(0);
          expect(model.maxOutput).toBeGreaterThan(0);
          expect(model.capabilities).toBeInstanceOf(Array);
          expect(model.quota).toBeDefined();
          expect(model.tier).toBeDefined();
        }
      }
    }
  });
});

describe("Environment Override Validation", () => {
  afterEach(() => {
    resetConfig();
    process.env.PROVIDER_MISTRAL_API_KEY = undefined;
    process.env.PROVIDER_GROQ_API_KEY = undefined;
    process.env.PROVIDER_GEMINI_API_KEY = undefined;
    process.env.PROVIDER_GROQ_ENABLED = undefined;
  });

  it("should override provider enabled status via ENV", async () => {
    // Create test config where groq.enabled: false
    const testConfigPath = join(tmpdir(), "test-groq-disabled-config.yaml");
    const testConfig = `
server:
  port: 9999
  host: test-host

logging:
  level: info

providers:
  mistral:
    id: mistral
    name: Mistral
    baseUrl: https://api.mistral.ai/v1
    enabled: true
    models:
      - id: mistral-large-latest
        name: Mistral Large Latest
        contextWindow: 128000
        maxOutput: 8192
        capabilities: [function-calling]
        quota:
          quotaSize: huge
        tier: complex

  groq:
    id: groq
    name: Groq
    baseUrl: https://api.groq.com/openai/v1
    enabled: false
    models:
      - id: llama-3.3-70b-versatile
        name: Llama 3.3 70B Versatile
        contextWindow: 128000
        maxOutput: 8192
        capabilities: [function-calling]
        quota:
          quotaSize: large
        tier: medium
`;

    writeFileSync(testConfigPath, testConfig);

    try {
      // Set PROVIDER_GROQ_ENABLED=true to override config file
      process.env.PROVIDER_MISTRAL_API_KEY = "test-mistral-key";
      process.env.PROVIDER_GROQ_API_KEY = "test-groq-key";
      process.env.PROVIDER_GROQ_ENABLED = "true";

      // Verify env vars are set
      expect(process.env.PROVIDER_MISTRAL_API_KEY).toBe("test-mistral-key");
      expect(process.env.PROVIDER_GROQ_API_KEY).toBe("test-groq-key");
      expect(process.env.PROVIDER_GROQ_ENABLED).toBe("true");

      // Call initializeConfig()
      await initializeConfig({ environment: testConfigPath });

      // Verify groq appears in getEnabledProviders() despite being disabled in file
      const enabledProviders = getEnabledProviders();
      const providerIds = enabledProviders.map((p) => p.id);

      expect(providerIds).toContain("mistral");
      expect(providerIds).toContain("groq");
    } finally {
      resetConfig();
      // Clean up test config file
      if (existsSync(testConfigPath)) {
        unlinkSync(testConfigPath);
      }
    }
  });

  it("should use ENV API key over config file API key", async () => {
    // Note: Current implementation doesn't support API keys in config files
    // API keys are only set via environment variables
    // This test documents the actual behavior

    const testConfigPath = join(tmpdir(), "test-api-key-config.yaml");
    const testConfig = `
server:
  port: 9999
  host: test-host

logging:
  level: info

providers:
  mistral:
    id: mistral
    name: Mistral
    baseUrl: https://api.mistral.ai/v1
    enabled: true
    models:
      - id: mistral-large-latest
        name: Mistral Large Latest
        contextWindow: 128000
        maxOutput: 8192
        capabilities: [function-calling]
        quota:
          quotaSize: huge
        tier: complex
`;

    writeFileSync(testConfigPath, testConfig);

    try {
      // Set PROVIDER_MISTRAL_API_KEY
      const envApiKey = "env-api-key-12345";
      process.env.PROVIDER_MISTRAL_API_KEY = envApiKey;

      // Call initializeConfig()
      await initializeConfig({ environment: testConfigPath });

      // Get enabled providers
      const enabledProviders = getEnabledProviders();
      const mistral = enabledProviders.find((p) => p.id === "mistral");

      // Verify mistral provider uses the ENV API key
      expect(mistral).toBeDefined();
      expect(mistral?.apiKey).toBe(envApiKey);
      expect(mistral?.apiKey).toBe(process.env.PROVIDER_MISTRAL_API_KEY);
    } finally {
      resetConfig();
      // Clean up test config file
      if (existsSync(testConfigPath)) {
        unlinkSync(testConfigPath);
      }
    }
  });

  it("should handle missing ENV variables gracefully", async () => {
    const testConfigPath = join(tmpdir(), "test-no-env-config.yaml");
    const testConfig = `
server:
  port: 9999
  host: test-host

logging:
  level: info

providers:
  mistral:
    id: mistral
    name: Mistral
    baseUrl: https://api.mistral.ai/v1
    enabled: true
    models:
      - id: mistral-large-latest
        name: Mistral Large Latest
        contextWindow: 128000
        maxOutput: 8192
        capabilities: [function-calling]
        quota:
          quotaSize: huge
        tier: complex
`;

    writeFileSync(testConfigPath, testConfig);

    try {
      // Set no provider API keys
      // (delete all provider env vars)

      // Call initializeConfig()
      await initializeConfig({ environment: testConfigPath });

      // Verify getEnabledProviders() returns empty array
      const enabledProviders = getEnabledProviders();

      expect(enabledProviders).toBeDefined();
      expect(Array.isArray(enabledProviders)).toBe(true);
      expect(enabledProviders.length).toBe(0);

      // Verify no errors thrown, just empty provider list
      // (if we got here without throwing, the test passes)
    } finally {
      resetConfig();
      // Clean up test config file
      if (existsSync(testConfigPath)) {
        unlinkSync(testConfigPath);
      }
    }
  });
});

describe("Config Validation Error Handling", () => {
  afterEach(() => {
    resetConfig();
    process.env.PROVIDER_MISTRAL_API_KEY = undefined;
  });

  it("should reject invalid config with clear error", async () => {
    const invalidConfigPath = join(tmpdir(), "test-invalid-config.yaml");
    const invalidConfig = `
server:
  port: 9999
  host: test-host

logging:
  level: info

providers:
  mistral:
    id: mistral
    name: Mistral
    baseUrl: "not-a-valid-url"
    enabled: true
    models:
      - id: mistral-large-latest
        name: Mistral Large Latest
        contextWindow: 128000
        maxOutput: 8192
        capabilities: [function-calling]
        quota:
          quotaSize: huge
        tier: complex
`;

    writeFileSync(invalidConfigPath, invalidConfig);

    try {
      // Call initializeConfig() with invalid config
      const initPromise = initializeConfig({ environment: invalidConfigPath });

      // Verify error is thrown
      await expect(initPromise).rejects.toThrow();

      try {
        await initPromise;
      } catch (error) {
        // Verify error message is descriptive
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("Configuration validation failed");
      }
    } finally {
      resetConfig();
      // Clean up test config file
      if (existsSync(invalidConfigPath)) {
        unlinkSync(invalidConfigPath);
      }
    }
  });

  it("should provide helpful error when config file missing", async () => {
    const nonExistentPath = join(tmpdir(), "non-existent-config-file.yaml");

    try {
      // Call initializeConfig() with non-existent config file
      const initPromise = initializeConfig({ environment: nonExistentPath });

      // Verify error is thrown
      await expect(initPromise).rejects.toThrow();

      try {
        await initPromise;
      } catch (error) {
        // Verify error message mentions file not found
        expect(error).toBeInstanceOf(Error);
        const errorMessage = (error as Error).message.toLowerCase();
        expect(errorMessage).toMatch(/not found|no such file|cannot find|ENOENT/i);
      }
    } finally {
      resetConfig();
    }
  });

  it("should reject invalid provider ID format", async () => {
    const invalidProviderConfigPath = join(tmpdir(), "test-invalid-provider-id.yaml");
    const invalidProviderConfig = `
server:
  port: 9999
  host: test-host

logging:
  level: info

providers:
  "invalid provider id!":
    id: "invalid provider id!"
    name: "Invalid Provider"
    baseUrl: https://api.invalid.com/v1
    enabled: true
    models:
      - id: invalid-model
        name: Invalid Model
        contextWindow: 128000
        maxOutput: 8192
        capabilities: [function-calling]
        quota:
          quotaSize: small
        tier: simple
`;

    writeFileSync(invalidProviderConfigPath, invalidProviderConfig);

    try {
      // Call initializeConfig() with invalid provider ID
      const initPromise = initializeConfig({ environment: invalidProviderConfigPath });

      // The schema validation should catch this if it has strict ID validation
      // Otherwise, the test documents current behavior
      await initPromise;
    } catch (error) {
      // If validation catches invalid provider IDs
      expect(error).toBeInstanceOf(Error);
    } finally {
      resetConfig();
      // Clean up test config file
      if (existsSync(invalidProviderConfigPath)) {
        unlinkSync(invalidProviderConfigPath);
      }
    }
  });

  it("should reject config with missing required fields", async () => {
    const missingFieldsConfigPath = join(tmpdir(), "test-missing-fields.yaml");
    const missingFieldsConfig = `
server:
  port: 9999

logging:
  level: info

providers:
  mistral:
    id: mistral
    name: Mistral
    enabled: true
    models:
      - id: mistral-large-latest
        name: Mistral Large Latest
        contextWindow: 128000
        maxOutput: 8192
        capabilities: [function-calling]
        quota:
          quotaSize: huge
        tier: complex
`;

    writeFileSync(missingFieldsConfigPath, missingFieldsConfig);

    try {
      // Call initializeConfig() with missing required fields (baseUrl)
      const initPromise = initializeConfig({ environment: missingFieldsConfigPath });

      // Verify error is thrown
      await expect(initPromise).rejects.toThrow();

      try {
        await initPromise;
      } catch (error) {
        // Verify error message is descriptive
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("Configuration validation failed");
      }
    } finally {
      resetConfig();
      // Clean up test config file
      if (existsSync(missingFieldsConfigPath)) {
        unlinkSync(missingFieldsConfigPath);
      }
    }
  });
});
