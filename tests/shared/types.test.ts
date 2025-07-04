/**
 * Unit tests for shared type definitions
 */

import { describe, test, expect } from '@jest/globals';
import { UnifiedError } from '../../src/shared/types';

describe('Shared Types', () => {
  describe('UnifiedError', () => {
    test('should create error with default values', () => {
      const error = new UnifiedError('Test error', 'TEST_ERROR');
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.retryable).toBe(true);
      expect(error.name).toBe('UnifiedError');
      expect(error.details).toBeUndefined();
    });

    test('should create error with custom values', () => {
      const details = { extra: 'info' };
      const error = new UnifiedError(
        'Custom error',
        'CUSTOM_ERROR',
        400,
        details,
        false
      );
      
      expect(error.message).toBe('Custom error');
      expect(error.code).toBe('CUSTOM_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.retryable).toBe(false);
      expect(error.details).toEqual(details);
    });

    test('should be instance of Error', () => {
      const error = new UnifiedError('Test', 'TEST');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof UnifiedError).toBe(true);
    });

    test('should have correct stack trace', () => {
      const error = new UnifiedError('Test', 'TEST');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('UnifiedError');
    });
  });

  describe('Type Exports', () => {
    test('should export WorkflowResult type', () => {
      // This test ensures the type exists and can be used
      const result: import('../../src/shared/types').WorkflowResult = {
        success: true,
        message: 'Test completed',
        data: { test: true }
      };
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Test completed');
      expect(result.data).toEqual({ test: true });
    });

    test('should export ExecutionResult type', () => {
      // This test ensures the type exists and can be used
      const result: import('../../src/shared/types').ExecutionResult = {
        taskId: 'task-123',
        success: true,
        output: 'Task completed',
        duration: 1000
      };
      
      expect(result.taskId).toBe('task-123');
      expect(result.success).toBe(true);
      expect(result.output).toBe('Task completed');
      expect(result.duration).toBe(1000);
    });

    test('should export TaskResult type', () => {
      // This test ensures the type exists and can be used
      const result: import('../../src/shared/types').TaskResult = {
        id: 'task-456',
        status: 'completed',
        result: { value: 42 }
      };
      
      expect(result.id).toBe('task-456');
      expect(result.status).toBe('completed');
      expect(result.result).toEqual({ value: 42 });
    });
  });

  describe('Error Handling Patterns', () => {
    test('should handle authentication errors', () => {
      const error = new UnifiedError(
        'Invalid credentials',
        'AUTH_ERROR',
        401,
        { provider: 'lark' },
        false
      );
      
      expect(error.statusCode).toBe(401);
      expect(error.retryable).toBe(false);
      expect(error.code).toBe('AUTH_ERROR');
    });

    test('should handle rate limiting errors', () => {
      const error = new UnifiedError(
        'Rate limit exceeded',
        'RATE_LIMIT',
        429,
        { retryAfter: 60 },
        true
      );
      
      expect(error.statusCode).toBe(429);
      expect(error.retryable).toBe(true);
      expect(error.details?.retryAfter).toBe(60);
    });

    test('should handle validation errors', () => {
      const error = new UnifiedError(
        'Invalid input',
        'VALIDATION_ERROR',
        400,
        { field: 'email', expected: 'string' },
        false
      );
      
      expect(error.statusCode).toBe(400);
      expect(error.retryable).toBe(false);
      expect(error.details?.field).toBe('email');
    });
  });
});