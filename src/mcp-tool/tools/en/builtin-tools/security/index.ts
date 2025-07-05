/**
 * Security Tools Collection
 * Enhanced security, validation, and audit tools
 */

import { McpTool } from '../../../../types';
import { securityAuditTool } from './security-audit';

// Export all security tools
export const SecurityTools: McpTool[] = [securityAuditTool];

// Export security tool names for presets
export type SecurityToolNames = 'security.builtin.audit';
