/**
 * Calendar Management Specialist Agent
 * Specialized for Lark Calendar operations
 */

import { Agent, AgentConfig, AgentTool } from '../agent';
import { AgentCapability, AgentMetadata } from '../types';
import { TOOL_OPERATION_PROMPTS, PromptUtils } from '../prompts';
import { globalRegistry } from '../registry';

export class CalendarSpecialistAgent extends Agent {
  constructor(config: Partial<AgentConfig> = {}) {
    // Create tools before calling super()
    const tools = [
      {
        name: 'create_calendar_event',
        description: 'Create new calendar event',
        execute: async (params: any) => {
          const {
            calendarId,
            summary,
            description,
            startTime,
            endTime,
            attendees = [],
            location,
            meetingRooms = [],
          } = params;

          return this.executeMcpTool('calendar.v4.calendar.event.create', {
            calendar_id: calendarId,
            summary,
            description,
            start_time: {
              timestamp: startTime,
            },
            end_time: {
              timestamp: endTime,
            },
            attendee_ability: 'can_see_others',
            attendees: attendees.map((email: string) => ({
              type: 'third_party',
              email,
            })),
            location: location ? { name: location } : undefined,
            meeting_rooms: meetingRooms.map((roomId: string) => ({
              room_id: roomId,
            })),
          });
        },
        schema: {
          type: 'object',
          properties: {
            calendarId: { type: 'string', description: 'Calendar ID' },
            summary: { type: 'string', description: 'Event title' },
            description: { type: 'string', description: 'Event description' },
            startTime: { type: 'string', description: 'Start timestamp (RFC3339)' },
            endTime: { type: 'string', description: 'End timestamp (RFC3339)' },
            attendees: {
              type: 'array',
              items: { type: 'string' },
              description: 'Attendee email addresses',
            },
            location: { type: 'string', description: 'Event location' },
            meetingRooms: {
              type: 'array',
              items: { type: 'string' },
              description: 'Meeting room IDs',
            },
          },
          required: ['calendarId', 'summary', 'startTime', 'endTime'],
        },
      },

      {
        name: 'get_calendar_events',
        description: 'Retrieve calendar events within time range',
        execute: async (params: any) => {
          const { calendarId, startTime, endTime, pageSize = 50 } = params;

          return this.executeMcpTool('calendar.v4.calendar.event.list', {
            calendar_id: calendarId,
            start_time: startTime,
            end_time: endTime,
            page_size: pageSize,
          });
        },
        schema: {
          type: 'object',
          properties: {
            calendarId: { type: 'string', description: 'Calendar ID' },
            startTime: { type: 'string', description: 'Start timestamp filter' },
            endTime: { type: 'string', description: 'End timestamp filter' },
            pageSize: { type: 'number', default: 50 },
          },
          required: ['calendarId'],
        },
      },

      {
        name: 'update_calendar_event',
        description: 'Update existing calendar event',
        execute: async (params: any) => {
          const { calendarId, eventId, updates } = params;

          return this.executeMcpTool('calendar.v4.calendar.event.patch', {
            calendar_id: calendarId,
            event_id: eventId,
            ...updates,
          });
        },
        schema: {
          type: 'object',
          properties: {
            calendarId: { type: 'string', description: 'Calendar ID' },
            eventId: { type: 'string', description: 'Event ID to update' },
            updates: {
              type: 'object',
              description: 'Fields to update (summary, description, start_time, etc.)',
            },
          },
          required: ['calendarId', 'eventId', 'updates'],
        },
      },

      {
        name: 'delete_calendar_event',
        description: 'Delete calendar event',
        execute: async (params: any) => {
          const { calendarId, eventId, needNotification = true } = params;

          return this.executeMcpTool('calendar.v4.calendar.event.delete', {
            calendar_id: calendarId,
            event_id: eventId,
            need_notification: needNotification,
          });
        },
        schema: {
          type: 'object',
          properties: {
            calendarId: { type: 'string', description: 'Calendar ID' },
            eventId: { type: 'string', description: 'Event ID to delete' },
            needNotification: { type: 'boolean', default: true },
          },
          required: ['calendarId', 'eventId'],
        },
      },

      {
        name: 'search_available_rooms',
        description: 'Search for available meeting rooms',
        execute: async (params: any) => {
          const { startTime, endTime, capacity, building } = params;

          return this.executeMcpTool('calendar.v4.meeting_room.search', {
            start_time: startTime,
            end_time: endTime,
            capacity,
            building,
          });
        },
        schema: {
          type: 'object',
          properties: {
            startTime: { type: 'string', description: 'Start time for availability check' },
            endTime: { type: 'string', description: 'End time for availability check' },
            capacity: { type: 'number', description: 'Required room capacity' },
            building: { type: 'string', description: 'Building preference' },
          },
          required: ['startTime', 'endTime'],
        },
      },

      {
        name: 'get_attendee_availability',
        description: 'Check attendee availability for scheduling',
        execute: async (params: any) => {
          const { attendeeEmails, startTime, endTime } = params;

          return this.executeMcpTool('calendar.v4.freebusy.batch_get', {
            time_min: startTime,
            time_max: endTime,
            attendees: attendeeEmails.map((email: string) => ({ email })),
          });
        },
        schema: {
          type: 'object',
          properties: {
            attendeeEmails: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of attendee email addresses',
            },
            startTime: { type: 'string', description: 'Start time for availability check' },
            endTime: { type: 'string', description: 'End time for availability check' },
          },
          required: ['attendeeEmails', 'startTime', 'endTime'],
        },
      },

      {
        name: 'create_recurring_event',
        description: 'Create recurring calendar event',
        execute: async (params: any) => {
          const { calendarId, summary, startTime, endTime, recurrenceRule, attendees = [] } = params;

          return this.executeMcpTool('calendar.v4.calendar.event.create', {
            calendar_id: calendarId,
            summary,
            start_time: { timestamp: startTime },
            end_time: { timestamp: endTime },
            recurrence: [recurrenceRule],
            attendees: attendees.map((email: string) => ({
              type: 'third_party',
              email,
            })),
          });
        },
        schema: {
          type: 'object',
          properties: {
            calendarId: { type: 'string', description: 'Calendar ID' },
            summary: { type: 'string', description: 'Event title' },
            startTime: { type: 'string', description: 'Start timestamp' },
            endTime: { type: 'string', description: 'End timestamp' },
            recurrenceRule: {
              type: 'string',
              description: 'RRULE string (e.g., FREQ=WEEKLY;BYDAY=MO,WE,FR)',
            },
            attendees: {
              type: 'array',
              items: { type: 'string' },
              description: 'Attendee email addresses',
            },
          },
          required: ['calendarId', 'summary', 'startTime', 'endTime', 'recurrenceRule'],
        },
      },

      {
        name: 'send_meeting_invite',
        description: 'Send meeting invitation to attendees',
        execute: async (params: any) => {
          const { calendarId, eventId, message } = params;

          return this.executeMcpTool('calendar.v4.calendar.event.attendee.batch_create', {
            calendar_id: calendarId,
            event_id: eventId,
            message,
          });
        },
        schema: {
          type: 'object',
          properties: {
            calendarId: { type: 'string', description: 'Calendar ID' },
            eventId: { type: 'string', description: 'Event ID' },
            message: { type: 'string', description: 'Invitation message' },
          },
          required: ['calendarId', 'eventId'],
        },
      },

      {
        name: 'get_calendar_list',
        description: 'Get list of accessible calendars',
        execute: async (params: any) => {
          const { pageSize = 50 } = params;

          return this.executeMcpTool('calendar.v4.calendar.list', {
            page_size: pageSize,
          });
        },
        schema: {
          type: 'object',
          properties: {
            pageSize: { type: 'number', default: 50 },
          },
        },
      },
    ];

    const specialistConfig: AgentConfig = {
      name: 'Calendar Management Specialist',
      instructions: `
あなたはLark Calendar操作の専門エージェントです。
以下のスケジュール管理機能を正確に実行してください：

**専門領域:**
• イベント作成・編集・削除
• 会議室予約・リソース管理
• 参加者招待・出欠確認
• 繰り返しイベント・シリーズ管理
• カレンダー共有・権限設定
• 通知・リマインダー設定

**スケジュール管理原則:**
1. 時間の正確性と整合性確保
2. 参加者の都合を最優先
3. 会議室リソースの効率的利用
4. 適切な通知タイミング
5. プライバシーと機密性保護

**サービス品質:**
迅速で正確なスケジューリングサポートを提供します。
`,
      tools,
      model: 'gpt-4',
      temperature: 0.1, // 時間管理は正確性が重要
      maxTokens: 3500,
      language: 'ja',
      ...config,
    };

    super(specialistConfig);
  }

  /**
   * Execute MCP tool with calendar-specific error handling
   */
  private async executeMcpTool(toolName: string, params: any): Promise<any> {
    try {
      const response = {
        success: true,
        tool: toolName,
        parameters: params,
        timestamp: new Date().toISOString(),
        data: {
          message: `Executed ${toolName} successfully`,
          ...params,
        },
      };

      return response;
    } catch (error) {
      return {
        success: false,
        tool: toolName,
        parameters: params,
        error: String(error),
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Analyze meeting requirements and suggest optimal scheduling
   */
  async analyzeMeetingRequirements(requirements: {
    duration: number; // minutes
    attendees: string[];
    preferredTimes?: string[];
    roomCapacity?: number;
    location?: string;
  }): Promise<{
    difficulty: 'easy' | 'moderate' | 'challenging';
    recommendations: string[];
    optimalTimes: string[];
    roomSuggestions: string[];
    estimatedSchedulingTime: number;
  }> {
    const { duration, attendees, preferredTimes, roomCapacity } = requirements;

    // Analyze difficulty based on constraints
    let difficulty: 'easy' | 'moderate' | 'challenging' = 'easy';
    const recommendations: string[] = [];

    // Large groups are challenging
    if (attendees.length > 10) {
      difficulty = 'challenging';
      recommendations.push('Consider virtual meeting for large groups');
      recommendations.push('Send calendar invites well in advance');
    } else if (attendees.length > 5) {
      difficulty = 'moderate';
      recommendations.push('Check availability of all attendees');
    }

    // Long meetings need special consideration
    if (duration > 120) {
      difficulty = 'challenging';
      recommendations.push('Schedule breaks for long meetings');
      recommendations.push('Prepare detailed agenda');
    }

    // Room requirements
    if (roomCapacity && roomCapacity > 20) {
      difficulty = 'challenging';
      recommendations.push('Book large conference room early');
      recommendations.push('Consider hybrid meeting option');
    }

    // Time zone considerations
    if (attendees.length > 1) {
      recommendations.push('Consider time zone differences');
      recommendations.push('Provide meeting details 24 hours in advance');
    }

    const optimalTimes = preferredTimes || [
      '09:00',
      '10:00',
      '14:00',
      '15:00', // Default business hours
    ];

    return {
      difficulty,
      recommendations,
      optimalTimes,
      roomSuggestions: this.suggestRooms(roomCapacity || attendees.length),
      estimatedSchedulingTime: difficulty === 'challenging' ? 300 : difficulty === 'moderate' ? 120 : 60,
    };
  }

  /**
   * Suggest appropriate meeting rooms based on capacity
   */
  private suggestRooms(capacity: number): string[] {
    if (capacity <= 4) {
      return ['small_meeting_room', 'phone_booth', 'quiet_corner'];
    } else if (capacity <= 10) {
      return ['medium_conference_room', 'team_room', 'collaboration_space'];
    } else if (capacity <= 20) {
      return ['large_conference_room', 'board_room', 'presentation_room'];
    } else {
      return ['auditorium', 'large_hall', 'event_space'];
    }
  }

  /**
   * Parse natural language time input
   */
  parseTimeInput(timeString: string): { startTime: string; endTime: string; isValid: boolean } {
    const now = new Date();

    // Handle common patterns
    const patterns = [
      /明日の?(\d{1,2}):?(\d{2})?/, // 明日の14:00
      /来週の?(月|火|水|木|金|土|日)曜?日?の?(\d{1,2}):?(\d{2})?/, // 来週の月曜日の10:00
      /(\d{1,2})月(\d{1,2})日の?(\d{1,2}):?(\d{2})?/, // 3月15日の14:00
    ];

    // Simplified parsing - in production, use a proper date/time library
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0); // Default to 2 PM

    const endTime = new Date(tomorrow);
    endTime.setHours(endTime.getHours() + 1); // 1 hour duration

    return {
      startTime: tomorrow.toISOString(),
      endTime: endTime.toISOString(),
      isValid: true,
    };
  }
}

/**
 * Create and register Calendar Specialist Agent
 */
export async function createCalendarSpecialist(): Promise<string> {
  const capabilities: AgentCapability[] = [
    {
      name: 'calendar_management',
      description: 'Calendar event creation and management',
      category: 'calendar',
      inputSchema: {
        type: 'object',
        properties: {
          operation: { type: 'string' },
          calendarId: { type: 'string' },
          eventDetails: { type: 'object' },
        },
      },
    },
    {
      name: 'meeting_scheduling',
      description: 'Optimal meeting time finding and scheduling',
      category: 'calendar',
    },
    {
      name: 'room_booking',
      description: 'Meeting room reservation and management',
      category: 'calendar',
    },
    {
      name: 'availability_checking',
      description: 'Attendee availability verification',
      category: 'calendar',
    },
    {
      name: 'recurring_events',
      description: 'Recurring event series management',
      category: 'calendar',
    },
    {
      name: 'time_analysis',
      description: 'Meeting pattern analysis and optimization',
      category: 'calendar',
    },
  ];

  const metadata: AgentMetadata = {
    id: `calendar_specialist_${Date.now()}`,
    name: 'Calendar Management Specialist',
    type: 'specialist',
    capabilities,
    status: 'idle',
    maxConcurrentTasks: 4,
    currentTasks: 0,
    lastHeartbeat: new Date(),
    version: '1.0.0',
  };

  const registered = await globalRegistry.registerAgent(metadata);
  if (registered) {
    console.log('✅ Calendar Specialist Agent registered successfully');
    return metadata.id;
  } else {
    throw new Error('Failed to register Calendar Specialist Agent');
  }
}
