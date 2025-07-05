/**
 * Enhanced Agent Specialization with AI-Powered Orchestration
 * Advanced domain-specific agents with multilingual embedding support
 */

export * from './base-specialist';
export * from './coordinator-agent';
export * from './gas-interpreter-agent';
export * from './genesis-enhanced-specialist';

// Enhanced orchestration
export * from '../orchestration/enhanced-orchestrator';
export * from '../embedding/multilingual-e5-client';

// Temporarily disabled agents (need implementation fixes)
// export * from './messaging-specialist';
// export * from './document-specialist';
// export * from './calendar-specialist';

// Export all specialist types
export const SPECIALIST_DOMAINS = {
  BASE: 'base_operations',
  MESSAGING: 'messaging',
  DOCUMENT: 'document_management',
  CALENDAR: 'calendar_management',
  SYSTEM: 'system_management',
  COORDINATOR: 'workflow_coordination',
  GAS_INTERPRETER: 'gas_automation',
  GENESIS_ENHANCED: 'ai_powered_generation',
  ORCHESTRATOR: 'intelligent_orchestration',
} as const;

export type SpecialistDomain = (typeof SPECIALIST_DOMAINS)[keyof typeof SPECIALIST_DOMAINS];

// Enhanced capabilities with AI features
export const AI_CAPABILITIES = {
  MULTILINGUAL_ANALYSIS: 'multilingual_e5_analysis',
  SEMANTIC_MATCHING: 'semantic_similarity_matching',
  INTELLIGENT_GENERATION: 'ai_powered_generation',
  PROGRESSIVE_CREATION: 'progressive_approval_loops',
  PERFORMANCE_OPTIMIZATION: 'automatic_optimization',
  ADAPTIVE_ORCHESTRATION: 'adaptive_load_balancing',
} as const;
