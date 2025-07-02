/**
 * TDD: Test-Driven Development for Rate Limited HTTP
 * 测试带速率限制的HTTP客户端实现
 */

// Mock axios with complete implementation before any imports
const mockAxiosInstance = {
  interceptors: {
    request: {
      use: jest.fn().mockReturnValue(1)
    },
    response: {
      use: jest.fn().mockReturnValue(2)
    }
  },
  request: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn()
};

const mockAxiosCreate = jest.fn().mockReturnValue(mockAxiosInstance);

jest.mock('axios', () => ({
  create: mockAxiosCreate
}));

jest.mock('@/utils/rate-limiter');

// Now import everything
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { TieredRateLimiter } from '@/utils/rate-limiter';
import { USER_AGENT } from '@/utils/constants';
import { RateLimitedHttpInstance, createRateLimitedHttpInstance } from '@/utils/rate-limited-http';

const mockedAxios = axios as jest.Mocked<typeof axios>;
const MockedTieredRateLimiter = TieredRateLimiter as jest.MockedClass<typeof TieredRateLimiter>;

describe('RateLimitedHttpInstance - TDD Approach', () => {
  let mockRateLimiter: jest.Mocked<TieredRateLimiter>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock rate limiter
    mockRateLimiter = {
      consume: jest.fn().mockResolvedValue(true),
      getAllMetrics: jest.fn().mockReturnValue({}),
      resetAll: jest.fn(),
      reset: jest.fn(),
      getMetrics: jest.fn()
    } as any;
    
    MockedTieredRateLimiter.mockImplementation(() => mockRateLimiter);
  });

  describe('Constructor and Initialization', () => {
    test('should create instance with default options', () => {
      const instance = new RateLimitedHttpInstance();
      
      expect(mockAxiosCreate).toHaveBeenCalled();
      expect(MockedTieredRateLimiter).toHaveBeenCalledWith(expect.objectContaining({
        default: expect.any(Object),
        read: expect.any(Object),
        write: expect.any(Object),
        admin: expect.any(Object)
      }));
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });

    test('should create instance with custom rate limits', () => {
      const customLimits = {
        custom: { capacity: 50, tokensPerInterval: 25, intervalMs: 60000 }
      };
      
      const instance = new RateLimitedHttpInstance({ rateLimits: customLimits });
      
      expect(MockedTieredRateLimiter).toHaveBeenCalledWith(expect.objectContaining({
        custom: customLimits.custom,
        default: expect.any(Object) // Should still have defaults
      }));
    });

    test('should respect enableRateLimit option', () => {
      const instance = new RateLimitedHttpInstance({ enableRateLimit: false });
      
      // Rate limiter should still be created (for potential enabling later)
      expect(MockedTieredRateLimiter).toHaveBeenCalled();
    });

    test('should use custom logger when provided', () => {
      const mockLogger = {
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn()
      };
      
      const instance = new RateLimitedHttpInstance({ logger: mockLogger });
      
      // Logger should be stored for use in interceptors
      expect(instance).toBeDefined();
    });
  });

  describe('Request Interceptor', () => {
    let instance: RateLimitedHttpInstance;
    let requestInterceptor: Function;
    
    beforeEach(() => {
      instance = new RateLimitedHttpInstance();
      // Get the request interceptor function
      requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
    });

    test('should add User-Agent header', async () => {
      const config: InternalAxiosRequestConfig = {
        headers: {},
        url: '/test',
        method: 'get'
      } as any;
      
      const result = await requestInterceptor(config);
      
      expect(result.headers['User-Agent']).toBe(USER_AGENT);
    });

    test('should apply rate limiting for requests', async () => {
      const config: InternalAxiosRequestConfig = {
        headers: {},
        url: '/api/data',
        method: 'get'
      } as any;
      
      await requestInterceptor(config);
      
      expect(mockRateLimiter.consume).toHaveBeenCalledWith('read');
    });

    test('should throw error when rate limit exceeded', async () => {
      mockRateLimiter.consume.mockResolvedValueOnce(false);
      
      const config: InternalAxiosRequestConfig = {
        headers: {},
        url: '/api/data',
        method: 'post'
      } as any;
      
      await expect(requestInterceptor(config)).rejects.toThrow('Rate limit exceeded for write requests');
    });

    test('should categorize admin requests correctly', async () => {
      const adminUrls = ['/admin/users', '/auth/login', '/tenant/settings'];
      
      for (const url of adminUrls) {
        const config: InternalAxiosRequestConfig = {
          headers: {},
          url,
          method: 'get'
        } as any;
        
        await requestInterceptor(config);
        
        expect(mockRateLimiter.consume).toHaveBeenLastCalledWith('admin');
      }
    });

    test('should categorize write requests correctly', async () => {
      const writeMethods = ['post', 'put', 'patch', 'delete'];
      
      for (const method of writeMethods) {
        mockRateLimiter.consume.mockClear();
        
        const config: InternalAxiosRequestConfig = {
          headers: {},
          url: '/api/data',
          method
        } as any;
        
        await requestInterceptor(config);
        
        expect(mockRateLimiter.consume).toHaveBeenCalledWith('write');
      }
    });

    test('should categorize read requests correctly', async () => {
      const readMethods = ['get', 'head', 'options'];
      
      for (const method of readMethods) {
        mockRateLimiter.consume.mockClear();
        
        const config: InternalAxiosRequestConfig = {
          headers: {},
          url: '/api/data',
          method
        } as any;
        
        await requestInterceptor(config);
        
        expect(mockRateLimiter.consume).toHaveBeenCalledWith('read');
      }
    });

    test('should skip rate limiting when disabled', async () => {
      const instance = new RateLimitedHttpInstance({ enableRateLimit: false });
      const interceptor = mockAxiosInstance.interceptors.request.use.mock.calls[1][0];
      
      const config: InternalAxiosRequestConfig = {
        headers: {},
        url: '/api/data',
        method: 'post'
      } as any;
      
      await interceptor(config);
      
      expect(mockRateLimiter.consume).not.toHaveBeenCalled();
    });

    test('should log debug messages with custom logger', async () => {
      const mockLogger = {
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn()
      };
      
      const instance = new RateLimitedHttpInstance({ logger: mockLogger });
      const interceptor = mockAxiosInstance.interceptors.request.use.mock.calls[2][0];
      
      const config: InternalAxiosRequestConfig = {
        headers: {},
        url: '/api/data',
        method: 'get'
      } as any;
      
      await interceptor(config);
      
      expect(mockLogger.debug).toHaveBeenCalledWith('Rate limit check passed for read request to /api/data');
    });
  });

  describe('Response Interceptor', () => {
    let instance: RateLimitedHttpInstance;
    let responseInterceptor: Function;
    let errorInterceptor: Function;
    
    beforeEach(() => {
      const mockLogger = {
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn()
      };
      
      instance = new RateLimitedHttpInstance({ logger: mockLogger });
      responseInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][0];
      errorInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
    });

    test('should return response data directly', () => {
      const mockResponse: AxiosResponse = {
        data: { result: 'success' },
        config: { method: 'get', url: '/api/data' },
        status: 200,
        statusText: 'OK',
        headers: {}
      } as any;
      
      const result = responseInterceptor(mockResponse);
      
      expect(result).toEqual({ result: 'success' });
    });

    test('should log successful requests', () => {
      const mockLogger = {
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn()
      };
      
      const instance = new RateLimitedHttpInstance({ logger: mockLogger });
      const interceptor = mockAxiosInstance.interceptors.response.use.mock.calls[1][0];
      
      const mockResponse: AxiosResponse = {
        data: { result: 'success' },
        config: { method: 'post', url: '/api/users' },
        status: 201,
        statusText: 'Created',
        headers: {}
      } as any;
      
      interceptor(mockResponse);
      
      expect(mockLogger.debug).toHaveBeenCalledWith('Request successful: POST /api/users');
    });

    test('should handle rate limit errors', async () => {
      const error = new Error('Rate limit exceeded for write requests');
      (error as any).code = 'RATE_LIMIT_EXCEEDED';
      (error as any).tier = 'write';
      
      await expect(errorInterceptor(error)).rejects.toThrow(error);
    });

    test('should handle API errors', async () => {
      const error = {
        response: {
          status: 404,
          statusText: 'Not Found'
        },
        config: {
          url: '/api/missing'
        }
      };
      
      await expect(errorInterceptor(error)).rejects.toEqual(error);
    });

    test('should handle network errors', async () => {
      const error = {
        request: {},
        config: {
          url: '/api/data'
        },
        message: 'Network Error'
      };
      
      await expect(errorInterceptor(error)).rejects.toEqual(error);
    });
  });

  describe('HTTP Methods', () => {
    let instance: RateLimitedHttpInstance;
    
    beforeEach(() => {
      instance = new RateLimitedHttpInstance();
      
      // Mock all axios methods to return promises
      mockAxiosInstance.request.mockResolvedValue({ data: 'request' });
      mockAxiosInstance.get.mockResolvedValue({ data: 'get' });
      mockAxiosInstance.post.mockResolvedValue({ data: 'post' });
      mockAxiosInstance.put.mockResolvedValue({ data: 'put' });
      mockAxiosInstance.patch.mockResolvedValue({ data: 'patch' });
      mockAxiosInstance.delete.mockResolvedValue({ data: 'delete' });
    });

    test('should support request method', async () => {
      const config = { method: 'get', url: '/test' };
      const result = await instance.request(config);
      
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(config);
      expect(result).toBe('request');
    });

    test('should support GET method', async () => {
      const result = await instance.get('/api/data', { headers: { 'X-Test': 'value' } });
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/data', { headers: { 'X-Test': 'value' } });
      expect(result).toBe('get');
    });

    test('should support POST method', async () => {
      const data = { name: 'test' };
      const result = await instance.post('/api/users', data, { headers: { 'X-Test': 'value' } });
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/users', data, { headers: { 'X-Test': 'value' } });
      expect(result).toBe('post');
    });

    test('should support PUT method', async () => {
      const data = { name: 'updated' };
      const result = await instance.put('/api/users/1', data);
      
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/api/users/1', data);
      expect(result).toBe('put');
    });

    test('should support PATCH method', async () => {
      const data = { status: 'active' };
      const result = await instance.patch('/api/users/1', data);
      
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/api/users/1', data);
      expect(result).toBe('patch');
    });

    test('should support DELETE method', async () => {
      const result = await instance.delete('/api/users/1', { headers: { 'X-Confirm': 'true' } });
      
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/api/users/1', { headers: { 'X-Confirm': 'true' } });
      expect(result).toBe('delete');
    });
  });

  describe('Rate Limiting Management', () => {
    let instance: RateLimitedHttpInstance;
    let mockLogger: any;
    
    beforeEach(() => {
      mockLogger = {
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn()
      };
      
      instance = new RateLimitedHttpInstance({ logger: mockLogger });
    });

    test('should get axios instance', () => {
      const axiosInstance = instance.getAxiosInstance();
      
      expect(axiosInstance).toBe(mockAxiosInstance);
    });

    test('should get rate limit metrics', () => {
      const mockMetrics = {
        read: { 
          availableTokens: 100, 
          totalRequests: 50,
          rateLimitedRequests: 5,
          averageWaitTime: 100,
          lastRefill: Date.now()
        },
        write: { 
          availableTokens: 20, 
          totalRequests: 10,
          rateLimitedRequests: 2,
          averageWaitTime: 200,
          lastRefill: Date.now()
        }
      };
      
      mockRateLimiter.getAllMetrics.mockReturnValue(mockMetrics);
      
      const metrics = instance.getRateLimitMetrics();
      
      expect(metrics).toEqual(mockMetrics);
      expect(mockRateLimiter.getAllMetrics).toHaveBeenCalled();
    });

    test('should reset rate limiters', () => {
      instance.resetRateLimiters();
      
      expect(mockRateLimiter.resetAll).toHaveBeenCalled();
    });

    test('should enable rate limiting', () => {
      instance.setRateLimitEnabled(true);
      
      expect(mockLogger.info).toHaveBeenCalledWith('Rate limiting enabled');
    });

    test('should disable rate limiting', () => {
      instance.setRateLimitEnabled(false);
      
      expect(mockLogger.warn).toHaveBeenCalledWith('Rate limiting disabled');
    });

    test('should update rate limit configuration', () => {
      instance.updateRateLimit('custom', { capacity: 100 });
      
      expect(mockLogger.info).toHaveBeenCalledWith('Rate limit configuration updated for tier: custom');
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing URL in request', async () => {
      const instance = new RateLimitedHttpInstance();
      const interceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
      
      const config: InternalAxiosRequestConfig = {
        headers: {},
        method: 'get'
      } as any;
      
      await interceptor(config);
      
      expect(mockRateLimiter.consume).toHaveBeenCalledWith('read');
    });

    test('should handle missing method in request', async () => {
      const instance = new RateLimitedHttpInstance();
      const interceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
      
      const config: InternalAxiosRequestConfig = {
        headers: {},
        url: '/api/data'
      } as any;
      
      await interceptor(config);
      
      expect(mockRateLimiter.consume).toHaveBeenCalledWith('read'); // Defaults to 'get' method
    });

    test('should handle unknown method', async () => {
      const instance = new RateLimitedHttpInstance();
      const interceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
      
      const config: InternalAxiosRequestConfig = {
        headers: {},
        url: '/api/data',
        method: 'custom'
      } as any;
      
      await interceptor(config);
      
      expect(mockRateLimiter.consume).toHaveBeenCalledWith('default');
    });
  });

  describe('Factory Functions', () => {
    test('should create instance using factory function', () => {
      const instance = createRateLimitedHttpInstance({ enableRateLimit: false });
      
      expect(instance).toBeInstanceOf(RateLimitedHttpInstance);
      expect(MockedTieredRateLimiter).toHaveBeenCalled();
    });

    test('should create instance using factory function with default options', () => {
      const instance = createRateLimitedHttpInstance();
      
      expect(instance).toBeInstanceOf(RateLimitedHttpInstance);
      expect(MockedTieredRateLimiter).toHaveBeenCalled();
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle rapid requests with rate limiting', async () => {
      const instance = new RateLimitedHttpInstance();
      const interceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
      
      // Simulate rate limit being hit
      mockRateLimiter.consume
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      
      const config: InternalAxiosRequestConfig = {
        headers: {},
        url: '/api/data',
        method: 'post'
      } as any;
      
      // First two requests should succeed
      await expect(interceptor(config)).resolves.toBeDefined();
      await expect(interceptor(config)).resolves.toBeDefined();
      
      // Third request should fail
      await expect(interceptor(config)).rejects.toThrow('Rate limit exceeded for write requests');
    });

    test('should handle mixed tier requests', async () => {
      const instance = new RateLimitedHttpInstance();
      const interceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
      
      const readConfig: InternalAxiosRequestConfig = {
        headers: {},
        url: '/api/data',
        method: 'get'
      } as any;
      
      const writeConfig: InternalAxiosRequestConfig = {
        headers: {},
        url: '/api/data',
        method: 'post'
      } as any;
      
      const adminConfig: InternalAxiosRequestConfig = {
        headers: {},
        url: '/admin/settings',
        method: 'put'
      } as any;
      
      await interceptor(readConfig);
      await interceptor(writeConfig);
      await interceptor(adminConfig);
      
      expect(mockRateLimiter.consume).toHaveBeenNthCalledWith(1, 'read');
      expect(mockRateLimiter.consume).toHaveBeenNthCalledWith(2, 'write');
      expect(mockRateLimiter.consume).toHaveBeenNthCalledWith(3, 'admin');
    });
  });
});