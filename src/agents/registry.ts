/**
 * Agent Registry and Discovery System
 * Manages agent lifecycle, capabilities, and service discovery
 */

import { EventEmitter } from 'events';
import { AgentMetadata, AgentCapability, AgentType } from './types';
import { globalCommBus } from './communication';

export interface AgentRegistryConfig {
  maxAgentsPerType?: number;
  healthCheckInterval?: number;
  registrationTimeout?: number;
}

export class AgentRegistry extends EventEmitter {
  private agents: Map<string, AgentMetadata> = new Map();
  private agentsByType: Map<AgentType, Set<string>> = new Map();
  private agentsByCapability: Map<string, Set<string>> = new Map();
  private healthCheckInterval: NodeJS.Timeout;
  private config: Required<AgentRegistryConfig>;

  constructor(config: AgentRegistryConfig = {}) {
    super();
    
    this.config = {
      maxAgentsPerType: config.maxAgentsPerType || 10,
      healthCheckInterval: config.healthCheckInterval || 30000,
      registrationTimeout: config.registrationTimeout || 60000,
      ...config
    };

    // Initialize agent type maps
    const agentTypes: AgentType[] = ['coordinator', 'specialist', 'bridge', 'monitor', 'recovery'];
    agentTypes.forEach(type => {
      this.agentsByType.set(type, new Set());
    });

    // Start health check monitoring
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  /**
   * Register a new agent in the system
   */
  async registerAgent(metadata: AgentMetadata): Promise<boolean> {
    try {
      // Validate agent metadata
      if (!this.validateAgentMetadata(metadata)) {
        throw new Error('Invalid agent metadata');
      }

      // Check if agent type has reached maximum capacity
      const typeAgents = this.agentsByType.get(metadata.type) || new Set();
      if (typeAgents.size >= this.config.maxAgentsPerType) {
        throw new Error(`Maximum agents reached for type: ${metadata.type}`);
      }

      // Check for duplicate agent ID
      if (this.agents.has(metadata.id)) {
        throw new Error(`Agent with ID ${metadata.id} already registered`);
      }

      // Register agent
      const agentData: AgentMetadata = {
        ...metadata,
        status: 'idle',
        currentTasks: 0,
        lastHeartbeat: new Date()
      };

      this.agents.set(metadata.id, agentData);
      typeAgents.add(metadata.id);
      this.agentsByType.set(metadata.type, typeAgents);

      // Index by capabilities
      metadata.capabilities.forEach(capability => {
        if (!this.agentsByCapability.has(capability.name)) {
          this.agentsByCapability.set(capability.name, new Set());
        }
        this.agentsByCapability.get(capability.name)!.add(metadata.id);
      });

      // Register with communication bus
      globalCommBus.registerAgent(agentData);

      this.emit('agent_registered', agentData);
      
      console.log(`✅ Agent registered: ${metadata.name} (${metadata.id})`);
      return true;

    } catch (error) {
      console.error(`❌ Failed to register agent ${metadata.id}:`, error);
      return false;
    }
  }

  /**
   * Unregister an agent from the system
   */
  async unregisterAgent(agentId: string): Promise<boolean> {
    try {
      const agent = this.agents.get(agentId);
      if (!agent) {
        return false;
      }

      // Remove from type index
      const typeAgents = this.agentsByType.get(agent.type);
      if (typeAgents) {
        typeAgents.delete(agentId);
      }

      // Remove from capability index
      agent.capabilities.forEach(capability => {
        const capabilityAgents = this.agentsByCapability.get(capability.name);
        if (capabilityAgents) {
          capabilityAgents.delete(agentId);
          if (capabilityAgents.size === 0) {
            this.agentsByCapability.delete(capability.name);
          }
        }
      });

      // Remove from main registry
      this.agents.delete(agentId);

      // Unregister from communication bus
      globalCommBus.unregisterAgent(agentId);

      this.emit('agent_unregistered', agent);
      
      console.log(`🗑️ Agent unregistered: ${agent.name} (${agentId})`);
      return true;

    } catch (error) {
      console.error(`❌ Failed to unregister agent ${agentId}:`, error);
      return false;
    }
  }

  /**
   * Discover agents by capability
   */
  discoverAgents(capability: string): AgentMetadata[] {
    const agentIds = this.agentsByCapability.get(capability) || new Set();
    return Array.from(agentIds)
      .map(id => this.agents.get(id))
      .filter((agent): agent is AgentMetadata => 
        agent !== undefined && agent.status !== 'offline'
      );
  }

  /**
   * Discover agents by type
   */
  discoverAgentsByType(type: AgentType): AgentMetadata[] {
    const agentIds = this.agentsByType.get(type) || new Set();
    return Array.from(agentIds)
      .map(id => this.agents.get(id))
      .filter((agent): agent is AgentMetadata => 
        agent !== undefined && agent.status !== 'offline'
      );
  }

  /**
   * Find best available agent for a task
   */
  findBestAgent(
    capability: string, 
    options: {
      preferredType?: AgentType;
      maxLoad?: number;
      excludeAgents?: string[];
    } = {}
  ): AgentMetadata | null {
    const candidates = this.discoverAgents(capability)
      .filter(agent => {
        // Filter by type preference
        if (options.preferredType && agent.type !== options.preferredType) {
          return false;
        }
        
        // Filter by max load
        const loadRatio = agent.currentTasks / agent.maxConcurrentTasks;
        if (options.maxLoad && loadRatio > options.maxLoad) {
          return false;
        }
        
        // Exclude specific agents
        if (options.excludeAgents?.includes(agent.id)) {
          return false;
        }
        
        // Must have capacity for new tasks
        return agent.currentTasks < agent.maxConcurrentTasks;
      });

    if (candidates.length === 0) {
      return null;
    }

    // Sort by load (ascending) and prioritize coordinators
    candidates.sort((a, b) => {
      const loadA = a.currentTasks / a.maxConcurrentTasks;
      const loadB = b.currentTasks / b.maxConcurrentTasks;
      
      // Prefer coordinators for complex tasks
      if (a.type === 'coordinator' && b.type !== 'coordinator') return -1;
      if (b.type === 'coordinator' && a.type !== 'coordinator') return 1;
      
      return loadA - loadB;
    });

    return candidates[0];
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): AgentMetadata | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): AgentMetadata[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents statistics
   */
  getStatistics() {
    const stats = {
      totalAgents: this.agents.size,
      activeAgents: 0,
      busyAgents: 0,
      offlineAgents: 0,
      byType: {} as Record<AgentType, number>,
      byCapability: {} as Record<string, number>,
      totalTasks: 0
    };

    // Initialize type counters
    const agentTypes: AgentType[] = ['coordinator', 'specialist', 'bridge', 'monitor', 'recovery'];
    agentTypes.forEach(type => {
      stats.byType[type] = 0;
    });

    // Calculate statistics
    for (const agent of this.agents.values()) {
      stats.byType[agent.type]++;
      stats.totalTasks += agent.currentTasks;

      switch (agent.status) {
        case 'idle':
          stats.activeAgents++;
          break;
        case 'busy':
          stats.busyAgents++;
          break;
        case 'offline':
          stats.offlineAgents++;
          break;
      }
    }

    // Capability statistics
    for (const [capability, agentIds] of this.agentsByCapability.entries()) {
      stats.byCapability[capability] = agentIds.size;
    }

    return stats;
  }

  /**
   * Update agent heartbeat
   */
  updateHeartbeat(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    agent.lastHeartbeat = new Date();
    if (agent.status === 'offline') {
      agent.status = 'idle';
    }

    globalCommBus.updateHeartbeat(agentId);
    return true;
  }

  /**
   * Update agent task count
   */
  updateAgentTasks(agentId: string, taskCount: number): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    agent.currentTasks = Math.max(0, taskCount);
    agent.status = taskCount > 0 ? 'busy' : 'idle';

    globalCommBus.updateAgentTaskCount(agentId, taskCount);
    return true;
  }

  /**
   * Validate agent metadata
   */
  private validateAgentMetadata(metadata: AgentMetadata): boolean {
    if (!metadata.id || !metadata.name || !metadata.type) {
      return false;
    }

    if (!metadata.capabilities || metadata.capabilities.length === 0) {
      return false;
    }

    if (metadata.maxConcurrentTasks <= 0) {
      return false;
    }

    return true;
  }

  /**
   * Perform health checks on all agents
   */
  private performHealthChecks(): void {
    const now = new Date();
    const timeout = this.config.registrationTimeout;
    let offlineCount = 0;

    for (const [agentId, agent] of this.agents.entries()) {
      const timeSinceHeartbeat = now.getTime() - agent.lastHeartbeat.getTime();
      
      if (timeSinceHeartbeat > timeout && agent.status !== 'offline') {
        agent.status = 'offline';
        agent.currentTasks = 0;
        offlineCount++;
        
        this.emit('agent_offline', agent);
        console.warn(`⚠️ Agent ${agent.name} (${agentId}) marked as offline`);
      }
    }

    if (offlineCount > 0) {
      console.log(`🏥 Health check completed: ${offlineCount} agents marked offline`);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.removeAllListeners();
    this.agents.clear();
    this.agentsByType.clear();
    this.agentsByCapability.clear();
  }
}

// Global registry instance
export const globalRegistry = new AgentRegistry();

// Export agent creation helpers
export const AgentFactory = {
  /**
   * Create coordinator agent metadata
   */
  createCoordinator(name: string, capabilities: AgentCapability[]): AgentMetadata {
    return {
      id: `coordinator_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      type: 'coordinator',
      capabilities,
      status: 'idle',
      maxConcurrentTasks: 5,
      currentTasks: 0,
      lastHeartbeat: new Date(),
      version: '1.0.0'
    };
  },

  /**
   * Create specialist agent metadata
   */
  createSpecialist(name: string, category: string, capabilities: AgentCapability[]): AgentMetadata {
    return {
      id: `specialist_${category}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      type: 'specialist',
      capabilities,
      status: 'idle',
      maxConcurrentTasks: 3,
      currentTasks: 0,
      lastHeartbeat: new Date(),
      version: '1.0.0'
    };
  },

  /**
   * Create bridge agent metadata
   */
  createBridge(name: string, capabilities: AgentCapability[]): AgentMetadata {
    return {
      id: `bridge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      type: 'bridge',
      capabilities,
      status: 'idle',
      maxConcurrentTasks: 2,
      currentTasks: 0,
      lastHeartbeat: new Date(),
      version: '1.0.0'
    };
  }
};