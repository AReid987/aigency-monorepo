/**
 * Environment Variable Override System
 *
 * Applies environment variable overrides to provider configuration.
 * Allows runtime configuration without modifying config files.
 */

import type { AppConfig } from './schema.js';

/**
 * Applies environment variable overrides to the application configuration.
 *
 * Environment Variable Format:
 * - PROVIDER_{PROVIDER_ID}_API_KEY → Sets API key for provider
 * - PROVIDER_{PROVIDER_ID}_ENABLED → Sets enabled status (true/false)
 *
 * @param config - The base configuration to override
 * @param prefix - Environment variable prefix (default: 'PROVIDER')
 * @returns Configuration with environment overrides applied
 */
export function applyEnvOverrides(
  config: AppConfig,
  prefix: string = 'PROVIDER'
): AppConfig {
  const overriddenConfig = { ...config };
  const providerConfigOverrides: Record<string, Record<string, unknown>> = {};

  // Collect all environment variables with the specified prefix
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith(`${prefix}_`)) {
      continue;
    }

    // DEBUG: Log what we're processing
    // console.log(`[ENV-OVERRIDE] Processing: ${key} = ${value?.substring(0, 10)}...`);

    // Parse the environment variable key
    // Format: PREFIX_PROVIDERID_PROPERTY or PREFIX_PROVIDERID_PROPERTY_NAME
    const parts = key.split('_');
    if (parts.length < 3) {
      continue;
    }

    // Extract provider ID (everything between PREFIX and property name)
    // Handle both PROVIDER_MISTRAL_API_KEY and PROVIDER_MISTRAL_ENABLED
    let providerId: string;
    let property: string;

    // Check if the key ends with common patterns
    if (key.endsWith('_ENABLED')) {
      // PROVIDER_MISTRAL_ENABLED → providerId: MISTRAL, property: ENABLED
      providerId = parts.slice(1, -1).join('_');
      property = 'enabled';
    } else if (key.endsWith('_API_KEY') || key.endsWith('_APIKEY')) {
      // PROVIDER_MISTRAL_API_KEY → providerId: MISTRAL, property: API_KEY
      providerId = parts.slice(1, -2).join('_');
      property = 'apiKey';
    } else {
      // Try to parse: last part is property, middle is provider ID
      property = parts[parts.length - 1].toLowerCase();
      providerId = parts.slice(1, -1).join('_');
    }

    const normalizedProviderId = providerId.toLowerCase();

    // Skip if provider doesn't exist in config
    if (!overriddenConfig.providers[normalizedProviderId] && !overriddenConfig.providerConfig?.[normalizedProviderId]) {
      continue;
    }

    // Initialize provider config override if needed
    if (!providerConfigOverrides[normalizedProviderId]) {
      providerConfigOverrides[normalizedProviderId] = {};
    }

    // Apply the override based on property type
    switch (property.toLowerCase()) {
      case 'apikey':
      case 'api_key':
        providerConfigOverrides[normalizedProviderId].apiKey = value;
        break;

      case 'enabled':
        // Convert string "true"/"false" to boolean
        providerConfigOverrides[normalizedProviderId].enabled = value?.toLowerCase() === 'true';
        break;

      default:
        // Unknown property - skip
        break;
    }
  }

  // Apply collected overrides to providerConfig
  if (Object.keys(providerConfigOverrides).length > 0) {
    overriddenConfig.providerConfig = {
      ...(overriddenConfig.providerConfig || {}),
      ...providerConfigOverrides,
    };
  }

  return overriddenConfig;
}
