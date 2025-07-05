/**
 * Test Performance Monitoring System
 */

import { PerformanceMonitor } from '../../src/agents/monitoring/performance-monitor';
import { DashboardServer } from '../../src/agents/monitoring/dashboard-server';
import { CoordinatorAgent, createCoordinatorInstance } from '../../src/agents/specialists/coordinator-agent';
import { LarkMcpToolOptions } from '../../src/mcp-tool/types';

describe('Performance Monitoring System', () => {
  describe('PerformanceMonitor Core', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
      monitor = new PerformanceMonitor({
        refreshInterval: 100,
        retentionPeriod: 60000,
        aggregationInterval: 1000,
      });
    });

    afterEach(() => {
      monitor.stop();
    });

    test('should record performance metrics', () => {
      monitor.recordMetric({
        type: 'tool',
        name: 'test.tool',
        value: 100,
        unit: 'ms',
        metadata: { success: true },
      });

      const data = monitor.getDashboardData();
      expect(data.recentMetrics).toHaveLength(1);
      expect(data.recentMetrics[0].name).toBe('test.tool');
      expect(data.recentMetrics[0].value).toBe(100);
    });

    test('should update agent metrics', () => {
      monitor.updateAgentMetrics('agent1', {
        agentName: 'Test Agent',
        tasksCompleted: 5,
        tasksFailed: 1,
      });

      const data = monitor.getDashboardData();
      expect(data.agents).toHaveLength(1);
      expect(data.agents[0].agentId).toBe('agent1');
      expect(data.agents[0].successRate).toBeCloseTo(0.833, 2);
    });

    test('should update tool metrics', () => {
      monitor.updateToolMetrics('test.tool', {
        success: true,
        executionTime: 150,
      });

      monitor.updateToolMetrics('test.tool', {
        success: false,
        executionTime: 200,
        error: 'Test error',
      });

      const data = monitor.getDashboardData();
      expect(data.tools).toHaveLength(1);
      expect(data.tools[0].executionCount).toBe(2);
      expect(data.tools[0].errorRate).toBe(0.5);
      expect(data.tools[0].averageExecutionTime).toBe(175);
    });

    test('should create and resolve alerts', () => {
      const alertId = monitor.createAlert('warning', 'test', 'Test alert');
      
      let data = monitor.getDashboardData();
      expect(data.alerts).toHaveLength(1);
      expect(data.alerts[0].id).toBe(alertId);
      
      monitor.resolveAlert(alertId);
      
      data = monitor.getDashboardData();
      expect(data.alerts).toHaveLength(0);
    });

    test('should get time series data', () => {
      // Record multiple metrics
      for (let i = 0; i < 5; i++) {
        monitor.recordMetric({
          type: 'tool',
          name: 'test.tool',
          value: 100 + i * 10,
          unit: 'ms',
        });
      }

      const timeseries = monitor.getTimeSeries('tool', 'test.tool', 60000);
      expect(timeseries).toHaveLength(5);
      expect(timeseries[0].value).toBe(100);
      expect(timeseries[4].value).toBe(140);
    });

    test('should calculate aggregated metrics', () => {
      // Record metrics
      for (let i = 0; i < 3; i++) {
        monitor.recordMetric({
          type: 'task',
          name: 'task.complete',
          value: 1,
          unit: 'count',
        });
        
        monitor.recordMetric({
          type: 'tool',
          name: 'test.tool',
          value: 100,
          unit: 'ms',
        });
      }

      const aggregated = monitor.getAggregatedMetrics(1000);
      expect(aggregated.length).toBeGreaterThan(0);
      
      const latest = aggregated[aggregated.length - 1];
      expect(latest.avgResponseTime).toBe(100);
      expect(latest.throughput).toBe(3);
    });

    test('should export and import metrics', () => {
      // Add some data
      monitor.recordMetric({
        type: 'tool',
        name: 'test.tool',
        value: 100,
        unit: 'ms',
      });
      
      monitor.updateAgentMetrics('agent1', {
        agentName: 'Test Agent',
        tasksCompleted: 5,
      });

      // Export
      const exported = monitor.exportMetrics();
      expect(exported).toBeTruthy();

      // Create new monitor and import
      const newMonitor = new PerformanceMonitor();
      newMonitor.importMetrics(exported);

      const data = newMonitor.getDashboardData();
      expect(data.recentMetrics).toHaveLength(1);
      expect(data.agents).toHaveLength(1);

      newMonitor.stop();
    });

    test('should emit events on updates', (done) => {
      monitor.once('metric:recorded', (metric) => {
        expect(metric.name).toBe('test.event');
        done();
      });

      monitor.recordMetric({
        type: 'tool',
        name: 'test.event',
        value: 100,
        unit: 'ms',
      });
    });

    test('should check tool alerts on high error rate', () => {
      const alertListener = jest.fn();
      monitor.on('alert:created', alertListener);

      // Create many failures to trigger alert
      for (let i = 0; i < 10; i++) {
        monitor.updateToolMetrics('test.tool', {
          success: i < 2, // Only first 2 succeed
          executionTime: 100,
        });
      }

      expect(alertListener).toHaveBeenCalled();
      const alert = alertListener.mock.calls[0][0];
      expect(alert.type).toBe('warning');
      expect(alert.message).toContain('High error rate');
    });
  });

  describe('DashboardServer', () => {
    let monitor: PerformanceMonitor;
    let server: DashboardServer;

    beforeEach(() => {
      monitor = new PerformanceMonitor();
      server = new DashboardServer(monitor, {
        port: 0, // Random port
      });
    });

    afterEach(async () => {
      await server.stop();
      monitor.stop();
    });

    test('should start and stop server', async () => {
      await expect(server.start()).resolves.toBeUndefined();
      await expect(server.stop()).resolves.toBeUndefined();
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

    test('should start monitoring dashboard', async () => {
      const tool = coordinator.tools.get('start_monitoring_dashboard');
      expect(tool).toBeDefined();

      const result = await tool?.execute({ port: 0 });
      expect(result.success).toBe(true);
      expect(result.url).toContain('http://localhost:');

      // Stop dashboard
      const stopTool = coordinator.tools.get('stop_monitoring_dashboard');
      await stopTool?.execute({});
    });

    test('should get performance metrics', async () => {
      const tool = coordinator.tools.get('get_performance_metrics');
      expect(tool).toBeDefined();

      const result = await tool?.execute({});
      expect(result.success).toBe(true);
      expect(result.metrics).toBeDefined();
      expect(result.metrics.agents).toBeGreaterThanOrEqual(0);
      expect(result.topTools).toBeDefined();
      expect(result.alerts).toBeDefined();
    });

    test('should get performance timeseries', async () => {
      const tool = coordinator.tools.get('get_performance_timeseries');
      
      const result = await tool?.execute({
        metricType: 'tool',
        metricName: 'test.metric',
        duration: 60000,
      });

      expect(result.success).toBe(true);
      expect(result.metricType).toBe('tool');
      expect(result.timeseries).toBeDefined();
    });

    test('should create and resolve alerts', async () => {
      const createTool = coordinator.tools.get('create_performance_alert');
      const resolveTool = coordinator.tools.get('resolve_performance_alert');

      // Create alert
      const createResult = await createTool?.execute({
        type: 'warning',
        source: 'test',
        message: 'Test alert',
      });

      expect(createResult.success).toBe(true);
      expect(createResult.alertId).toBeDefined();

      // Resolve alert
      const resolveResult = await resolveTool?.execute({
        alertId: createResult.alertId,
      });

      expect(resolveResult.success).toBe(true);
    });

    test('should export performance metrics', async () => {
      const tool = coordinator.tools.get('export_performance_metrics');
      
      const result = await tool?.execute({});
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.size).toBeGreaterThan(0);
    });

    test('should toggle monitoring', async () => {
      const tool = coordinator.tools.get('toggle_monitoring');
      
      // Disable monitoring
      let result = await tool?.execute({ enabled: false });
      expect(result.success).toBe(true);
      expect(result.monitoringEnabled).toBe(false);

      // Enable monitoring
      result = await tool?.execute({ enabled: true });
      expect(result.success).toBe(true);
      expect(result.monitoringEnabled).toBe(true);
    });
  });
});