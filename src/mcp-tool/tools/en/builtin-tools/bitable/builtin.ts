import { createEmergencyOrderViewTool, searchEmergencyOrdersTool } from './emergency-view';

export const bitableBuiltinTools = [
  createEmergencyOrderViewTool,
  searchEmergencyOrdersTool
];

export type bitableBuiltinToolName = 
  | 'bitable.builtin.createEmergencyOrderView'
  | 'bitable.builtin.searchEmergencyOrders';