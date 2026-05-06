/**
 * Configuration Validator
 *
 * Validates configuration using Zod schemas and formats errors for user feedback.
 */

import type { z } from "zod";
import type { AppConfig } from "./schema.js";
import { AppConfigSchema } from "./schema.js";

/**
 * Validation result type for configuration validation.
 */
export type ValidationResult =
  | { success: true; data: AppConfig }
  | { success: false; errors: z.ZodError };

/**
 * Validates configuration against the application schema.
 *
 * @param rawConfig - The raw configuration object to validate
 * @returns Validation result with either valid data or Zod errors
 */
export function validateConfig(rawConfig: unknown): ValidationResult {
  const result = AppConfigSchema.safeParse(rawConfig);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: result.error };
}

/**
 * Checks if a configuration is valid without throwing.
 *
 * @param rawConfig - The raw configuration object to validate
 * @returns True if configuration is valid, false otherwise
 */
export function isValidConfig(rawConfig: unknown): rawConfig is AppConfig {
  const result = validateConfig(rawConfig);
  return result.success;
}

/**
 * Formats Zod validation errors into human-readable messages.
 *
 * @param errors - The Zod error object from failed validation
 * @returns Formatted error message string
 */
export function formatValidationErrors(errors: z.ZodError): string {
  const lines: string[] = ["Configuration validation failed:\n"];

  // Group errors by provider for better readability
  const errorsByProvider = new Map<string, z.ZodIssue[]>();
  const otherErrors: z.ZodIssue[] = [];

  for (const issue of errors.issues) {
    const path = issue.path.join(".");

    // Check if this is a provider-related error
    if (path.startsWith("providers.")) {
      // Extract provider ID from path (e.g., "providers.mistral.models[0]" -> "mistral")
      const parts = path.split(".");
      if (parts.length >= 2) {
        const providerId = parts[1];
        if (!errorsByProvider.has(providerId)) {
          errorsByProvider.set(providerId, []);
        }
        errorsByProvider.get(providerId)?.push(issue);
        continue;
      }
    }

    // Check if this is a providerConfig-related error
    if (path.startsWith("providerConfig.")) {
      const parts = path.split(".");
      if (parts.length >= 2) {
        const providerId = parts[1];
        const key = `providerConfig:${providerId}`;
        if (!errorsByProvider.has(key)) {
          errorsByProvider.set(key, []);
        }
        errorsByProvider.get(key)?.push(issue);
        continue;
      }
    }

    otherErrors.push(issue);
  }

  // Format provider-specific errors
  const providerEntries = Array.from(errorsByProvider.entries());
  for (const [providerId, providerErrors] of providerEntries) {
    const displayName = providerId.startsWith("providerConfig:")
      ? `Provider config '${providerId.replace("providerConfig:", "")}'`
      : `Provider '${providerId}'`;

    lines.push(`${displayName}:`);

    for (const error of providerErrors) {
      const pathStr = error.path.join(".");
      const message = formatErrorMessage(error);
      lines.push(`  ✗ ${pathStr}: ${message}`);
    }

    lines.push("");
  }

  // Format other errors
  if (otherErrors.length > 0) {
    if (errorsByProvider.size > 0) {
      lines.push("Other issues:");
    }

    for (const error of otherErrors) {
      const pathStr = error.path.join(".") || "root";
      const message = formatErrorMessage(error);
      lines.push(`  ✗ ${pathStr}: ${message}`);
    }

    lines.push("");
  }

  lines.push("Fix these issues and restart the server.");

  return lines.join("\n");
}

/**
 * Formats a single Zod error message.
 *
 * @param error - The Zod issue to format
 * @returns Formatted error message
 */
function formatErrorMessage(error: z.ZodIssue): string {
  const baseError = error as { message?: string };

  switch (error.code) {
    case "invalid_type": {
      // Zod v4 uses 'expected' and 'received' in the message
      if ("received" in error && error.received === "undefined") {
        return "Missing required field";
      }
      if ("expected" in error && "received" in error) {
        return `Expected ${error.expected}, received ${error.received}`;
      }
      return baseError.message || "Invalid type";
    }

    case "invalid_value": {
      // Handle enum and literal errors in Zod v4
      return baseError.message || "Invalid value";
    }

    case "too_small": {
      if ("minimum" in error) {
        const err = error as { minimum: number; type?: string };
        const typeLabel = err.type === "string" || err.type === "array" ? err.type : "";
        const plural = err.minimum !== 1 ? "s" : "";
        return `Must be at least ${err.minimum} ${typeLabel}${plural}`;
      }
      return baseError.message || "Value too small";
    }

    case "too_big": {
      if ("maximum" in error) {
        const err = error as { maximum: number; type?: string };
        const typeLabel = err.type === "string" || err.type === "array" ? err.type : "";
        const plural = err.maximum !== 1 ? "s" : "";
        return `Must be at most ${err.maximum} ${typeLabel}${plural}`;
      }
      return baseError.message || "Value too big";
    }

    case "invalid_format": {
      // Zod v4 uses 'invalid_format' instead of 'invalid_string'
      if ("validation" in error) {
        if (error.validation === "url") {
          return "Must be a valid URL";
        }
        if (error.validation === "email") {
          return "Must be a valid email address";
        }
        return `Invalid format: ${error.validation}`;
      }
      return baseError.message || "Invalid format";
    }

    case "invalid_union":
      return "Value does not match any of the allowed types";

    default:
      return baseError.message || "Unknown validation error";
  }
}

/**
 * Validates configuration and throws formatted error if invalid.
 *
 * @param rawConfig - The raw configuration object to validate
 * @returns The validated configuration
 * @throws Error with formatted validation message if invalid
 */
export function validateConfigOrThrow(rawConfig: unknown): AppConfig {
  const result = validateConfig(rawConfig);

  if (!result.success) {
    const message = formatValidationErrors(
      (result as { success: false; errors: z.ZodError }).errors
    );
    throw new Error(message);
  }

  return (result as { success: true; data: AppConfig }).data;
}
