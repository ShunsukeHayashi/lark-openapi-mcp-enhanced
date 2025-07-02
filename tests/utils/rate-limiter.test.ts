/**
 * TDD Tests for Token Bucket Rate Limiter
 * Testing critical infrastructure for API rate limiting
 */

import { 
  TokenBucketRateLimiter, 
  TieredRateLimiter,
  RateLimiterConfig,
  RateLimiterMetrics,
  DEFAULT_RATE_LIMITS
} from '@/utils/rate-limiter';

// Mock timers for deterministic testing
jest.useFakeTimers();

describe('TokenBucketRateLimiter - TDD Approach', () => {
  let rateLimiter: TokenBucketRateLimiter;
  const defaultConfig: RateLimiterConfig = {
    capacity: 10,
    tokensPerInterval: 5,
    intervalMs: 1000, // 5 tokens per second
    maxWaitTimeMs: 5000
  };

  beforeEach(() => {
    jest.clearAllTimers();
    rateLimiter = new TokenBucketRateLimiter(defaultConfig);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Basic Token Consumption', () => {
    test('should start with full capacity', () => {
      const metrics = rateLimiter.getMetrics();
      expect(metrics.availableTokens).toBe(10);
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.rateLimitedRequests).toBe(0);
    });

    test('should consume tokens when available', async () => {
      const result = await rateLimiter.consume(1);
      
      expect(result).toBe(true);
      const metrics = rateLimiter.getMetrics();
      expect(metrics.availableTokens).toBe(9);
      expect(metrics.totalRequests).toBe(1);
    });

    test('should consume multiple tokens at once', async () => {
      const result = await rateLimiter.consume(5);
      
      expect(result).toBe(true);
      const metrics = rateLimiter.getMetrics();
      expect(metrics.availableTokens).toBe(5);
    });

    test('should fail immediately when no tokens and maxWaitTime is 0', async () => {
      const noWaitConfig: RateLimiterConfig = {
        ...defaultConfig,
        maxWaitTimeMs: 0
      };
      rateLimiter = new TokenBucketRateLimiter(noWaitConfig);
      
      // Consume all tokens
      await rateLimiter.consume(10);
      
      // Try to consume when empty
      const result = await rateLimiter.consume(1);
      
      expect(result).toBe(false);
      const metrics = rateLimiter.getMetrics();
      expect(metrics.rateLimitedRequests).toBe(1);
    });
  });

  describe('Token Refill Mechanism', () => {
    test('should refill tokens after interval', async () => {
      // Consume all tokens
      await rateLimiter.consume(10);
      expect(rateLimiter.getMetrics().availableTokens).toBe(0);
      
      // Advance time by 1 second (1 interval)
      jest.advanceTimersByTime(1000);
      
      // Check refill
      const metrics = rateLimiter.getMetrics();
      expect(metrics.availableTokens).toBe(5); // 5 tokens per interval
    });

    test('should refill multiple intervals at once', async () => {
      // Consume all tokens
      await rateLimiter.consume(10);
      
      // Advance time by 3 seconds (3 intervals)
      jest.advanceTimersByTime(3000);
      
      // Should refill 15 tokens but cap at capacity (10)
      const metrics = rateLimiter.getMetrics();
      expect(metrics.availableTokens).toBe(10);
    });

    test('should not exceed capacity when refilling', async () => {
      // Consume 2 tokens
      await rateLimiter.consume(2);
      
      // Advance time by 10 seconds (10 intervals = 50 tokens)
      jest.advanceTimersByTime(10000);
      
      // Should still be capped at capacity
      const metrics = rateLimiter.getMetrics();
      expect(metrics.availableTokens).toBe(10);
    });
  });

  describe('Waiting for Tokens', () => {
    test('should wait for tokens when not immediately available', async () => {
      // Consume all tokens
      await rateLimiter.consume(10);
      
      // Request 3 tokens (will need to wait for refill)
      const consumePromise = rateLimiter.consume(3);
      
      // Should not resolve immediately
      expect(rateLimiter.getMetrics().availableTokens).toBe(0);
      
      // Advance time to trigger refill
      jest.advanceTimersByTime(1000);
      
      const result = await consumePromise;
      expect(result).toBe(true);
      expect(rateLimiter.getMetrics().availableTokens).toBe(2); // 5 refilled - 3 consumed
    });

    test('should fail if wait time exceeds maxWaitTime', async () => {
      const shortWaitConfig: RateLimiterConfig = {
        ...defaultConfig,
        maxWaitTimeMs: 500 // Only wait 500ms max
      };
      rateLimiter = new TokenBucketRateLimiter(shortWaitConfig);
      
      // Consume all tokens
      await rateLimiter.consume(10);
      
      // Request 8 tokens (would need 2 intervals = 2000ms)
      const result = await rateLimiter.consume(8);
      
      expect(result).toBe(false);
      const metrics = rateLimiter.getMetrics();
      expect(metrics.rateLimitedRequests).toBe(1);
    });

    test('should track wait time in metrics', async () => {
      // Consume 9 tokens
      await rateLimiter.consume(9);
      
      // Request 2 tokens (will wait for 1 refill)
      const consumePromise = rateLimiter.consume(2);
      
      jest.advanceTimersByTime(1000);
      await consumePromise;
      
      const metrics = rateLimiter.getMetrics();
      expect(metrics.averageWaitTime).toBeGreaterThan(0);
      expect(metrics.averageWaitTime).toBeLessThanOrEqual(1000);
    });
  });

  describe('Configuration Updates', () => {
    test('should update capacity', () => {
      rateLimiter.updateConfig({ capacity: 20 });
      
      // Refill to new capacity
      jest.advanceTimersByTime(10000);
      
      const metrics = rateLimiter.getMetrics();
      expect(metrics.availableTokens).toBe(20);
    });

    test('should reduce tokens if new capacity is lower', async () => {
      // Start with 10 tokens, consume 2
      await rateLimiter.consume(2);
      expect(rateLimiter.getMetrics().availableTokens).toBe(8);
      
      // Reduce capacity to 5
      rateLimiter.updateConfig({ capacity: 5 });
      
      // Tokens should be capped at new capacity
      const metrics = rateLimiter.getMetrics();
      expect(metrics.availableTokens).toBe(5);
    });

    test('should update refill rate', async () => {
      // Consume all tokens
      await rateLimiter.consume(10);
      
      // Update to faster refill
      rateLimiter.updateConfig({ tokensPerInterval: 10 });
      
      // Wait one interval
      jest.advanceTimersByTime(1000);
      
      const metrics = rateLimiter.getMetrics();
      expect(metrics.availableTokens).toBe(10); // Full refill in one interval
    });
  });

  describe('Reset Functionality', () => {
    test('should reset to initial state', async () => {
      // Make some requests
      await rateLimiter.consume(5);
      const noWaitConfig: RateLimiterConfig = {
        ...defaultConfig,
        maxWaitTimeMs: 0
      };
      rateLimiter.updateConfig(noWaitConfig);
      await rateLimiter.consume(10); // This will fail immediately
      
      const beforeReset = rateLimiter.getMetrics();
      expect(beforeReset.availableTokens).toBe(5);
      expect(beforeReset.totalRequests).toBe(2);
      expect(beforeReset.rateLimitedRequests).toBe(1);
      
      // Reset
      rateLimiter.reset();
      
      const afterReset = rateLimiter.getMetrics();
      expect(afterReset.availableTokens).toBe(10);
      expect(afterReset.totalRequests).toBe(0);
      expect(afterReset.rateLimitedRequests).toBe(0);
      expect(afterReset.averageWaitTime).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle requesting more tokens than capacity', async () => {
      const result = await rateLimiter.consume(15);
      
      expect(result).toBe(false);
      const metrics = rateLimiter.getMetrics();
      expect(metrics.rateLimitedRequests).toBe(1);
      expect(metrics.availableTokens).toBe(10); // Unchanged
    });

    test('should handle zero token requests', async () => {
      const result = await rateLimiter.consume(0);
      
      expect(result).toBe(true);
      const metrics = rateLimiter.getMetrics();
      expect(metrics.availableTokens).toBe(10); // Unchanged
    });

    test('should handle rapid sequential requests', async () => {
      // Use no-wait config for deterministic behavior
      const noWaitConfig: RateLimiterConfig = {
        ...defaultConfig,
        maxWaitTimeMs: 0
      };
      rateLimiter = new TokenBucketRateLimiter(noWaitConfig);
      
      const results = await Promise.all([
        rateLimiter.consume(3),
        rateLimiter.consume(3),
        rateLimiter.consume(3),
        rateLimiter.consume(3), // This should fail
      ]);
      
      expect(results).toEqual([true, true, true, false]);
      const metrics = rateLimiter.getMetrics();
      expect(metrics.availableTokens).toBe(1);
      expect(metrics.rateLimitedRequests).toBe(1);
    });
  });
});

describe('TieredRateLimiter - TDD Approach', () => {
  let tieredLimiter: TieredRateLimiter;
  const testConfigs = {
    read: {
      capacity: 10,
      tokensPerInterval: 5,
      intervalMs: 1000,
      maxWaitTimeMs: 1000
    },
    write: {
      capacity: 5,
      tokensPerInterval: 2,
      intervalMs: 1000,
      maxWaitTimeMs: 2000
    }
  };

  beforeEach(() => {
    jest.clearAllTimers();
    tieredLimiter = new TieredRateLimiter(testConfigs);
  });

  describe('Tier Management', () => {
    test('should create rate limiters for each tier', () => {
      const metrics = tieredLimiter.getAllMetrics();
      
      expect(metrics.read).toBeDefined();
      expect(metrics.write).toBeDefined();
      expect(metrics.read.availableTokens).toBe(10);
      expect(metrics.write.availableTokens).toBe(5);
    });

    test('should consume from specific tier', async () => {
      const readResult = await tieredLimiter.consume('read', 3);
      const writeResult = await tieredLimiter.consume('write', 2);
      
      expect(readResult).toBe(true);
      expect(writeResult).toBe(true);
      
      const metrics = tieredLimiter.getAllMetrics();
      expect(metrics.read.availableTokens).toBe(7);
      expect(metrics.write.availableTokens).toBe(3);
    });

    test('should throw error for non-existent tier', async () => {
      await expect(tieredLimiter.consume('invalid', 1))
        .rejects.toThrow("Rate limiter tier 'invalid' not found");
    });

    test('should get metrics for specific tier', () => {
      const readMetrics = tieredLimiter.getMetrics('read');
      expect(readMetrics).toBeDefined();
      expect(readMetrics?.availableTokens).toBe(10);
      
      const invalidMetrics = tieredLimiter.getMetrics('invalid');
      expect(invalidMetrics).toBeNull();
    });
  });

  describe('Reset Functionality', () => {
    test('should reset all tiers', async () => {
      // Consume tokens from both tiers
      await tieredLimiter.consume('read', 5);
      await tieredLimiter.consume('write', 3);
      
      // Reset all
      tieredLimiter.resetAll();
      
      const metrics = tieredLimiter.getAllMetrics();
      expect(metrics.read.availableTokens).toBe(10);
      expect(metrics.write.availableTokens).toBe(5);
      expect(metrics.read.totalRequests).toBe(0);
      expect(metrics.write.totalRequests).toBe(0);
    });

    test('should reset specific tier', async () => {
      // Consume tokens from both tiers
      await tieredLimiter.consume('read', 5);
      await tieredLimiter.consume('write', 3);
      
      // Reset only read tier
      tieredLimiter.reset('read');
      
      const metrics = tieredLimiter.getAllMetrics();
      expect(metrics.read.availableTokens).toBe(10);
      expect(metrics.read.totalRequests).toBe(0);
      expect(metrics.write.availableTokens).toBe(2);
      expect(metrics.write.totalRequests).toBe(1);
    });
  });

  describe('Independent Tier Operation', () => {
    test('should refill tiers independently', async () => {
      // Consume all tokens from both tiers
      await tieredLimiter.consume('read', 10);
      await tieredLimiter.consume('write', 5);
      
      // Advance time
      jest.advanceTimersByTime(1000);
      
      const metrics = tieredLimiter.getAllMetrics();
      expect(metrics.read.availableTokens).toBe(5); // 5 tokens per interval
      expect(metrics.write.availableTokens).toBe(2); // 2 tokens per interval
    });
  });
});

describe('DEFAULT_RATE_LIMITS', () => {
  test('should have correct structure for all tiers', () => {
    expect(DEFAULT_RATE_LIMITS).toHaveProperty('default');
    expect(DEFAULT_RATE_LIMITS).toHaveProperty('write');
    expect(DEFAULT_RATE_LIMITS).toHaveProperty('read');
    expect(DEFAULT_RATE_LIMITS).toHaveProperty('admin');
    
    // Verify admin is most restrictive
    expect(DEFAULT_RATE_LIMITS.admin.capacity).toBeLessThan(DEFAULT_RATE_LIMITS.write.capacity);
    expect(DEFAULT_RATE_LIMITS.write.capacity).toBeLessThan(DEFAULT_RATE_LIMITS.default.capacity);
    expect(DEFAULT_RATE_LIMITS.default.capacity).toBeLessThan(DEFAULT_RATE_LIMITS.read.capacity);
  });

  test('should work with TieredRateLimiter', () => {
    const limiter = new TieredRateLimiter(DEFAULT_RATE_LIMITS);
    const metrics = limiter.getAllMetrics();
    
    expect(Object.keys(metrics)).toHaveLength(4);
    expect(metrics.default.availableTokens).toBe(100);
    expect(metrics.read.availableTokens).toBe(200);
    expect(metrics.write.availableTokens).toBe(20);
    expect(metrics.admin.availableTokens).toBe(5);
  });
});