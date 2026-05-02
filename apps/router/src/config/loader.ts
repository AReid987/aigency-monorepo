/**
 * Configuration File Loader
 *
 * Loads YAML configuration files with environment-specific fallback chain.
 * Supports both YAML and JSON formats for configuration files.
 */

import { promises as fs } from 'fs';
import { parse } from 'yaml';
import type { AppConfig } from './schema.js';

/**
 * Determines the current environment from NODE_ENV or defaults to development.
 *
 * @returns The current environment ('development' or 'production')
 */
export function getEnvironment(): 'development' | 'production' {
  const env = process.env.NODE_ENV?.toLowerCase();
  return env === 'production' ? 'production' : 'development';
}

/**
 * Builds the file path for a configuration file.
 *
 * @param filename - The base filename (without extension)
 * @returns The absolute path to the configuration file
 */
export function getConfigPath(filename: string): string {
  return `${process.cwd()}/config/${filename}`;
}

/**
 * Loads and parses a YAML or JSON configuration file.
 *
 * @param filePath - The absolute path to the configuration file
 * @returns The parsed configuration object
 * @throws Error if file doesn't exist, is empty, or contains invalid YAML/JSON
 */
async function loadAndParseConfigFile(filePath: string): Promise<unknown> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');

    // Check for empty file
    if (!content.trim()) {
      throw new Error(`Configuration file is empty: ${filePath}`);
    }

    // Try YAML first, then JSON
    try {
      return parse(content);
    } catch (yamlError) {
      // If YAML parsing fails, try JSON
      try {
        return JSON.parse(content);
      } catch (jsonError) {
        throw new Error(
          `Invalid configuration file format: ${filePath}\n` +
          `YAML Error: ${(yamlError as Error).message}\n` +
          `JSON Error: ${(jsonError as Error).message}`
        );
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Configuration file not found: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Deep merges two objects, with source values overriding base values.
 *
 * @param base - The base object
 * @param source - The object to merge in (takes precedence)
 * @returns The merged object
 */
function deepMerge(base: unknown, source: unknown): unknown {
  if (source === null || source === undefined) {
    return base;
  }
  if (base === null || base === undefined) {
    return source;
  }
  if (typeof source !== 'object' || typeof base !== 'object') {
    return source;
  }
  if (Array.isArray(source) || Array.isArray(base)) {
    return source;
  }

  const result = { ...base as Record<string, unknown> };
  for (const key of Object.keys(source as Record<string, unknown>)) {
    result[key] = deepMerge(
      (base as Record<string, unknown>)[key],
      (source as Record<string, unknown>)[key]
    );
  }
  return result;
}

/**
 * Loads the application configuration file with environment-specific overrides.
 *
 * Loading strategy:
 * 1. Always load config/providers.yaml as the base configuration
 * 2. If config/providers.{environment}.yaml exists, merge its overrides
 * 3. For testing, if a specific filename is provided, load only that file
 *
 * @param environmentOrFilename - The environment to load config for (default: from NODE_ENV),
 *                                or a specific filename for testing purposes
 * @returns The loaded and merged configuration object (validation happens separately)
 * @throws Error if no configuration file can be loaded
 */
export async function loadConfigFile(
  environmentOrFilename?: 'development' | 'production' | string
): Promise<unknown> {
  // If it looks like a filename (contains a dot), use it directly
  // Check if it's an absolute path or contains a dot (but not just 'development' or 'production')
  if (environmentOrFilename && environmentOrFilename.includes('.')) {
    // If it's an absolute path, use it directly
    if (environmentOrFilename.startsWith('/')) {
      return loadAndParseConfigFile(environmentOrFilename);
    }
    // Otherwise, treat it as a filename in the config directory
    const filePath = getConfigPath(environmentOrFilename);
    return loadAndParseConfigFile(filePath);
  }

  const env = (environmentOrFilename as 'development' | 'production' | undefined) || getEnvironment();

  // Always load the base providers.yaml first
  const baseFilePath = getConfigPath('providers.yaml');
  let baseConfig: unknown;

  try {
    baseConfig = await loadAndParseConfigFile(baseFilePath);
  } catch (error) {
    throw new Error(
      `Failed to load base configuration file: providers.yaml\n` +
      `Error: ${(error as Error).message}\n\n` +
      `Please create config/providers.yaml with your provider configuration.`
    );
  }

  // Try to load environment-specific overrides and merge them
  const envOverrideFiles = [
    `providers.${env}.yaml`,
    `providers.${env}.yml`,
  ];

  for (const filename of envOverrideFiles) {
    const filePath = getConfigPath(filename);

    try {
      const overrideConfig = await loadAndParseConfigFile(filePath);
      // Deep merge the override config with the base config
      return deepMerge(baseConfig, overrideConfig);
    } catch (error) {
      // Environment override file doesn't exist or can't be loaded - that's OK
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        // File exists but failed to load - log a warning but continue
        console.warn(`Warning: Failed to load ${filename}, using base config: ${(error as Error).message}`);
      }
      // Continue to next file
    }
  }

  // No environment overrides found, return base config
  return baseConfig;
}

/**
 * Loads the application configuration from a specific file.
 *
 * @param filename - The configuration filename (e.g., 'providers.development.yaml')
 * @returns The loaded configuration object
 * @throws Error if the file cannot be loaded
 */
export async function loadConfigFromFile(filename: string): Promise<unknown> {
  const filePath = getConfigPath(filename);
  return loadAndParseConfigFile(filePath);
}

/**
 * Checks if a configuration file exists at the given path.
 *
 * @param filename - The configuration filename to check
 * @returns True if the file exists, false otherwise
 */
export async function configExists(filename: string): Promise<boolean> {
  const filePath = getConfigPath(filename);
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
