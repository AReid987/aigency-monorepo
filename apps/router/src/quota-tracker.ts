/**
 * Quota Tracker
 * 
 * Monitors and tracks quota usage across providers.
 * Persists daily/monthly counters to warn before hitting limits.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Provider, ModelConfig } from './config/schema.js';
import { logger } from './lib/logging/logger.js';

export interface QuotaUsage {
  modelId: string;
  requestCount: number;
  tokenCount: number;
  lastReset: number;  // Timestamp of last reset
  dailyLimit?: number;
  monthlyLimit?: number;
}

export interface QuotaAlert {
  modelId: string;
  usagePercent: number;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

export class QuotaTracker {
  private usage: Map<string, QuotaUsage> = new Map();
  private dataFile: string;
  private alertThresholds = {
    warning: 0.80,  // 80% usage
    critical: 0.95  // 95% usage
  };

  constructor(dataDir: string = './.simplellmrouter') {
    // Ensure data directory exists
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    
    this.dataFile = join(dataDir, 'quota-usage.json');
    this.load();
    
    // Auto-save every 5 minutes
    setInterval(() => this.save(), 5 * 60 * 1000);
  }

  /**
   * Record a request
   */
  recordRequest(modelId: string, tokenCount: number, quotaConfig: ModelConfig['quota']): void {
    let usage = this.usage.get(modelId);
    
    if (!usage) {
      usage = {
        modelId,
        requestCount: 0,
        tokenCount: 0,
        lastReset: Date.now(),
        dailyLimit: quotaConfig.dailyRequests,
        monthlyLimit: quotaConfig.monthlyRequests
      };
      this.usage.set(modelId, usage);
    }

    // Check if we need to reset counters
    const now = Date.now();
    const elapsed = now - usage.lastReset;
    const hoursSinceReset = elapsed / (1000 * 60 * 60);

    // Daily reset (after 24 hours)
    if (hoursSinceReset >= 24 && usage.dailyLimit) {
      usage.requestCount = 0;
      usage.tokenCount = 0;
      usage.lastReset = now;
      logger.info(`🔄 Reset daily quota for ${modelId}`);
    }

    // Monthly reset (after 30 days)
    const daysSinceReset = hoursSinceReset / 24;
    if (daysSinceReset >= 30 && usage.monthlyLimit) {
      usage.requestCount = 0;
      usage.tokenCount = 0;
      usage.lastReset = now;
      logger.info(`🔄 Reset monthly quota for ${modelId}`);
    }

    // Increment counters
    usage.requestCount++;
    usage.tokenCount += tokenCount;

    // Check for alerts
    const alerts = this.checkAlerts(usage);
    for (const alert of alerts) {
      this.logAlert(alert);
    }
  }

  /**
   * Get current usage for a model
   */
  getUsage(modelId: string): QuotaUsage | null {
    return this.usage.get(modelId) || null;
  }

  /**
   * Get usage percentage (0-1)
   */
  getUsagePercent(modelId: string): number {
    const usage = this.usage.get(modelId);
    if (!usage) return 0;

    // Check daily limit first
    if (usage.dailyLimit) {
      return usage.requestCount / usage.dailyLimit;
    }

    // Fall back to monthly
    if (usage.monthlyLimit) {
      return usage.requestCount / usage.monthlyLimit;
    }

    return 0;
  }

  /**
   * Check if model is approaching quota limits
   */
  checkAlerts(usage: QuotaUsage): QuotaAlert[] {
    const alerts: QuotaAlert[] = [];
    
    // Daily quota check
    if (usage.dailyLimit) {
      const percent = usage.requestCount / usage.dailyLimit;
      
      if (percent >= this.alertThresholds.critical) {
        alerts.push({
          modelId: usage.modelId,
          usagePercent: percent,
          message: `CRITICAL: ${usage.modelId} at ${(percent * 100).toFixed(0)}% of daily quota (${usage.requestCount}/${usage.dailyLimit} requests)`,
          severity: 'critical'
        });
      } else if (percent >= this.alertThresholds.warning) {
        alerts.push({
          modelId: usage.modelId,
          usagePercent: percent,
          message: `WARNING: ${usage.modelId} at ${(percent * 100).toFixed(0)}% of daily quota (${usage.requestCount}/${usage.dailyLimit} requests)`,
          severity: 'warning'
        });
      }
    }

    // Monthly quota check
    if (usage.monthlyLimit) {
      const percent = usage.requestCount / usage.monthlyLimit;
      
      if (percent >= this.alertThresholds.critical) {
        alerts.push({
          modelId: usage.modelId,
          usagePercent: percent,
          message: `CRITICAL: ${usage.modelId} at ${(percent * 100).toFixed(0)}% of monthly quota (${usage.requestCount}/${usage.monthlyLimit} requests)`,
          severity: 'critical'
        });
      } else if (percent >= this.alertThresholds.warning) {
        alerts.push({
          modelId: usage.modelId,
          usagePercent: percent,
          message: `WARNING: ${usage.modelId} at ${(percent * 100).toFixed(0)}% of monthly quota (${usage.requestCount}/${usage.monthlyLimit} requests)`,
          severity: 'warning'
        });
      }
    }

    return alerts;
  }

  /**
   * Log an alert to console
   */
  private logAlert(alert: QuotaAlert): void {
    const icon = alert.severity === 'critical' ? '🚨' : '⚠️';
    if (alert.severity === 'critical') {
      logger.error(`${icon} ${alert.message}`);
    } else {
      logger.warn(`${icon} ${alert.message}`);
    }
  }

  /**
   * Get all current alerts
   */
  getAllAlerts(): QuotaAlert[] {
    const allAlerts: QuotaAlert[] = [];
    
    for (const usage of this.usage.values()) {
      const alerts = this.checkAlerts(usage);
      allAlerts.push(...alerts);
    }

    return allAlerts;
  }

  /**
   * Get usage summary for all models
   */
  getSummary(): string[] {
    const lines: string[] = [];
    lines.push('📊 Quota Usage Summary');
    lines.push('═'.repeat(60));

    if (this.usage.size === 0) {
      lines.push('No usage data yet.');
      return lines;
    }

    // Sort by usage percentage (highest first)
    const sortedUsage = Array.from(this.usage.values()).sort((a, b) => {
      const aPercent = a.dailyLimit ? a.requestCount / a.dailyLimit : 0;
      const bPercent = b.dailyLimit ? b.requestCount / b.dailyLimit : 0;
      return bPercent - aPercent;
    });

    for (const usage of sortedUsage) {
      const dailyPercent = usage.dailyLimit 
        ? ((usage.requestCount / usage.dailyLimit) * 100).toFixed(1)
        : 'N/A';
      
      const monthlyPercent = usage.monthlyLimit
        ? ((usage.requestCount / usage.monthlyLimit) * 100).toFixed(1)
        : 'N/A';

      const bar = this.makeProgressBar(
        usage.dailyLimit ? usage.requestCount / usage.dailyLimit : 0
      );

      lines.push('');
      lines.push(`${usage.modelId}`);
      lines.push(`  Requests: ${usage.requestCount.toLocaleString()}`);
      
      if (usage.dailyLimit) {
        lines.push(`  Daily:    ${bar} ${dailyPercent}% (${usage.requestCount}/${usage.dailyLimit})`);
      }
      
      if (usage.monthlyLimit) {
        lines.push(`  Monthly:  ${monthlyPercent}% (${usage.requestCount}/${usage.monthlyLimit.toLocaleString()})`);
      }
      
      lines.push(`  Tokens:   ${usage.tokenCount.toLocaleString()}`);
    }

    return lines;
  }

  /**
   * Make a simple progress bar
   */
  private makeProgressBar(percent: number, width: number = 20): string {
    const filled = Math.floor(percent * width);
    const empty = width - filled;
    
    let color = '';
    if (percent >= 0.95) color = '🔴';
    else if (percent >= 0.80) color = '🟡';
    else color = '🟢';

    return `${color} [${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  }

  /**
   * Save usage data to disk
   */
  save(): void {
    try {
      const data = JSON.stringify(
        Array.from(this.usage.entries()),
        null,
        2
      );
      writeFileSync(this.dataFile, data, 'utf-8');
    } catch (err: unknown) {
      logger.error({ err }, 'Failed to save quota data');
    }
  }

  /**
   * Load usage data from disk
   */
  load(): void {
    try {
      if (existsSync(this.dataFile)) {
        const data = readFileSync(this.dataFile, 'utf-8');
        const entries = JSON.parse(data) as Array<[string, QuotaUsage]>;
        this.usage = new Map(entries);
        logger.info(`✓ Loaded quota data: ${this.usage.size} models tracked`);
      }
    } catch (err: unknown) {
      logger.error({ err }, 'Failed to load quota data');
    }
  }

  /**
   * Reset all counters (for testing)
   */
  reset(): void {
    this.usage.clear();
    this.save();
    logger.info('🔄 Reset all quota counters');
  }

  /**
   * Get models sorted by remaining quota (most remaining first)
   */
  getModelsByRemainingQuota(providers: Provider[]): string[] {
    const modelQuotas: Array<{ id: string; remaining: number }> = [];

    for (const provider of providers) {
      for (const model of provider.models) {
        const fullId = `${provider.id}/${model.id}`;
        const usage = this.getUsage(fullId);
        
        // Calculate remaining quota
        let remaining = Infinity;
        if (model.quota.dailyRequests) {
          const used = usage?.requestCount || 0;
          remaining = Math.min(remaining, model.quota.dailyRequests - used);
        }
        
        modelQuotas.push({ id: fullId, remaining });
      }
    }

    // Sort by remaining quota (highest first)
    modelQuotas.sort((a, b) => b.remaining - a.remaining);
    
    return modelQuotas.map(m => m.id);
  }
}
