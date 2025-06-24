/**
 * Token Bucket Rate Limiter Implementation
 * Provides configurable rate limiting for API calls to prevent quota exhaustion
 */

export interface RateLimiterConfig {
  /** Maximum number of tokens in the bucket */
  capacity: number;
  /** Number of tokens to refill per refill interval */
  tokensPerInterval: number;
  /** Refill interval in milliseconds */
  intervalMs: number;
  /** Maximum time to wait for a token (ms). If 0, fails immediately when no tokens */
  maxWaitTimeMs?: number;
}

export interface RateLimiterMetrics {
  /** Current number of available tokens */
  availableTokens: number;
  /** Total requests made */
  totalRequests: number;
  /** Total requests that were rate limited */
  rateLimitedRequests: number;
  /** Average wait time for requests (ms) */
  averageWaitTime: number;
  /** Last refill timestamp */
  lastRefill: number;
}

export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefill: number;
  private totalRequests: number = 0;
  private rateLimitedRequests: number = 0;
  private totalWaitTime: number = 0;

  constructor(private config: RateLimiterConfig) {
    this.tokens = config.capacity;
    this.lastRefill = Date.now();
  }

  /**
   * Attempt to consume a token. Returns a promise that resolves when a token is available.
   * @param tokensRequested Number of tokens to consume (default: 1)
   * @returns Promise that resolves to true if tokens were consumed, false if rate limited
   */
  async consume(tokensRequested: number = 1): Promise<boolean> {
    this.totalRequests++;
    const startTime = Date.now();

    // Refill tokens based on elapsed time
    this.refill();

    // If we have enough tokens, consume immediately
    if (this.tokens >= tokensRequested) {
      this.tokens -= tokensRequested;
      return true;
    }

    // If no wait time allowed, fail immediately
    const maxWait = this.config.maxWaitTimeMs || 0;
    if (maxWait === 0) {
      this.rateLimitedRequests++;
      return false;
    }

    // Calculate how long to wait for tokens to be available
    const tokensNeeded = tokensRequested - this.tokens;
    const timeToWait = Math.ceil(tokensNeeded / this.config.tokensPerInterval) * this.config.intervalMs;

    if (timeToWait > maxWait) {
      this.rateLimitedRequests++;
      return false;
    }

    // Wait for tokens to be available
    await this.delay(timeToWait);
    this.refill();

    if (this.tokens >= tokensRequested) {
      this.tokens -= tokensRequested;
      const waitTime = Date.now() - startTime;
      this.totalWaitTime += waitTime;
      return true;
    }

    this.rateLimitedRequests++;
    return false;
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const intervalsElapsed = Math.floor(elapsed / this.config.intervalMs);

    if (intervalsElapsed > 0) {
      const tokensToAdd = intervalsElapsed * this.config.tokensPerInterval;
      this.tokens = Math.min(this.config.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  /**
   * Get current rate limiter metrics
   */
  getMetrics(): RateLimiterMetrics {
    this.refill(); // Update tokens before returning metrics
    
    return {
      availableTokens: this.tokens,
      totalRequests: this.totalRequests,
      rateLimitedRequests: this.rateLimitedRequests,
      averageWaitTime: this.totalRequests > 0 ? this.totalWaitTime / this.totalRequests : 0,
      lastRefill: this.lastRefill,
    };
  }

  /**
   * Reset the rate limiter to initial state
   */
  reset(): void {
    this.tokens = this.config.capacity;
    this.lastRefill = Date.now();
    this.totalRequests = 0;
    this.rateLimitedRequests = 0;
    this.totalWaitTime = 0;
  }

  /**
   * Update rate limiter configuration
   */
  updateConfig(newConfig: Partial<RateLimiterConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Ensure tokens don't exceed new capacity
    if (newConfig.capacity !== undefined) {
      this.tokens = Math.min(this.tokens, newConfig.capacity);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Multi-tier rate limiter that supports different limits for different types of operations
 */
export class TieredRateLimiter {
  private limiters: Map<string, TokenBucketRateLimiter> = new Map();

  constructor(private configs: Record<string, RateLimiterConfig>) {
    for (const [tier, config] of Object.entries(configs)) {
      this.limiters.set(tier, new TokenBucketRateLimiter(config));
    }
  }

  /**
   * Consume tokens from a specific tier
   */
  async consume(tier: string, tokensRequested: number = 1): Promise<boolean> {
    const limiter = this.limiters.get(tier);
    if (!limiter) {
      throw new Error(`Rate limiter tier '${tier}' not found`);
    }
    return limiter.consume(tokensRequested);
  }

  /**
   * Get metrics for all tiers
   */
  getAllMetrics(): Record<string, RateLimiterMetrics> {
    const metrics: Record<string, RateLimiterMetrics> = {};
    for (const [tier, limiter] of this.limiters.entries()) {
      metrics[tier] = limiter.getMetrics();
    }
    return metrics;
  }

  /**
   * Get metrics for a specific tier
   */
  getMetrics(tier: string): RateLimiterMetrics | null {
    const limiter = this.limiters.get(tier);
    return limiter ? limiter.getMetrics() : null;
  }

  /**
   * Reset all rate limiters
   */
  resetAll(): void {
    for (const limiter of this.limiters.values()) {
      limiter.reset();
    }
  }

  /**
   * Reset a specific tier
   */
  reset(tier: string): void {
    const limiter = this.limiters.get(tier);
    if (limiter) {
      limiter.reset();
    }
  }
}

/**
 * Default rate limiting configurations for Feishu/Lark API
 * Based on typical API rate limits and best practices
 */
export const DEFAULT_RATE_LIMITS: Record<string, RateLimiterConfig> = {
  // Conservative limits for general API calls
  default: {
    capacity: 100,
    tokensPerInterval: 50,
    intervalMs: 60000, // 50 requests per minute
    maxWaitTimeMs: 5000,
  },
  
  // More restrictive for high-impact operations
  write: {
    capacity: 20,
    tokensPerInterval: 10,
    intervalMs: 60000, // 10 writes per minute
    maxWaitTimeMs: 10000,
  },
  
  // Less restrictive for read operations
  read: {
    capacity: 200,
    tokensPerInterval: 100,
    intervalMs: 60000, // 100 reads per minute
    maxWaitTimeMs: 2000,
  },
  
  // Very restrictive for administrative operations
  admin: {
    capacity: 5,
    tokensPerInterval: 2,
    intervalMs: 60000, // 2 admin operations per minute
    maxWaitTimeMs: 30000,
  },
};