/**
 * Configuration Manager for Tool Priorities
 * Handles loading and validation of external configuration files
 */

import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

// Priority pattern schema
const PriorityPatternSchema = z.object({
  pattern: z.string(),
  priority: z.number().min(1).max(10),
  description: z.string().optional(),
});

// Fallback mapping schema
const FallbackMappingSchema = z.object({
  primary: z.string(),
  fallbacks: z.array(z.string()),
  description: z.string().optional(),
});

// Retry policy schema
const RetryPolicySchema = z.object({
  maxAttempts: z.number().min(1).default(3),
  baseDelay: z.number().min(0).default(1000),
  maxDelay: z.number().min(0).default(10000),
  backoffMultiplier: z.number().min(1).default(2),
});

// Main configuration schema
const ToolPrioritiesConfigSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().optional(),
  priorities: z.record(
    z.object({
      description: z.string().optional(),
      patterns: z.array(PriorityPatternSchema),
    }),
  ),
  fallbacks: z
    .object({
      description: z.string().optional(),
      mappings: z.array(FallbackMappingSchema),
    })
    .optional(),
  retryPolicy: RetryPolicySchema.optional(),
});

export type ToolPrioritiesConfig = z.infer<typeof ToolPrioritiesConfigSchema>;
export type PriorityPattern = z.infer<typeof PriorityPatternSchema>;
export type FallbackMapping = z.infer<typeof FallbackMappingSchema>;
export type RetryPolicy = z.infer<typeof RetryPolicySchema>;

export class ConfigManager {
  private config: ToolPrioritiesConfig | null = null;
  private configPath: string;
  private lastModified: Date | null = null;
  private watchInterval: NodeJS.Timeout | null = null;

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(__dirname, 'tool-priorities.json');
  }

  /**
   * Load configuration from file
   */
  async loadConfig(): Promise<ToolPrioritiesConfig> {
    try {
      const stats = await fs.promises.stat(this.configPath);
      
      // Check if file has been modified
      if (this.config && this.lastModified && stats.mtime <= this.lastModified) {
        return this.config;
      }

      const content = await fs.promises.readFile(this.configPath, 'utf-8');
      const rawConfig = JSON.parse(content);

      // Validate configuration
      const validatedConfig = ToolPrioritiesConfigSchema.parse(rawConfig);
      
      this.config = validatedConfig;
      this.lastModified = stats.mtime;
      
      return validatedConfig;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // Return default configuration if file doesn't exist
        return this.getDefaultConfig();
      }
      throw new Error(`Failed to load configuration: ${error}`);
    }
  }

  /**
   * Save configuration to file
   */
  async saveConfig(config: ToolPrioritiesConfig): Promise<void> {
    try {
      // Validate configuration before saving
      const validatedConfig = ToolPrioritiesConfigSchema.parse(config);
      
      const content = JSON.stringify(validatedConfig, null, 2);
      await fs.promises.writeFile(this.configPath, content, 'utf-8');
      
      this.config = validatedConfig;
      this.lastModified = new Date();
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error}`);
    }
  }

  /**
   * Get tool priorities as a Map
   */
  async getToolPriorities(): Promise<Map<string, number>> {
    const config = await this.loadConfig();
    const priorities = new Map<string, number>();

    for (const group of Object.values(config.priorities)) {
      for (const pattern of group.patterns) {
        priorities.set(pattern.pattern, pattern.priority);
      }
    }

    return priorities;
  }

  /**
   * Get tool fallback mappings
   */
  async getToolFallbacks(): Promise<Map<string, string[]>> {
    const config = await this.loadConfig();
    const fallbacks = new Map<string, string[]>();

    if (config.fallbacks) {
      for (const mapping of config.fallbacks.mappings) {
        fallbacks.set(mapping.primary, mapping.fallbacks);
      }
    }

    return fallbacks;
  }

  /**
   * Get retry policy
   */
  async getRetryPolicy(): Promise<RetryPolicy> {
    const config = await this.loadConfig();
    return config.retryPolicy || this.getDefaultRetryPolicy();
  }

  /**
   * Update tool priority
   */
  async updateToolPriority(pattern: string, priority: number, group?: string): Promise<void> {
    const config = await this.loadConfig();
    
    // Find and update existing pattern
    let updated = false;
    for (const [groupName, groupData] of Object.entries(config.priorities)) {
      if (!group || group === groupName) {
        const patternIndex = groupData.patterns.findIndex((p) => p.pattern === pattern);
        if (patternIndex >= 0) {
          groupData.patterns[patternIndex].priority = priority;
          updated = true;
          break;
        }
      }
    }

    // Add new pattern if not found
    if (!updated) {
      const targetGroup = group || 'customTools';
      if (!config.priorities[targetGroup]) {
        config.priorities[targetGroup] = {
          description: 'Custom tool priorities',
          patterns: [],
        };
      }
      config.priorities[targetGroup].patterns.push({
        pattern,
        priority,
        description: 'Added via API',
      });
    }

    await this.saveConfig(config);
  }

  /**
   * Add fallback mapping
   */
  async addFallbackMapping(primary: string, fallbacks: string[], description?: string): Promise<void> {
    const config = await this.loadConfig();
    
    if (!config.fallbacks) {
      config.fallbacks = {
        description: 'Tool fallback mappings',
        mappings: [],
      };
    }

    // Update existing mapping or add new one
    const existingIndex = config.fallbacks.mappings.findIndex((m) => m.primary === primary);
    if (existingIndex >= 0) {
      config.fallbacks.mappings[existingIndex] = { primary, fallbacks, description };
    } else {
      config.fallbacks.mappings.push({ primary, fallbacks, description });
    }

    await this.saveConfig(config);
  }

  /**
   * Watch configuration file for changes
   */
  watchConfig(callback: (config: ToolPrioritiesConfig) => void, interval: number = 5000): void {
    this.stopWatching();

    this.watchInterval = setInterval(async () => {
      try {
        const config = await this.loadConfig();
        callback(config);
      } catch (error) {
        console.error('Error watching configuration:', error);
      }
    }, interval);
  }

  /**
   * Stop watching configuration file
   */
  stopWatching(): void {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): ToolPrioritiesConfig {
    return {
      version: '1.0.0',
      description: 'Default tool priority configuration',
      priorities: {
        larkTools: {
          description: 'Lark MCP tools',
          patterns: [
            { pattern: 'lark.mcp.base', priority: 1 },
            { pattern: 'lark.mcp.im', priority: 1 },
            { pattern: 'lark.mcp.docs', priority: 2 },
            { pattern: 'lark.mcp.calendar', priority: 2 },
            { pattern: 'lark.mcp.contact', priority: 3 },
          ],
        },
        chromeMcpTools: {
          description: 'Chrome MCP tools',
          patterns: [
            { pattern: 'chrome.mcp.search', priority: 4 },
            { pattern: 'chrome.mcp.automation', priority: 5 },
            { pattern: 'chrome.mcp.general', priority: 6 },
          ],
        },
      },
      fallbacks: {
        description: 'Default fallback mappings',
        mappings: [],
      },
      retryPolicy: this.getDefaultRetryPolicy(),
    };
  }

  /**
   * Get default retry policy
   */
  private getDefaultRetryPolicy(): RetryPolicy {
    return {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
    };
  }
}

// Export singleton instance
export const toolPriorityConfig = new ConfigManager();