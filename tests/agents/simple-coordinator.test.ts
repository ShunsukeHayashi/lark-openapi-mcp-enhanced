/**
 * Simple test for Coordinator Agent
 */

import { CoordinatorAgent } from '../../src/agents/specialists/coordinator-agent';

describe('Simple Coordinator Agent Test', () => {
  test('should create coordinator agent', () => {
    const coordinator = new CoordinatorAgent();
    expect(coordinator).toBeDefined();
    expect(coordinator.name).toBe('Task Coordinator');
  });

  test('should have required tools', () => {
    const coordinator = new CoordinatorAgent();
    expect(coordinator.tools.has('assign_task')).toBe(true);
    expect(coordinator.tools.has('get_task_status')).toBe(true);
    expect(coordinator.tools.has('list_active_tasks')).toBe(true);
  });

  test('should assign task successfully', async () => {
    const coordinator = new CoordinatorAgent();
    const taskId = await coordinator.assignTask('Test task');
    expect(taskId).toMatch(/^task_\d+$/);
  });
});