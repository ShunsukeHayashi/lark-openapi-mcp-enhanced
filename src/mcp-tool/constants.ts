/**
 * Commonly used tools in MCP
 */

import { ToolName } from './tools';

export enum PresetName {
  /**
   * Default preset including IM, Bitable, Doc and Contact tools
   */
  LIGHT = 'preset.light',
  /**
   * Default preset including IM, Bitable, Doc and Contact tools
   */
  DEFAULT = 'preset.default',
  /**
   * IM related tools for chat and message operations
   */
  IM_DEFAULT = 'preset.im.default',
  /**
   * Base preset for base operations
   */
  BASE_DEFAULT = 'preset.base.default',
  /**
   * Base tools with batch operations
   */
  BASE_BATCH = 'preset.base.batch',
  /**
   * Document related tools for content and permission operations
   */
  DOC_DEFAULT = 'preset.doc.default',
  /**
   * Task management related tools
   */
  TASK_DEFAULT = 'preset.task.default',
  /**
   * Calendar event management tools
   */
  CALENDAR_DEFAULT = 'preset.calendar.default',
  /**
   * Genesis AI-powered base generation tools
   */
  GENESIS_DEFAULT = 'preset.genesis.default',
  /**
   * Complete set of all Lark functions
   */
  COMPLETE_ALL = 'preset.complete.all',
}

// Common tool names used across multiple presets
const COMMON_TOOLS = {
  MESSAGE_LIST: 'im.v1.message.list' as const,
  MESSAGE_CREATE: 'im.v1.message.create' as const,
  CHAT_SEARCH: 'im.v1.chat.search' as const,
  USER_BATCH_GET_ID: 'contact.v3.user.batchGetId' as const,
  DOCUMENT_RAW_CONTENT: 'docx.v1.document.rawContent' as const,
  DOCUMENT_IMPORT: 'docx.builtin.import' as const,
  DOCUMENT_SEARCH: 'docx.builtin.search' as const,
  RECORD_SEARCH: 'bitable.v1.appTableRecord.search' as const,
  RECORD_BATCH_CREATE: 'bitable.v1.appTableRecord.batchCreate' as const,
} as const;

export const presetLightToolNames: ToolName[] = [
  COMMON_TOOLS.MESSAGE_LIST,
  COMMON_TOOLS.MESSAGE_CREATE,
  COMMON_TOOLS.CHAT_SEARCH,
  COMMON_TOOLS.USER_BATCH_GET_ID,
  COMMON_TOOLS.DOCUMENT_RAW_CONTENT,
  COMMON_TOOLS.DOCUMENT_IMPORT,
  COMMON_TOOLS.DOCUMENT_SEARCH,
  COMMON_TOOLS.RECORD_SEARCH,
  COMMON_TOOLS.RECORD_BATCH_CREATE,
];

export const presetContactToolNames: ToolName[] = [COMMON_TOOLS.USER_BATCH_GET_ID];

export const presetImToolNames: ToolName[] = [
  'im.v1.chat.create',
  'im.v1.chat.list',
  'im.v1.chatMembers.get',
  COMMON_TOOLS.MESSAGE_CREATE,
  COMMON_TOOLS.MESSAGE_LIST,
];

export const presetBaseCommonToolNames: ToolName[] = [
  'bitable.v1.app.create',
  'bitable.v1.appTable.create',
  'bitable.v1.appTable.list',
  'bitable.v1.appTableField.list',
  COMMON_TOOLS.RECORD_SEARCH,
];

export const presetBaseToolNames: ToolName[] = [
  ...presetBaseCommonToolNames,
  'bitable.v1.appTableRecord.create',
  'bitable.v1.appTableRecord.update',
];

export const presetBaseRecordBatchToolNames: ToolName[] = [
  ...presetBaseCommonToolNames,
  COMMON_TOOLS.RECORD_BATCH_CREATE,
  'bitable.v1.appTableRecord.batchUpdate',
];

export const presetDocToolNames: ToolName[] = [
  COMMON_TOOLS.DOCUMENT_RAW_CONTENT,
  COMMON_TOOLS.DOCUMENT_IMPORT,
  COMMON_TOOLS.DOCUMENT_SEARCH,
  'drive.v1.permissionMember.create',
];

export const presetTaskToolNames: ToolName[] = [
  'task.v2.task.create',
  'task.v2.task.patch',
  'task.v2.task.addMembers',
  'task.v2.task.addReminders',
];

export const presetCalendarToolNames: ToolName[] = [
  'calendar.v4.calendarEvent.create',
  'calendar.v4.calendarEvent.patch',
  'calendar.v4.calendarEvent.get',
  'calendar.v4.freebusy.list',
  'calendar.v4.calendar.primary',
];

export const presetGenesisToolNames: ToolName[] = [
  'genesis.builtin.create_base',
  'genesis.builtin.analyze_requirements',
  'genesis.builtin.generate_er_diagram',
  'genesis.builtin.optimize_base',
  'genesis.builtin.create_view',
  'genesis.builtin.create_dashboard',
  'genesis.builtin.create_automation',
  'genesis.builtin.create_filter_view',
  'genesis.builtin.list_templates',
  ...presetBaseCommonToolNames, // Include base tools for Genesis to work with
  'bitable.v1.appTableView.create', // For creating views
  'bitable.v1.appDashboard.copy', // For copying dashboards
  'bitable.v1.appWorkflow.list', // For listing workflows
  'sheets.v3.spreadsheetSheetFilterView.create', // For creating filter views
];

export const defaultToolNames: ToolName[] = [
  ...presetImToolNames,
  ...presetBaseToolNames,
  ...presetDocToolNames,
  ...presetContactToolNames,
];

export const presetCompleteToolNames: ToolName[] = [
  // Complete function tools
  'complete.user.get_info',
  'complete.user.create',
  'complete.department.create',
  'complete.group.create',
  'complete.approval.create_instance',
  'complete.meeting_room.book',
  'complete.okr.create',
  'complete.hr.create_employee',
  // Include all other presets for comprehensive access
  ...defaultToolNames,
  ...presetGenesisToolNames,
  ...presetTaskToolNames,
  ...presetCalendarToolNames,
];

export const presetTools: Record<PresetName, ToolName[]> = {
  [PresetName.LIGHT]: presetLightToolNames,
  [PresetName.DEFAULT]: defaultToolNames,
  [PresetName.IM_DEFAULT]: presetImToolNames,
  [PresetName.BASE_DEFAULT]: presetBaseToolNames,
  [PresetName.BASE_BATCH]: presetBaseRecordBatchToolNames,
  [PresetName.DOC_DEFAULT]: presetDocToolNames,
  [PresetName.TASK_DEFAULT]: presetTaskToolNames,
  [PresetName.CALENDAR_DEFAULT]: presetCalendarToolNames,
  [PresetName.GENESIS_DEFAULT]: presetGenesisToolNames,
  [PresetName.COMPLETE_ALL]: presetCompleteToolNames,
};
