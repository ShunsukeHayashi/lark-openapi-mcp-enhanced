/**
 * Agent Communication Protocol Implementation
 * Based on AIstudio structured communication patterns
 */

import { EventEmitter } from 'events';
import {
  AgentMessage,
  AgentMetadata,
  StructuredResponse,
  RESPONSE_DELIMITERS,
  TaskAssignment,
  AgentCommunicationEvent,
} from './types';

export class AgentCommunicationBus extends EventEmitter {
  private agents: Map<string, AgentMetadata> = new Map();
  private messageQueue: Map<string, AgentMessage[]> = new Map();
  private heartbeatInterval: NodeJS.Timeout;

  constructor() {
    super();
    // Start heartbeat monitoring
    this.heartbeatInterval = setInterval(() => this.checkHeartbeats(), 30000);
  }

  /**
   * Register agent in the communication bus
   */
  registerAgent(metadata: AgentMetadata): void {
    this.agents.set(metadata.id, {
      ...metadata,
      status: 'idle',
      currentTasks: 0,
      lastHeartbeat: new Date(),
    });

    this.messageQueue.set(metadata.id, []);

    this.emit('agent_registered', {
      type: 'agent_registered',
      agentId: metadata.id,
      data: metadata,
      timestamp: new Date(),
    } as AgentCommunicationEvent);
  }

  /**
   * Unregister agent from communication bus
   */
  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
    this.messageQueue.delete(agentId);

    this.emit('agent_offline', {
      type: 'agent_offline',
      agentId,
      data: null,
      timestamp: new Date(),
    } as AgentCommunicationEvent);
  }

  /**
   * Send message between agents
   */
  async sendMessage(message: AgentMessage): Promise<boolean> {
    const targetAgent = this.agents.get(message.to);
    if (!targetAgent) {
      console.warn(`Agent ${message.to} not found`);
      return false;
    }

    // Add message to target agent's queue
    const queue = this.messageQueue.get(message.to) || [];
    queue.push(message);
    this.messageQueue.set(message.to, queue);

    this.emit('message_sent', {
      type: 'message_sent',
      agentId: message.from,
      data: message,
      timestamp: new Date(),
    } as AgentCommunicationEvent);

    return true;
  }

  /**
   * Broadcast message to all agents with specific capability
   */
  async broadcastByCapability(fromAgentId: string, capability: string, payload: any): Promise<string[]> {
    const targetAgents = Array.from(this.agents.values()).filter(
      (agent) => agent.id !== fromAgentId && agent.capabilities.some((cap) => cap.name === capability),
    );

    const messages = targetAgents.map((agent) => ({
      id: this.generateMessageId(),
      from: fromAgentId,
      to: agent.id,
      type: 'broadcast' as const,
      payload,
      timestamp: new Date(),
    }));

    const results = await Promise.all(messages.map((message) => this.sendMessage(message)));

    return targetAgents.filter((_, index) => results[index]).map((agent) => agent.id);
  }

  /**
   * Get pending messages for an agent
   */
  getMessages(agentId: string): AgentMessage[] {
    const messages = this.messageQueue.get(agentId) || [];
    this.messageQueue.set(agentId, []); // Clear after retrieval

    messages.forEach((message) => {
      this.emit('message_received', {
        type: 'message_received',
        agentId,
        data: message,
        timestamp: new Date(),
      } as AgentCommunicationEvent);
    });

    return messages;
  }

  /**
   * Find agents by capability
   */
  findAgentsByCapability(capability: string): AgentMetadata[] {
    return Array.from(this.agents.values()).filter(
      (agent) => agent.status !== 'offline' && agent.capabilities.some((cap) => cap.name === capability),
    );
  }

  /**
   * Find best agent for task (load balancing)
   */
  findBestAgentForTask(
    capability: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
  ): AgentMetadata | null {
    const candidates = this.findAgentsByCapability(capability).filter(
      (agent) => agent.currentTasks < agent.maxConcurrentTasks,
    );

    if (candidates.length === 0) return null;

    // Sort by current load and priority handling
    candidates.sort((a, b) => {
      const loadA = a.currentTasks / a.maxConcurrentTasks;
      const loadB = b.currentTasks / b.maxConcurrentTasks;
      return loadA - loadB;
    });

    return candidates[0];
  }

  /**
   * Update agent heartbeat
   */
  updateHeartbeat(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.lastHeartbeat = new Date();
      this.agents.set(agentId, agent);
    }
  }

  /**
   * Update agent task count
   */
  updateAgentTaskCount(agentId: string, taskCount: number): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.currentTasks = Math.max(0, taskCount);
      agent.status = taskCount > 0 ? 'busy' : 'idle';
      this.agents.set(agentId, agent);
    }
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): AgentMetadata[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): AgentMetadata | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Check agent heartbeats and mark offline if needed
   */
  private checkHeartbeats(): void {
    const now = new Date();
    const timeout = 60000; // 1 minute timeout

    for (const [agentId, agent] of this.agents.entries()) {
      if (now.getTime() - agent.lastHeartbeat.getTime() > timeout) {
        agent.status = 'offline';
        this.agents.set(agentId, agent);

        this.emit('agent_offline', {
          type: 'agent_offline',
          agentId,
          data: { reason: 'heartbeat_timeout' },
          timestamp: new Date(),
        } as AgentCommunicationEvent);
      }
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.removeAllListeners();
    this.agents.clear();
    this.messageQueue.clear();
  }
}

/**
 * Parse structured response with delimiter-based extraction
 * Based on AIstudio's parseStructuredDataSafely pattern
 */
export function parseStructuredResponse(responseText: string, maxRetries: number = 3): StructuredResponse | null {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Look for structured response delimiters
      const startIdx = responseText.indexOf(RESPONSE_DELIMITERS.STRUCTURED_START);
      const endIdx = responseText.indexOf(RESPONSE_DELIMITERS.STRUCTURED_END);

      if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
        if (attempt === maxRetries - 1) {
          // Fallback: try to extract JSON from anywhere in the response
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        }
        continue;
      }

      const structuredPart = responseText
        .substring(startIdx + RESPONSE_DELIMITERS.STRUCTURED_START.length, endIdx)
        .trim();

      return JSON.parse(structuredPart);
    } catch (error) {
      if (attempt === maxRetries - 1) {
        console.error('[Agent Communication] Failed to parse structured response:', error);
        return null;
      }

      // Clean up response for retry
      responseText = responseText.replace(/```json\s*|\s*```/g, '').replace(/^[^{]*({.*})[^}]*$/s, '$1');
    }
  }

  return null;
}

/**
 * Parse task assignment from structured response
 */
export function parseTaskAssignment(responseText: string): TaskAssignment | null {
  const startIdx = responseText.indexOf(RESPONSE_DELIMITERS.TASK_ASSIGNMENT_START);
  const endIdx = responseText.indexOf(RESPONSE_DELIMITERS.TASK_ASSIGNMENT_END);

  if (startIdx === -1 || endIdx === -1) return null;

  try {
    const assignmentPart = responseText
      .substring(startIdx + RESPONSE_DELIMITERS.TASK_ASSIGNMENT_START.length, endIdx)
      .trim();

    return JSON.parse(assignmentPart);
  } catch (error) {
    console.error('[Agent Communication] Failed to parse task assignment:', error);
    return null;
  }
}

// Global communication bus instance
export const globalCommBus = new AgentCommunicationBus();
