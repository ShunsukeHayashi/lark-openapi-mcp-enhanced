/**
 * Agent Specialization for Different Domains
 * Domain-specific agents based on Lark MCP tool categories
 */

export * from './base-specialist';
export * from './messaging-specialist';
export * from './document-specialist';
export * from './calendar-specialist';
export * from './coordinator-agent';

// Export all specialist types
export const SPECIALIST_DOMAINS = {
  BASE: 'base_operations',
  MESSAGING: 'messaging',
  DOCUMENT: 'document_management', 
  CALENDAR: 'calendar_management',
  SYSTEM: 'system_management',
  COORDINATOR: 'workflow_coordination'
} as const;

export type SpecialistDomain = typeof SPECIALIST_DOMAINS[keyof typeof SPECIALIST_DOMAINS];