/**
 * Circuit Breaker Pattern for Tool Execution
 * Prevents repeated calls to failing tools and provides automatic recovery
 */

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Tool is failing, reject all calls
  HALF_OPEN = 'HALF_OPEN' // Testing if tool has recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number;      // Number of failures before opening circuit
  successThreshold: number;      // Number of successes in half-open before closing
  timeout: number;               // Time in ms before attempting recovery
  volumeThreshold: number;       // Minimum calls before evaluating
  errorRate: number;             // Error rate threshold (0-1)
  slowCallDuration: number;      // Duration in ms to consider a call slow
  slowCallRateThreshold: number; // Slow call rate threshold (0-1)
}

export interface CircuitStats {
  totalCalls: number;
  failedCalls: number;
  successfulCalls: number;
  slowCalls: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  averageResponseTime: number;
  errorRate: number;
  slowCallRate: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime?: Date;
  private nextAttemptTime?: Date;
  private callHistory: Array<{
    timestamp: Date;
    success: boolean;
    duration: number;
  }> = [];
  private stateChangeCallbacks: Array<(state: CircuitState) => void> = [];

  constructor(
    private readonly name: string,
    private readonly config: CircuitBreakerConfig = {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000, // 1 minute
      volumeThreshold: 10,
      errorRate: 0.5,
      slowCallDuration: 5000,
      slowCallRateThreshold: 0.5,
    }
  ) {}

  /**
   * Check if the circuit allows the call
   */
  async call<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.allowRequest()) {
      throw new Error(`Circuit breaker is OPEN for ${this.name}. Tool is temporarily unavailable.`);
    }

    const startTime = Date.now();
    
    try {
      const result = await operation();
      this.onSuccess(Date.now() - startTime);
      return result;
    } catch (error) {
      this.onFailure(Date.now() - startTime);
      throw error;
    }
  }

  /**
   * Check if request is allowed based on circuit state
   */
  private allowRequest(): boolean {
    switch (this.state) {
      case CircuitState.CLOSED:
        return true;
      
      case CircuitState.OPEN:
        if (this.shouldAttemptReset()) {
          this.transitionTo(CircuitState.HALF_OPEN);
          return true;
        }
        return false;
      
      case CircuitState.HALF_OPEN:
        return true;
      
      default:
        return false;
    }
  }

  /**
   * Handle successful call
   */
  private onSuccess(duration: number): void {
    this.recordCall(true, duration);
    this.lastFailureTime = undefined;

    switch (this.state) {
      case CircuitState.HALF_OPEN:
        this.successCount++;
        if (this.successCount >= this.config.successThreshold) {
          this.transitionTo(CircuitState.CLOSED);
        }
        break;
      
      case CircuitState.CLOSED:
        // Evaluate if we should stay closed based on metrics
        this.evaluateHealthMetrics();
        break;
    }
  }

  /**
   * Handle failed call
   */
  private onFailure(duration: number): void {
    this.recordCall(false, duration);
    this.lastFailureTime = new Date();
    this.failureCount++;

    switch (this.state) {
      case CircuitState.HALF_OPEN:
        this.transitionTo(CircuitState.OPEN);
        break;
      
      case CircuitState.CLOSED:
        if (this.shouldOpen()) {
          this.transitionTo(CircuitState.OPEN);
        }
        break;
    }
  }

  /**
   * Record call for metrics
   */
  private recordCall(success: boolean, duration: number): void {
    const record = {
      timestamp: new Date(),
      success,
      duration,
    };

    this.callHistory.push(record);

    // Keep only recent history (last 100 calls)
    if (this.callHistory.length > 100) {
      this.callHistory.shift();
    }
  }

  /**
   * Check if circuit should open
   */
  private shouldOpen(): boolean {
    // Check failure count threshold
    if (this.failureCount >= this.config.failureThreshold) {
      return true;
    }

    // Check if we have enough volume
    if (this.callHistory.length < this.config.volumeThreshold) {
      return false;
    }

    const metrics = this.calculateMetrics();

    // Check error rate
    if (metrics.errorRate > this.config.errorRate) {
      return true;
    }

    // Check slow call rate
    if (metrics.slowCallRate > this.config.slowCallRateThreshold) {
      return true;
    }

    return false;
  }

  /**
   * Check if we should attempt to reset the circuit
   */
  private shouldAttemptReset(): boolean {
    return (
      this.nextAttemptTime !== undefined &&
      new Date().getTime() >= this.nextAttemptTime.getTime()
    );
  }

  /**
   * Evaluate health metrics in closed state
   */
  private evaluateHealthMetrics(): void {
    if (this.callHistory.length < this.config.volumeThreshold) {
      return;
    }

    const metrics = this.calculateMetrics();

    // Proactively open if metrics are degrading
    if (
      metrics.errorRate > this.config.errorRate * 0.8 || // 80% of threshold
      metrics.slowCallRate > this.config.slowCallRateThreshold * 0.8
    ) {
      // Consider opening the circuit proactively
      if (this.failureCount > this.config.failureThreshold * 0.5) {
        this.transitionTo(CircuitState.OPEN);
      }
    }
  }

  /**
   * Calculate current metrics
   */
  private calculateMetrics(): CircuitStats {
    const totalCalls = this.callHistory.length;
    if (totalCalls === 0) {
      return {
        totalCalls: 0,
        failedCalls: 0,
        successfulCalls: 0,
        slowCalls: 0,
        averageResponseTime: 0,
        errorRate: 0,
        slowCallRate: 0,
      };
    }

    const failedCalls = this.callHistory.filter(c => !c.success).length;
    const successfulCalls = totalCalls - failedCalls;
    const slowCalls = this.callHistory.filter(
      c => c.duration > this.config.slowCallDuration
    ).length;

    const totalDuration = this.callHistory.reduce((sum, c) => sum + c.duration, 0);
    const averageResponseTime = totalDuration / totalCalls;

    return {
      totalCalls,
      failedCalls,
      successfulCalls,
      slowCalls,
      lastFailureTime: this.lastFailureTime,
      averageResponseTime,
      errorRate: failedCalls / totalCalls,
      slowCallRate: slowCalls / totalCalls,
    };
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;

    switch (newState) {
      case CircuitState.CLOSED:
        this.failureCount = 0;
        this.successCount = 0;
        this.nextAttemptTime = undefined;
        break;
      
      case CircuitState.OPEN:
        this.nextAttemptTime = new Date(Date.now() + this.config.timeout);
        this.successCount = 0;
        break;
      
      case CircuitState.HALF_OPEN:
        this.successCount = 0;
        this.failureCount = 0;
        break;
    }

    // Notify listeners
    this.stateChangeCallbacks.forEach(callback => callback(newState));

    // Log state change
    if (process.env.NODE_ENV !== 'test') {
      console.log(
        `Circuit breaker ${this.name}: ${oldState} -> ${newState}`,
        newState === CircuitState.OPEN ? `(retry after ${this.config.timeout}ms)` : ''
      );
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit statistics
   */
  getStats(): CircuitStats {
    return this.calculateMetrics();
  }

  /**
   * Force circuit to close (for manual recovery)
   */
  forceClose(): void {
    this.transitionTo(CircuitState.CLOSED);
  }

  /**
   * Force circuit to open (for manual intervention)
   */
  forceOpen(): void {
    this.transitionTo(CircuitState.OPEN);
  }

  /**
   * Reset all statistics
   */
  reset(): void {
    this.failureCount = 0;
    this.successCount = 0;
    this.callHistory = [];
    this.lastFailureTime = undefined;
    this.nextAttemptTime = undefined;
    this.transitionTo(CircuitState.CLOSED);
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(callback: (state: CircuitState) => void): () => void {
    this.stateChangeCallbacks.push(callback);
    return () => {
      this.stateChangeCallbacks = this.stateChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Get time until next retry attempt
   */
  getTimeUntilRetry(): number | null {
    if (this.state !== CircuitState.OPEN || !this.nextAttemptTime) {
      return null;
    }
    
    const timeLeft = this.nextAttemptTime.getTime() - Date.now();
    return Math.max(0, timeLeft);
  }
}

/**
 * Circuit Breaker Manager for multiple tools
 */
export class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private defaultConfig: CircuitBreakerConfig;

  constructor(defaultConfig?: Partial<CircuitBreakerConfig>) {
    this.defaultConfig = {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000,
      volumeThreshold: 10,
      errorRate: 0.5,
      slowCallDuration: 5000,
      slowCallRateThreshold: 0.5,
      ...defaultConfig,
    };
  }

  /**
   * Get or create circuit breaker for a tool
   */
  getBreaker(toolName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    let breaker = this.breakers.get(toolName);
    
    if (!breaker) {
      breaker = new CircuitBreaker(toolName, {
        ...this.defaultConfig,
        ...config,
      });
      this.breakers.set(toolName, breaker);
    }
    
    return breaker;
  }

  /**
   * Get all circuit breakers
   */
  getAllBreakers(): Map<string, CircuitBreaker> {
    return new Map(this.breakers);
  }

  /**
   * Get summary of all circuit states
   */
  getSummary(): Array<{
    tool: string;
    state: CircuitState;
    stats: CircuitStats;
    timeUntilRetry: number | null;
  }> {
    const summary: Array<any> = [];
    
    this.breakers.forEach((breaker, tool) => {
      summary.push({
        tool,
        state: breaker.getState(),
        stats: breaker.getStats(),
        timeUntilRetry: breaker.getTimeUntilRetry(),
      });
    });
    
    return summary;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }

  /**
   * Reset specific circuit breaker
   */
  reset(toolName: string): void {
    const breaker = this.breakers.get(toolName);
    if (breaker) {
      breaker.reset();
    }
  }
}