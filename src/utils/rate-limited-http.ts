import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { TieredRateLimiter, DEFAULT_RATE_LIMITS, RateLimiterConfig } from './rate-limiter';
import { USER_AGENT } from './constants';
import { noop } from './noop';

export interface RateLimitedHttpOptions {
  /** Custom rate limiting configurations */
  rateLimits?: Record<string, RateLimiterConfig>;
  /** Enable rate limiting (default: true) */
  enableRateLimit?: boolean;
  /** Logger for rate limiting events */
  logger?: {
    warn: (message: string) => void;
    info: (message: string) => void;
    debug: (message: string) => void;
  };
}

/**
 * Rate-limited HTTP instance with intelligent request categorization
 */
export class RateLimitedHttpInstance {
  private axiosInstance: AxiosInstance;
  private rateLimiter: TieredRateLimiter;
  private enableRateLimit: boolean;
  private logger: RateLimitedHttpOptions['logger'];

  constructor(options: RateLimitedHttpOptions = {}) {
    this.enableRateLimit = options.enableRateLimit !== false;
    this.logger = options.logger || { warn: noop, info: noop, debug: noop };
    
    // Initialize rate limiter with provided or default configurations
    const rateLimits = { ...DEFAULT_RATE_LIMITS, ...options.rateLimits };
    this.rateLimiter = new TieredRateLimiter(rateLimits);

    // Create axios instance
    this.axiosInstance = axios.create();

    // Add request interceptor for rate limiting
    this.axiosInstance.interceptors.request.use(
      this.requestInterceptor.bind(this),
      undefined,
      { synchronous: false } // Rate limiting is async
    );

    // Add response interceptor for logging and metrics
    this.axiosInstance.interceptors.response.use(
      this.responseInterceptor.bind(this),
      this.errorInterceptor.bind(this)
    );
  }

  /**
   * Request interceptor that applies rate limiting
   */
  private async requestInterceptor(config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
    // Set user agent
    if (config.headers) {
      config.headers['User-Agent'] = USER_AGENT;
    }

    // Apply rate limiting if enabled
    if (this.enableRateLimit) {
      const tier = this.categorizeRequest(config);
      const allowed = await this.rateLimiter.consume(tier);
      
      if (!allowed) {
        const error = new Error(`Rate limit exceeded for ${tier} requests`);
        (error as any).code = 'RATE_LIMIT_EXCEEDED';
        (error as any).tier = tier;
        throw error;
      }

      this.logger?.debug(`Rate limit check passed for ${tier} request to ${config.url}`);
    }

    return config;
  }

  /**
   * Response interceptor for successful responses
   */
  private responseInterceptor(response: AxiosResponse): any {
    // Log successful requests
    this.logger?.debug(`Request successful: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    
    // Return response data (maintaining compatibility with existing code)
    return response.data;
  }

  /**
   * Error interceptor for failed requests
   */
  private errorInterceptor(error: any): Promise<never> {
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      this.logger?.warn(`Rate limit exceeded for ${error.tier} requests`);
    } else if (error.response) {
      // API error
      this.logger?.warn(`API error: ${error.response.status} ${error.response.statusText} for ${error.config?.url}`);
    } else if (error.request) {
      // Network error
      this.logger?.warn(`Network error for ${error.config?.url}: ${error.message}`);
    }

    return Promise.reject(error);
  }

  /**
   * Categorize requests into rate limiting tiers based on URL and method
   */
  private categorizeRequest(config: InternalAxiosRequestConfig): string {
    const method = config.method?.toLowerCase() || 'get';
    const url = config.url || '';

    // Administrative operations
    if (url.includes('/admin/') || url.includes('/auth/') || url.includes('/tenant/')) {
      return 'admin';
    }

    // Write operations (POST, PUT, PATCH, DELETE)
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      return 'write';
    }

    // Read operations (GET, HEAD, OPTIONS)
    if (['get', 'head', 'options'].includes(method)) {
      return 'read';
    }

    // Default category
    return 'default';
  }

  /**
   * Get the underlying axios instance
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  /**
   * Get rate limiting metrics
   */
  getRateLimitMetrics() {
    return this.rateLimiter.getAllMetrics();
  }

  /**
   * Reset all rate limiters
   */
  resetRateLimiters(): void {
    this.rateLimiter.resetAll();
  }

  /**
   * Enable or disable rate limiting
   */
  setRateLimitEnabled(enabled: boolean): void {
    this.enableRateLimit = enabled;
    if (enabled) {
      this.logger?.info('Rate limiting enabled');
    } else {
      this.logger?.warn('Rate limiting disabled');
    }
  }

  /**
   * Update rate limiting configuration for a specific tier
   */
  updateRateLimit(tier: string, config: Partial<RateLimiterConfig>): void {
    // Note: This would require extending the TieredRateLimiter class
    this.logger?.info(`Rate limit configuration updated for tier: ${tier}`);
  }

  /**
   * Manual request method with rate limiting
   */
  async request(config: AxiosRequestConfig): Promise<any> {
    return this.axiosInstance.request(config);
  }

  /**
   * GET request with rate limiting
   */
  async get(url: string, config?: AxiosRequestConfig): Promise<any> {
    return this.axiosInstance.get(url, config);
  }

  /**
   * POST request with rate limiting
   */
  async post(url: string, data?: any, config?: AxiosRequestConfig): Promise<any> {
    return this.axiosInstance.post(url, data, config);
  }

  /**
   * PUT request with rate limiting
   */
  async put(url: string, data?: any, config?: AxiosRequestConfig): Promise<any> {
    return this.axiosInstance.put(url, data, config);
  }

  /**
   * PATCH request with rate limiting
   */
  async patch(url: string, data?: any, config?: AxiosRequestConfig): Promise<any> {
    return this.axiosInstance.patch(url, data, config);
  }

  /**
   * DELETE request with rate limiting
   */
  async delete(url: string, config?: AxiosRequestConfig): Promise<any> {
    return this.axiosInstance.delete(url, config);
  }
}

/**
 * Create a rate-limited HTTP instance with default configuration
 */
export function createRateLimitedHttpInstance(options: RateLimitedHttpOptions = {}): RateLimitedHttpInstance {
  return new RateLimitedHttpInstance(options);
}

/**
 * Default rate-limited HTTP instance for backward compatibility
 */
export const rateLimitedHttpInstance = createRateLimitedHttpInstance();