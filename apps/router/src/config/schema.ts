/**
 * Configuration Schema Definitions
 *
 * Zod schemas for type-safe configuration validation.
 * Provides runtime validation with TypeScript type inference.
 */

import { z } from 'zod';

/**
 * Quota Schema
 * Defines rate limits and quota constraints for models/providers
 */
export const QuotaSchema = z.object({
  dailyRequests: z.number().optional(),
  monthlyRequests: z.number().optional(),
  rpm: z.number().optional(),
  tpm: z.number().optional(),
  quotaSize: z.enum(['tiny', 'small', 'medium', 'large', 'huge']),
});

/**
 * Model Schema
 * Defines model configuration including capabilities and quota
 */
export const ModelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  contextWindow: z.number().positive(),
  maxOutput: z.number().positive(),
  capabilities: z.array(z.string()),
  quota: QuotaSchema,
  tier: z.enum(['simple', 'medium', 'complex', 'reasoning']),
});

/**
 * Provider Schema (without secrets)
 * Defines provider structure - secrets managed separately
 */
export const ProviderSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  baseUrl: z.string().url(),
  enabled: z.boolean().default(true),
  models: z.array(ModelSchema).min(1, "Provider must have at least one model"),
});

/**
 * Provider Config Schema
 * Environment-specific provider configuration (API keys, enabled models)
 */
export const ProviderConfigSchema = z.object({
  enabled: z.boolean().optional(),
  apiKey: z.string().optional(),
  models: z.array(z.string()).optional(),
});

/**
 * Logging Config Schema
 * Extensible logging configuration for Conductor team integration
 */
export const LoggingConfigSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  format: z.enum(['json', 'pretty']).default('pretty'),
  file: z.string().optional(),
  errorReporting: z.object({
    enabled: z.boolean().default(false),
    dsn: z.string().optional(),
    environment: z.string().default('development'),
  }).optional(),
}).optional();

/**
 * Server Config Schema
 * Server configuration options
 */
export const ServerConfigSchema = z.object({
  port: z.number().positive().default(8402),
  host: z.string().default('localhost'),
});

/**
 * App Config Schema
 * Complete application configuration schema
 */
export const AppConfigSchema = z.object({
  server: ServerConfigSchema,
  providers: z.record(z.string(), ProviderSchema),
  providerConfig: z.record(z.string(), ProviderConfigSchema).optional(),
  logging: LoggingConfigSchema,
});

// Type Inference - TypeScript types derived from Zod schemas
export type QuotaConfig = z.infer<typeof QuotaSchema>;
export type ModelConfig = z.infer<typeof ModelSchema>;
export type Provider = z.infer<typeof ProviderSchema>;
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;
export type LoggingConfig = z.infer<typeof LoggingConfigSchema>;
export type ServerConfig = z.infer<typeof ServerConfigSchema>;
export type AppConfig = z.infer<typeof AppConfigSchema>;

/**
 * Runtime Provider type with API key
 * Extends Provider with runtime apiKey property from providerConfig.
 * Returned by getEnabledProviders() for use in server and routing logic.
 */
export type RuntimeProvider = Provider & { apiKey: string };
