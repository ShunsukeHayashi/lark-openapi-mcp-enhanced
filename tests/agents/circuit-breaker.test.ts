/**
 * Test Circuit Breaker Pattern Implementation
 */

import { CircuitBreaker, CircuitBreakerManager, CircuitState } from '../../src/agents/ml/circuit-breaker';
import { CoordinatorAgent, createCoordinatorInstance } from '../../src/agents/specialists/coordinator-agent';
import { LarkMcpToolOptions } from '../../src/mcp-tool/types';

describe('Circuit Breaker Pattern', () => {
  describe('CircuitBreaker Core', () => {
    let breaker: CircuitBreaker;

    beforeEach(() => {
      breaker = new CircuitBreaker('test-tool', {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000, // 1 second for testing
        volumeThreshold: 5,
        errorRate: 0.5,
        slowCallDuration: 100,
        slowCallRateThreshold: 0.5,
      });
    });

    test('should start in CLOSED state', () => {
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    test('should open after failure threshold', async () => {
      const failingOperation = async () => {
        throw new Error('Test failure');
      };

      // Fail 3 times
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.call(failingOperation);
        } catch (e) {
          // Expected
        }
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    test('should reject calls when OPEN', async () => {
      breaker.forceOpen();

      const operation = async () => 'success';
      
      await expect(breaker.call(operation)).rejects.toThrow(
        'Circuit breaker is OPEN for test-tool'
      );
    });

    test('should transition to HALF_OPEN after timeout', async () => {
      breaker.forceOpen();
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Next call should transition to HALF_OPEN
      const operation = async () => 'success';
      await breaker.call(operation);

      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);
    });

    test('should close after success threshold in HALF_OPEN', async () => {
      // Force to HALF_OPEN state
      breaker.forceOpen();
      await new Promise(resolve => setTimeout(resolve, 1100));

      const successOperation = async () => 'success';

      // First success in HALF_OPEN
      await breaker.call(successOperation);
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

      // Second success should close the circuit
      await breaker.call(successOperation);
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    test('should track statistics correctly', async () => {
      const successOp = async () => 'success';
      const failOp = async () => { throw new Error('fail'); };

      // Mix of success and failure
      await breaker.call(successOp);
      try { await breaker.call(failOp); } catch (e) {}
      await breaker.call(successOp);

      const stats = breaker.getStats();
      expect(stats.totalCalls).toBe(3);
      expect(stats.successfulCalls).toBe(2);
      expect(stats.failedCalls).toBe(1);
      expect(stats.errorRate).toBeCloseTo(0.33, 1);
    });

    test('should handle slow calls', async () => {
      const slowOp = async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
        return 'slow success';
      };

      await breaker.call(slowOp);
      
      const stats = breaker.getStats();
      expect(stats.slowCalls).toBe(1);
      expect(stats.averageResponseTime).toBeGreaterThan(100);
    });
  });

  describe('CircuitBreakerManager', () => {
    let manager: CircuitBreakerManager;

    beforeEach(() => {
      manager = new CircuitBreakerManager({
        failureThreshold: 2,
        timeout: 500,
      });
    });

    test('should create and retrieve breakers', () => {
      const breaker1 = manager.getBreaker('tool1');
      const breaker2 = manager.getBreaker('tool2');
      const breaker1Again = manager.getBreaker('tool1');

      expect(breaker1).toBe(breaker1Again);
      expect(breaker1).not.toBe(breaker2);
      expect(manager.getAllBreakers().size).toBe(2);
    });

    test('should provide summary of all breakers', () => {
      const breaker1 = manager.getBreaker('tool1');
      const breaker2 = manager.getBreaker('tool2');
      
      breaker1.forceOpen();

      const summary = manager.getSummary();
      expect(summary).toHaveLength(2);
      expect(summary.find(s => s.tool === 'tool1')?.state).toBe(CircuitState.OPEN);
      expect(summary.find(s => s.tool === 'tool2')?.state).toBe(CircuitState.CLOSED);
    });

    test('should reset all breakers', () => {
      const breaker1 = manager.getBreaker('tool1');
      const breaker2 = manager.getBreaker('tool2');
      
      breaker1.forceOpen();
      breaker2.forceOpen();

      manager.resetAll();

      expect(breaker1.getState()).toBe(CircuitState.CLOSED);
      expect(breaker2.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('Coordinator Integration', () => {
    let coordinator: CoordinatorAgent;

    beforeEach(() => {
      const mcpOptions: LarkMcpToolOptions = {
        appId: 'test-app-id',
        appSecret: 'test-app-secret',
        toolsOptions: {
          language: 'en',
          allowTools: ['bitable.v1.appTableRecord.search', 'im.v1.message.create']
        }
      };

      coordinator = createCoordinatorInstance(mcpOptions);
    });

    afterEach(() => {
      if (coordinator && typeof coordinator.cleanup === 'function') {
        coordinator.cleanup();
      }
    });

    test('should get circuit breaker status', async () => {
      const tool = coordinator.tools.get('get_circuit_breaker_status');
      expect(tool).toBeDefined();

      const result = await tool?.execute({});
      
      expect(result.success).toBe(true);
      expect(result.circuitBreakers).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.total).toBeGreaterThanOrEqual(0);
    });

    test('should handle circuit breaker opening on repeated failures', async () => {
      // Execute a tool multiple times to trigger circuit breaker
      const executeTool = coordinator.tools.get('execute_mcp_tool');
      
      // Force multiple failures
      for (let i = 0; i < 5; i++) {
        await executeTool?.execute({
          toolName: 'bitable.v1.appTableRecord.search',
          toolParams: { app_token: 'test', table_id: 'test' }
        });
      }

      // Check circuit breaker status
      const statusTool = coordinator.tools.get('get_circuit_breaker_status');
      const status = await statusTool?.execute({});
      
      const breaker = status.circuitBreakers.find(
        (cb: any) => cb.tool === 'bitable.v1.appTableRecord.search'
      );
      
      expect(breaker).toBeDefined();
      expect(breaker.state).toBe(CircuitState.OPEN);
      expect(breaker.stats.failedCalls).toBeGreaterThan(0);
    });

    test('should reset circuit breaker', async () => {
      const resetTool = coordinator.tools.get('reset_circuit_breaker');
      expect(resetTool).toBeDefined();

      const result = await resetTool?.execute({
        toolName: 'bitable.v1.appTableRecord.search'
      });
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('has been reset');
    });

    test('should reset all circuit breakers', async () => {
      const resetTool = coordinator.tools.get('reset_circuit_breaker');
      
      const result = await resetTool?.execute({
        resetAll: true
      });
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('All circuit breakers have been reset');
      expect(result.resetCount).toBeGreaterThanOrEqual(0);
    });

    test('should configure circuit breaker', async () => {
      const configureTool = coordinator.tools.get('configure_circuit_breaker');
      expect(configureTool).toBeDefined();

      const result = await configureTool?.execute({
        toolName: 'test.tool',
        failureThreshold: 10,
        timeout: 30000,
        errorRate: 0.3,
      });
      
      expect(result.success).toBe(true);
      expect(result.configuration).toMatchObject({
        failureThreshold: 10,
        timeout: 30000,
        errorRate: 0.3,
      });
    });

    test('should force circuit breaker state', async () => {
      const forceTool = coordinator.tools.get('force_circuit_breaker_state');
      expect(forceTool).toBeDefined();

      // Force open
      let result = await forceTool?.execute({
        toolName: 'test.tool',
        state: 'open'
      });
      
      expect(result.success).toBe(true);
      expect(result.newState).toBe(CircuitState.OPEN);

      // Force closed
      result = await forceTool?.execute({
        toolName: 'test.tool',
        state: 'closed'
      });
      
      expect(result.success).toBe(true);
      expect(result.newState).toBe(CircuitState.CLOSED);
    });

    test('should prevent execution when circuit is open', async () => {
      // Force circuit open
      const forceTool = coordinator.tools.get('force_circuit_breaker_state');
      await forceTool?.execute({
        toolName: 'bitable.v1.appTableRecord.search',
        state: 'open'
      });

      // Try to execute tool
      const executeTool = coordinator.tools.get('execute_mcp_tool');
      const result = await executeTool?.execute({
        toolName: 'bitable.v1.appTableRecord.search',
        toolParams: { app_token: 'test', table_id: 'test' }
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('temporarily unavailable');
      expect(result.circuitBreakerState).toBe(CircuitState.OPEN);
    });
  });
});