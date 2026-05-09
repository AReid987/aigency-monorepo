/**
 * Main Configuration Module
 *
 * Central configuration system with singleton pattern.
 * Provides type-safe access to application configuration.
 */

import { applyEnvOverrides } from "./env-override.js";
import { loadConfigFile } from "./loader.js";
import type { AppConfig, Provider, RuntimeProvider } from "./schema.js";
import { validateConfigOrThrow } from "./validator.js";

/**
 * Internal configuration storage (singleton pattern)
 */
let internalConfig: AppConfig | null = null;
let isInitialized = false;

/**
 * Error thrown when getConfig() is called before initialization.
 */
export class ConfigNotInitializedError extends Error {
  constructor() {
    super(
      "getConfig() called before initializeConfig(). " +
        "Call initializeConfig() at application entry point."
    );
    this.name = "ConfigNotInitializedError";
  }
}

/**
 * Error thrown when initializeConfig() is called multiple times.
 */
export class ConfigAlreadyInitializedError extends Error {
  constructor() {
    super(
      "initializeConfig() can only be called once. " + "Configuration has already been initialized."
    );
    this.name = "ConfigAlreadyInitializedError";
  }
}

/**
 * Initializes the application configuration.
 *
 * This function follows the singleton pattern - it can only be called once.
 * Subsequent calls will throw ConfigAlreadyInitializedError.
 *
 * Configuration loading process:
 * 1. Load configuration file (with environment fallback chain)
 * 2. Apply environment variable overrides
 * 3. Validate against schema
 * 4. Filter out providers without API keys
 *
 * @param options - Initialization options
 * @param options.environment - Environment to load config for ('development' | 'production'),
 *                             or a specific config filename for testing (e.g., 'test-config.yaml')
 * @returns The validated and initialized configuration
 * @throws ConfigAlreadyInitializedError if already initialized
 * @throws Error if configuration file cannot be loaded
 * @throws Error with formatted validation errors if config is invalid
 */
export async function initializeConfig(options?: {
  environment?: "development" | "production" | string;
}): Promise<AppConfig> {
  // Check if already initialized (singleton pattern)
  if (isInitialized) {
    throw new ConfigAlreadyInitializedError();
  }

  const environment = options?.environment;

  try {
    // Step 1: Load configuration file
    const rawConfig = await loadConfigFile(environment);

    // Step 2: Validate configuration first (this also does type coercion)
    const validatedConfig = validateConfigOrThrow(rawConfig);

    // Step 3: Apply environment variable overrides to validated config
    const configWithOverrides = applyEnvOverrides(validatedConfig);

    // Step 4: Remove providers without API keys
    const providersWithKeys: Record<string, Provider> = {};
    const providerIds: string[] = [];

    for (const [providerId, configProvider] of Object.entries(configWithOverrides.providers)) {
      const providerConfig = configWithOverrides.providerConfig?.[providerId];
      const hasApiKey = providerConfig?.apiKey != null && providerConfig.apiKey !== "";

      // Check both config file enabled status and providerConfig override
      // providerConfig.enabled takes precedence over configProvider.enabled
      const isEnabled =
        providerConfig?.enabled !== undefined ? providerConfig.enabled : configProvider.enabled;

      if (hasApiKey && isEnabled) {
        providersWithKeys[providerId] = {
          ...configProvider,
          enabled: true, // Ensure enabled is true for providers with API keys
          apiKey: providerConfig.apiKey,
        } as Provider;
        providerIds.push(providerId);
      } else if (!hasApiKey && isEnabled) {
      }
    }

    // Store filtered providers
    internalConfig = {
      ...configWithOverrides, // Use configWithOverrides to preserve providerConfig from env vars
      providers: providersWithKeys,
    };

    isInitialized = true;

    return internalConfig;
  } catch (error) {
    // If validation failed, format and display errors
    if (error instanceof Error && error.message.includes("Configuration validation failed")) {
      // Error is already formatted from validateConfigOrThrow
      throw error;
    }

    // Re-throw other errors
    throw error;
  }
}

/**
 * Gets the current application configuration.
 *
 * Must be called after initializeConfig(). Throws ConfigNotInitializedError
 * if called before initialization.
 *
 * @returns Readonly application configuration
 * @throws ConfigNotInitializedError if initializeConfig() hasn't been called
 */
export function getConfig(): Readonly<AppConfig> {
  if (!isInitialized || internalConfig === null) {
    throw new ConfigNotInitializedError();
  }

  return internalConfig;
}

/**
 * Gets all enabled providers with API keys.
 *
 * Returns a readonly array of providers that are both enabled in configuration
 * and have API keys available. Providers without API keys are automatically
 * filtered out during initialization.
 *
 * The returned providers include the apiKey merged from providerConfig,
 * making them compatible with the existing Provider interface from providers.ts.
 *
 * @returns Readonly array of enabled providers with API keys
 * @throws ConfigNotInitializedError if initializeConfig() hasn't been called
 */
export function getEnabledProviders(): Readonly<RuntimeProvider[]> {
  const config = getConfig();

  // Filter providers by enabled flag and merge with API keys
  const enabledProviders = Object.values(config.providers)
    .filter((provider) => provider.enabled === true)
    .map((provider) => {
      const providerConfig = config.providerConfig?.[provider.id];
      return {
        ...provider,
        apiKey: providerConfig?.apiKey || "",
      } as RuntimeProvider;
    });

  return enabledProviders;
}

/**
 * Resets the configuration state.
 *
 * This is primarily useful for testing purposes. In normal application
 * flow, configuration should only be initialized once.
 *
 * @internal
 */
export function resetConfig(): void {
  internalConfig = null;
  isInitialized = false;
}

/**
 * Checks if the configuration has been initialized.
 *
 * @returns True if configuration has been initialized, false otherwise
 */
export function isConfigInitialized(): boolean {
  return isInitialized;
}
