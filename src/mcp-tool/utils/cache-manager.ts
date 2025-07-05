/**
 * Advanced Caching System for Lark API Data
 * Provides intelligent caching with TTL, LRU eviction, and performance monitoring
 */

import { createErrorResponse, ErrorCategory } from './error-handler';

/**
 * Cache configuration options
 */
export interface CacheOptions {
  /** Maximum number of entries in cache */
  maxSize?: number;
  /** Default TTL in milliseconds */
  defaultTTL?: number;
  /** Enable performance metrics collection */
  enableMetrics?: boolean;
  /** Custom cache key prefix */
  keyPrefix?: string;
  /** Enable cache compression for large objects */
  enableCompression?: boolean;
}

/**
 * Cache entry metadata
 */
interface CacheEntry<T = any> {
  /** Cached data */
  data: T;
  /** Timestamp when entry was created */
  createdAt: number;
  /** Timestamp when entry expires */
  expiresAt: number;
  /** Number of times this entry has been accessed */
  accessCount: number;
  /** Last access timestamp */
  lastAccessed: number;
  /** Size of the cached data in bytes (estimated) */
  size: number;
  /** Cache key for this entry */
  key: string;
}

/**
 * Cache performance metrics
 */
export interface CacheMetrics {
  /** Total cache hits */
  hits: number;
  /** Total cache misses */
  misses: number;
  /** Hit ratio (hits / (hits + misses)) */
  hitRatio: number;
  /** Total number of cache entries */
  totalEntries: number;
  /** Total cache size in bytes */
  totalSize: number;
  /** Number of entries evicted due to TTL expiration */
  expiredEvictions: number;
  /** Number of entries evicted due to size limits */
  sizeEvictions: number;
  /** Average access time in milliseconds */
  averageAccessTime: number;
  /** Cache memory usage percentage */
  memoryUsage: number;
}

/**
 * Cache operation types for performance tracking
 */
type CacheOperation = 'get' | 'set' | 'delete' | 'clear' | 'evict';

/**
 * Predefined cache categories with optimized TTL settings
 */
export enum CacheCategory {
  /** User information - changes rarely */
  USER_INFO = 'user_info',
  /** Department structure - changes rarely */
  DEPARTMENTS = 'departments',
  /** Chat/group information - changes occasionally */
  CHAT_INFO = 'chat_info',
  /** App tokens - need refresh */
  APP_TOKENS = 'app_tokens',
  /** User tokens - short-lived */
  USER_TOKENS = 'user_tokens',
  /** API responses - varies by endpoint */
  API_RESPONSES = 'api_responses',
  /** Base/table metadata - changes occasionally */
  BASE_METADATA = 'base_metadata',
  /** Genesis templates - static */
  GENESIS_TEMPLATES = 'genesis_templates',
  /** Permission info - changes rarely */
  PERMISSIONS = 'permissions',
  /** Calendar free/busy - short-lived */
  CALENDAR_DATA = 'calendar_data',
}

/**
 * TTL configuration for different data types
 */
const CATEGORY_TTL: Record<CacheCategory, number> = {
  [CacheCategory.USER_INFO]: 30 * 60 * 1000, // 30 minutes
  [CacheCategory.DEPARTMENTS]: 60 * 60 * 1000, // 1 hour
  [CacheCategory.CHAT_INFO]: 15 * 60 * 1000, // 15 minutes
  [CacheCategory.APP_TOKENS]: 110 * 60 * 1000, // 110 minutes (tokens expire at 120min)
  [CacheCategory.USER_TOKENS]: 110 * 60 * 1000, // 110 minutes
  [CacheCategory.API_RESPONSES]: 5 * 60 * 1000, // 5 minutes
  [CacheCategory.BASE_METADATA]: 20 * 60 * 1000, // 20 minutes
  [CacheCategory.GENESIS_TEMPLATES]: 24 * 60 * 60 * 1000, // 24 hours (static)
  [CacheCategory.PERMISSIONS]: 45 * 60 * 1000, // 45 minutes
  [CacheCategory.CALENDAR_DATA]: 2 * 60 * 1000, // 2 minutes
};

/**
 * Advanced LRU Cache with TTL and performance monitoring
 */
export class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private accessOrder: string[] = [];
  private metrics: CacheMetrics;
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      maxSize: options.maxSize || 2000,
      defaultTTL: options.defaultTTL || 15 * 60 * 1000, // 15 minutes
      enableMetrics: options.enableMetrics !== false,
      keyPrefix: options.keyPrefix || 'lark_mcp',
      enableCompression: options.enableCompression || false,
    };

    this.metrics = {
      hits: 0,
      misses: 0,
      hitRatio: 0,
      totalEntries: 0,
      totalSize: 0,
      expiredEvictions: 0,
      sizeEvictions: 0,
      averageAccessTime: 0,
      memoryUsage: 0,
    };

    // Start cleanup interval
    setInterval(() => this.cleanup(), 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Generate cache key with category and identifier
   */
  private generateKey(category: CacheCategory | string, identifier: string): string {
    return `${this.options.keyPrefix}:${category}:${identifier}`;
  }

  /**
   * Estimate size of cached data
   */
  private estimateSize(data: any): number {
    if (typeof data === 'string') {
      return data.length * 2; // UTF-16 encoding
    }
    if (typeof data === 'object') {
      return JSON.stringify(data).length * 2;
    }
    return 64; // Default size for primitives
  }

  /**
   * Update LRU access order
   */
  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  /**
   * Record cache operation for metrics
   */
  private recordOperation(operation: CacheOperation, startTime?: number): void {
    if (!this.options.enableMetrics) return;

    if (operation === 'get' && startTime) {
      const accessTime = Date.now() - startTime;
      this.metrics.averageAccessTime = (this.metrics.averageAccessTime + accessTime) / 2;
    }

    this.updateMetrics();
  }

  /**
   * Update cache metrics
   */
  private updateMetrics(): void {
    if (!this.options.enableMetrics) return;

    this.metrics.totalEntries = this.cache.size;
    this.metrics.totalSize = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);
    this.metrics.hitRatio = this.metrics.hits / (this.metrics.hits + this.metrics.misses) || 0;
    this.metrics.memoryUsage = (this.metrics.totalSize / (this.options.maxSize * 1024)) * 100; // Rough estimate
  }

  /**
   * Evict entries when cache is full
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;

    const lruKey = this.accessOrder.shift()!;
    const entry = this.cache.get(lruKey);

    if (entry) {
      this.cache.delete(lruKey);
      this.metrics.sizeEvictions++;
      this.recordOperation('evict');
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => {
      this.cache.delete(key);
      const orderIndex = this.accessOrder.indexOf(key);
      if (orderIndex > -1) {
        this.accessOrder.splice(orderIndex, 1);
      }
      this.metrics.expiredEvictions++;
    });

    if (expiredKeys.length > 0) {
      this.recordOperation('evict');
    }
  }

  /**
   * Set cache entry with automatic TTL based on category
   */
  set<T>(category: CacheCategory | string, identifier: string, data: T, customTTL?: number): void {
    const key = this.generateKey(category, identifier);
    const now = Date.now();
    const ttl = customTTL || CATEGORY_TTL[category as CacheCategory] || this.options.defaultTTL;

    // Evict if cache is full
    while (this.cache.size >= this.options.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      createdAt: now,
      expiresAt: now + ttl,
      accessCount: 0,
      lastAccessed: now,
      size: this.estimateSize(data),
      key,
    };

    this.cache.set(key, entry);
    this.updateAccessOrder(key);
    this.recordOperation('set');
  }

  /**
   * Get cache entry with automatic expiration check
   */
  get<T>(category: CacheCategory | string, identifier: string): T | null {
    const startTime = Date.now();
    const key = this.generateKey(category, identifier);
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.metrics.misses++;
      this.recordOperation('get', startTime);
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.delete(category, identifier);
      this.metrics.misses++;
      this.recordOperation('get', startTime);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.updateAccessOrder(key);

    this.metrics.hits++;
    this.recordOperation('get', startTime);

    return entry.data;
  }

  /**
   * Delete specific cache entry
   */
  delete(category: CacheCategory | string, identifier: string): boolean {
    const key = this.generateKey(category, identifier);
    const existed = this.cache.delete(key);

    if (existed) {
      const orderIndex = this.accessOrder.indexOf(key);
      if (orderIndex > -1) {
        this.accessOrder.splice(orderIndex, 1);
      }
      this.recordOperation('delete');
    }

    return existed;
  }

  /**
   * Check if entry exists and is not expired
   */
  has(category: CacheCategory | string, identifier: string): boolean {
    const key = this.generateKey(category, identifier);
    const entry = this.cache.get(key);

    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.delete(category, identifier);
      return false;
    }

    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.recordOperation('clear');
  }

  /**
   * Clear cache entries by category
   */
  clearCategory(category: CacheCategory | string): number {
    const prefix = `${this.options.keyPrefix}:${category}:`;
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => {
      this.cache.delete(key);
      const orderIndex = this.accessOrder.indexOf(key);
      if (orderIndex > -1) {
        this.accessOrder.splice(orderIndex, 1);
      }
    });

    if (keysToDelete.length > 0) {
      this.recordOperation('delete');
    }

    return keysToDelete.length;
  }

  /**
   * Get current cache metrics
   */
  getMetrics(): CacheMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get cache statistics for monitoring
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRatio: number;
    categories: Record<string, number>;
    oldestEntry?: { key: string; age: number };
    mostAccessed?: { key: string; count: number };
  } {
    const now = Date.now();
    const categories: Record<string, number> = {};
    let oldestEntry: { key: string; age: number } | undefined;
    let mostAccessed: { key: string; count: number } | undefined;

    for (const [key, entry] of this.cache.entries()) {
      // Count by category
      const category = key.split(':')[1] || 'unknown';
      categories[category] = (categories[category] || 0) + 1;

      // Track oldest entry
      const age = now - entry.createdAt;
      if (!oldestEntry || age > oldestEntry.age) {
        oldestEntry = { key, age };
      }

      // Track most accessed
      if (!mostAccessed || entry.accessCount > mostAccessed.count) {
        mostAccessed = { key, count: entry.accessCount };
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hitRatio: this.metrics.hitRatio,
      categories,
      oldestEntry,
      mostAccessed,
    };
  }

  /**
   * Cache-aware wrapper for async operations
   */
  async getOrSet<T>(
    category: CacheCategory | string,
    identifier: string,
    fetcher: () => Promise<T>,
    customTTL?: number,
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(category, identifier);
    if (cached !== null) {
      return cached;
    }

    try {
      // Fetch data and cache it
      const data = await fetcher();
      this.set(category, identifier, data, customTTL);
      return data;
    } catch (error) {
      // Don't cache errors, just re-throw
      throw error;
    }
  }

  /**
   * Invalidate cache entries based on patterns
   */
  invalidatePattern(pattern: string): number {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => {
      this.cache.delete(key);
      const orderIndex = this.accessOrder.indexOf(key);
      if (orderIndex > -1) {
        this.accessOrder.splice(orderIndex, 1);
      }
    });

    if (keysToDelete.length > 0) {
      this.recordOperation('delete');
    }

    return keysToDelete.length;
  }

  /**
   * Preload frequently accessed data
   */
  async preload(
    category: CacheCategory | string,
    identifiers: string[],
    fetcher: (id: string) => Promise<any>,
    customTTL?: number,
  ): Promise<void> {
    const promises = identifiers.map(async (id) => {
      if (!this.has(category, id)) {
        try {
          const data = await fetcher(id);
          this.set(category, id, data, customTTL);
        } catch (error) {
          // Ignore preload errors
        }
      }
    });

    await Promise.allSettled(promises);
  }
}

/**
 * Global cache instance
 */
export const globalCache = new CacheManager({
  maxSize: parseInt(process.env.CACHE_SIZE || '2000'),
  defaultTTL: parseInt(process.env.CACHE_TTL || '900000'), // 15 minutes
  enableMetrics: process.env.ENABLE_PERFORMANCE_METRICS === 'true',
  keyPrefix: 'lark_mcp',
  enableCompression: false,
});

/**
 * Convenience functions for common cache operations
 */
export const cache = {
  /**
   * Cache user information
   */
  setUserInfo: (userId: string, userInfo: any) => globalCache.set(CacheCategory.USER_INFO, userId, userInfo),

  getUserInfo: (userId: string) => globalCache.get(CacheCategory.USER_INFO, userId),

  /**
   * Cache chat/group information
   */
  setChatInfo: (chatId: string, chatInfo: any) => globalCache.set(CacheCategory.CHAT_INFO, chatId, chatInfo),

  getChatInfo: (chatId: string) => globalCache.get(CacheCategory.CHAT_INFO, chatId),

  /**
   * Cache API responses
   */
  setApiResponse: (endpoint: string, params: string, response: any) =>
    globalCache.set(CacheCategory.API_RESPONSES, `${endpoint}:${params}`, response),

  getApiResponse: (endpoint: string, params: string) =>
    globalCache.get(CacheCategory.API_RESPONSES, `${endpoint}:${params}`),

  /**
   * Cache app tokens
   */
  setAppToken: (appId: string, token: any) => globalCache.set(CacheCategory.APP_TOKENS, appId, token),

  getAppToken: (appId: string) => globalCache.get(CacheCategory.APP_TOKENS, appId),

  /**
   * Cache user tokens
   */
  setUserToken: (userId: string, token: any) => globalCache.set(CacheCategory.USER_TOKENS, userId, token),

  getUserToken: (userId: string) => globalCache.get(CacheCategory.USER_TOKENS, userId),

  /**
   * Cache base metadata
   */
  setBaseMetadata: (baseToken: string, metadata: any) =>
    globalCache.set(CacheCategory.BASE_METADATA, baseToken, metadata),

  getBaseMetadata: (baseToken: string) => globalCache.get(CacheCategory.BASE_METADATA, baseToken),

  /**
   * Cache Genesis templates
   */
  setGenesisTemplate: (templateId: string, template: any) =>
    globalCache.set(CacheCategory.GENESIS_TEMPLATES, templateId, template),

  getGenesisTemplate: (templateId: string) => globalCache.get(CacheCategory.GENESIS_TEMPLATES, templateId),

  /**
   * Get cache statistics
   */
  getStats: () => globalCache.getStats(),

  /**
   * Get cache metrics
   */
  getMetrics: () => globalCache.getMetrics(),

  /**
   * Clear all cache
   */
  clear: () => globalCache.clear(),

  /**
   * Cache-aware data fetching
   */
  getOrFetch: <T>(category: CacheCategory, identifier: string, fetcher: () => Promise<T>, customTTL?: number) =>
    globalCache.getOrSet(category, identifier, fetcher, customTTL),
};
