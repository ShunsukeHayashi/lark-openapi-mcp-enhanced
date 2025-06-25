/**
 * Lark Calendar Synchronization
 * Handles bi-directional sync between Lark Calendar and CRM
 */

const { LarkAPI } = require('../../../src/utils/lark-api');
const { EventEmitter } = require('events');

class LarkCalendarSync extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.larkAPI = new LarkAPI(config.lark);
    this.syncInterval = config.syncInterval || 5 * 60 * 1000; // 5 minutes default
    this.lastSyncTime = null;
    this.syncTimer = null;
  }

  /**
   * Start calendar synchronization
   */
  async startSync() {
    console.log('Starting Lark Calendar synchronization...');
    
    // Initial sync
    await this.performSync();
    
    // Set up periodic sync
    this.syncTimer = setInterval(() => {
      this.performSync().catch(error => {
        console.error('Sync error:', error);
        this.emit('syncError', error);
      });
    }, this.syncInterval);
    
    // Set up webhook listener for real-time updates
    await this.setupWebhookListener();
  }

  /**
   * Stop synchronization
   */
  stopSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    console.log('Lark Calendar synchronization stopped');
  }

  /**
   * Perform synchronization
   */
  async performSync() {
    try {
      console.log('Performing calendar sync...');
      const startTime = Date.now();
      
      // Get events from Lark Calendar
      const calendarEvents = await this.getCalendarEvents();
      
      // Get CRM activities
      const crmActivities = await this.getCRMActivities();
      
      // Sync calendar events to CRM
      const syncToCRM = await this.syncEventsToCRM(calendarEvents, crmActivities);
      
      // Sync CRM activities to calendar
      const syncToCalendar = await this.syncActivitiesToCalendar(crmActivities, calendarEvents);
      
      // Update last sync time
      this.lastSyncTime = new Date();
      
      const syncStats = {
        duration: Date.now() - startTime,
        eventsFromCalendar: calendarEvents.length,
        activitiesFromCRM: crmActivities.length,
        syncedToCRM: syncToCRM.created + syncToCRM.updated,
        syncedToCalendar: syncToCalendar.created + syncToCalendar.updated,
        errors: syncToCRM.errors + syncToCalendar.errors
      };
      
      console.log('Sync completed:', syncStats);
      this.emit('syncCompleted', syncStats);
      
      return syncStats;
    } catch (error) {
      console.error('Error during sync:', error);
      this.emit('syncError', error);
      throw error;
    }
  }

  /**
   * Get events from Lark Calendar
   */
  async getCalendarEvents() {
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const endTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead
      
      // Get all calendars
      const calendars = await this.larkAPI.getCalendars();
      
      const allEvents = [];
      
      // Get events from each calendar
      for (const calendar of calendars) {
        const events = await this.larkAPI.getCalendarEvents({
          calendarId: calendar.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString()
        });
        
        allEvents.push(...events.map(event => ({
          ...event,
          calendarId: calendar.id,
          calendarName: calendar.name
        })));
      }
      
      return allEvents;
    } catch (error) {
      console.error('Error getting calendar events:', error);
      throw error;
    }
  }

  /**
   * Get CRM activities that should be synced to calendar
   */
  async getCRMActivities() {
    try {
      const filter = {
        type: { in: ['Meeting', 'Call', 'Demo', 'Training'] },
        status: { ne: 'Cancelled' },
        activity_date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      };
      
      const activities = await this.larkAPI.searchRecords('activities', { filter });
      
      return activities;
    } catch (error) {
      console.error('Error getting CRM activities:', error);
      throw error;
    }
  }

  /**
   * Sync calendar events to CRM activities
   */
  async syncEventsToCRM(calendarEvents, existingActivities) {
    const results = {
      created: 0,
      updated: 0,
      errors: 0
    };
    
    // Create a map of existing activities by calendar event ID
    const activityMap = new Map();
    existingActivities.forEach(activity => {
      if (activity.calendar_event_id) {
        activityMap.set(activity.calendar_event_id, activity);
      }
    });
    
    for (const event of calendarEvents) {
      try {
        // Skip if event is not relevant to CRM
        if (!this.isRelevantEvent(event)) {
          continue;
        }
        
        const existingActivity = activityMap.get(event.id);
        
        if (existingActivity) {
          // Update existing activity if changed
          if (this.hasEventChanged(event, existingActivity)) {
            await this.updateActivityFromEvent(existingActivity.id, event);
            results.updated++;
          }
        } else {
          // Create new activity
          await this.createActivityFromEvent(event);
          results.created++;
        }
      } catch (error) {
        console.error(`Error syncing event ${event.id}:`, error);
        results.errors++;
      }
    }
    
    return results;
  }

  /**
   * Sync CRM activities to calendar events
   */
  async syncActivitiesToCalendar(activities, existingEvents) {
    const results = {
      created: 0,
      updated: 0,
      errors: 0
    };
    
    // Create a map of existing events by activity ID
    const eventMap = new Map();
    existingEvents.forEach(event => {
      if (event.metadata && event.metadata.activityId) {
        eventMap.set(event.metadata.activityId, event);
      }
    });
    
    for (const activity of activities) {
      try {
        // Skip if activity already has a calendar event
        if (activity.calendar_event_id && eventMap.has(activity.id)) {
          const existingEvent = eventMap.get(activity.id);
          // Update if changed
          if (this.hasActivityChanged(activity, existingEvent)) {
            await this.updateEventFromActivity(existingEvent.id, activity);
            results.updated++;
          }
        } else if (!activity.calendar_event_id) {
          // Create new calendar event
          const event = await this.createEventFromActivity(activity);
          if (event) {
            // Update activity with calendar event ID
            await this.larkAPI.updateRecord('activities', activity.id, {
              calendar_event_id: event.id
            });
            results.created++;
          }
        }
      } catch (error) {
        console.error(`Error syncing activity ${activity.id}:`, error);
        results.errors++;
      }
    }
    
    return results;
  }

  /**
   * Check if calendar event is relevant to CRM
   */
  isRelevantEvent(event) {
    // Skip all-day events
    if (event.isAllDay) return false;
    
    // Skip personal events
    const personalKeywords = ['personal', '個人', 'private', 'プライベート'];
    const title = (event.summary || '').toLowerCase();
    if (personalKeywords.some(keyword => title.includes(keyword))) {
      return false;
    }
    
    // Check if event has attendees (likely a meeting)
    if (!event.attendees || event.attendees.length < 2) {
      return false;
    }
    
    // Check if event has business-related keywords
    const businessKeywords = ['meeting', 'ミーティング', '商談', 'demo', 'デモ', 'call', '打ち合わせ'];
    return businessKeywords.some(keyword => title.includes(keyword));
  }

  /**
   * Create CRM activity from calendar event
   */
  async createActivityFromEvent(event) {
    try {
      // Extract customer information from attendees
      const customer = await this.findCustomerFromAttendees(event.attendees);
      
      // Extract deal information from event title/description
      const deal = await this.findDealFromEvent(event);
      
      const activityData = {
        type: this.getActivityTypeFromEvent(event),
        subject: event.summary,
        description: event.description || '',
        activity_date: event.start.dateTime || event.start.date,
        end_date: event.end.dateTime || event.end.date,
        location: event.location || '',
        customer_id: customer ? customer.id : null,
        deal_id: deal ? deal.id : null,
        calendar_event_id: event.id,
        calendar_name: event.calendarName,
        attendees: JSON.stringify(event.attendees),
        status: this.getActivityStatusFromEvent(event),
        created_from: 'calendar_sync',
        sync_metadata: JSON.stringify({
          calendarId: event.calendarId,
          eventId: event.id,
          lastModified: event.updated
        })
      };
      
      const activity = await this.larkAPI.createRecord('activities', activityData);
      
      // Create tasks for preparation if needed
      if (customer && this.shouldCreatePreparationTasks(event)) {
        await this.createPreparationTasks(activity, customer, event);
      }
      
      return activity;
    } catch (error) {
      console.error('Error creating activity from event:', error);
      throw error;
    }
  }

  /**
   * Create calendar event from CRM activity
   */
  async createEventFromActivity(activity) {
    try {
      // Get customer and deal information
      const customer = activity.customer_id ? 
        await this.larkAPI.getRecord('customers', activity.customer_id) : null;
      const deal = activity.deal_id ? 
        await this.larkAPI.getRecord('deals', activity.deal_id) : null;
      
      // Build attendee list
      const attendees = await this.buildAttendeeList(activity, customer);
      
      const eventData = {
        summary: activity.subject,
        description: this.buildEventDescription(activity, customer, deal),
        start: {
          dateTime: activity.activity_date,
          timeZone: this.config.timezone || 'Asia/Tokyo'
        },
        end: {
          dateTime: activity.end_date || this.calculateEndTime(activity.activity_date, activity.duration),
          timeZone: this.config.timezone || 'Asia/Tokyo'
        },
        attendees: attendees,
        location: activity.location || '',
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 15 },
            { method: 'email', minutes: 60 }
          ]
        },
        metadata: {
          activityId: activity.id,
          customerId: customer ? customer.id : null,
          dealId: deal ? deal.id : null
        }
      };
      
      // Select appropriate calendar
      const calendarId = await this.selectCalendar(activity);
      
      // Create event
      const event = await this.larkAPI.createCalendarEvent(calendarId, eventData);
      
      return event;
    } catch (error) {
      console.error('Error creating event from activity:', error);
      throw error;
    }
  }

  /**
   * Find customer from event attendees
   */
  async findCustomerFromAttendees(attendees) {
    if (!attendees || attendees.length === 0) return null;
    
    // Extract external attendee emails
    const externalEmails = attendees
      .filter(a => !a.email.includes(this.config.companyDomain))
      .map(a => a.email);
    
    for (const email of externalEmails) {
      const customers = await this.larkAPI.searchRecords('customers', {
        filter: { email: email }
      });
      
      if (customers.length > 0) {
        return customers[0];
      }
    }
    
    // If no existing customer found, create from primary external attendee
    if (externalEmails.length > 0) {
      const primaryAttendee = attendees.find(a => a.email === externalEmails[0]);
      const newCustomer = await this.larkAPI.createRecord('customers', {
        name: primaryAttendee.displayName || primaryAttendee.email,
        email: primaryAttendee.email,
        source: 'Calendar',
        status: 'Lead',
        created_date: new Date().toISOString()
      });
      
      return newCustomer;
    }
    
    return null;
  }

  /**
   * Build event description with CRM context
   */
  buildEventDescription(activity, customer, deal) {
    let description = activity.description || '';
    
    description += '\n\n--- CRM情報 ---\n';
    
    if (customer) {
      description += `\n顧客: ${customer.name}`;
      description += `\n会社: ${customer.company || '-'}`;
      description += `\nメール: ${customer.email}`;
    }
    
    if (deal) {
      description += `\n\n案件: ${deal.title}`;
      description += `\nステージ: ${deal.stage}`;
      description += `\n金額: ¥${deal.amount?.toLocaleString() || '-'}`;
    }
    
    if (activity.agenda) {
      description += `\n\nアジェンダ:\n${activity.agenda}`;
    }
    
    return description;
  }

  /**
   * Build attendee list for calendar event
   */
  async buildAttendeeList(activity, customer) {
    const attendees = [];
    
    // Add customer as attendee
    if (customer && customer.email) {
      attendees.push({
        email: customer.email,
        displayName: customer.name,
        responseStatus: 'needsAction'
      });
    }
    
    // Add activity owner
    if (activity.owner_id) {
      const owner = await this.larkAPI.getUser(activity.owner_id);
      if (owner) {
        attendees.push({
          email: owner.email,
          displayName: owner.name,
          responseStatus: 'accepted',
          organizer: true
        });
      }
    }
    
    // Add additional attendees from activity
    if (activity.attendees) {
      const additionalAttendees = JSON.parse(activity.attendees);
      attendees.push(...additionalAttendees);
    }
    
    return attendees;
  }

  /**
   * Select appropriate calendar for activity
   */
  async selectCalendar(activity) {
    // Logic to select calendar based on activity type, owner, etc.
    if (activity.calendar_id) {
      return activity.calendar_id;
    }
    
    // Default to primary calendar
    const calendars = await this.larkAPI.getCalendars();
    return calendars[0].id;
  }

  /**
   * Check if event has changed
   */
  hasEventChanged(event, activity) {
    return (
      event.summary !== activity.subject ||
      event.start.dateTime !== activity.activity_date ||
      event.end.dateTime !== activity.end_date ||
      event.location !== activity.location ||
      event.updated > activity.last_synced
    );
  }

  /**
   * Check if activity has changed
   */
  hasActivityChanged(activity, event) {
    return (
      activity.subject !== event.summary ||
      activity.activity_date !== event.start.dateTime ||
      activity.end_date !== event.end.dateTime ||
      activity.location !== event.location ||
      new Date(activity.updated_at) > new Date(event.updated)
    );
  }

  /**
   * Update activity from calendar event
   */
  async updateActivityFromEvent(activityId, event) {
    const updates = {
      subject: event.summary,
      description: event.description,
      activity_date: event.start.dateTime || event.start.date,
      end_date: event.end.dateTime || event.end.date,
      location: event.location || '',
      attendees: JSON.stringify(event.attendees),
      last_synced: new Date().toISOString()
    };
    
    await this.larkAPI.updateRecord('activities', activityId, updates);
  }

  /**
   * Update calendar event from activity
   */
  async updateEventFromActivity(eventId, activity) {
    const updates = {
      summary: activity.subject,
      description: this.buildEventDescription(activity),
      start: {
        dateTime: activity.activity_date,
        timeZone: this.config.timezone || 'Asia/Tokyo'
      },
      end: {
        dateTime: activity.end_date,
        timeZone: this.config.timezone || 'Asia/Tokyo'
      },
      location: activity.location || ''
    };
    
    await this.larkAPI.updateCalendarEvent(eventId, updates);
  }

  /**
   * Get activity type from calendar event
   */
  getActivityTypeFromEvent(event) {
    const title = (event.summary || '').toLowerCase();
    
    if (title.includes('demo') || title.includes('デモ')) return 'Demo';
    if (title.includes('call') || title.includes('電話')) return 'Call';
    if (title.includes('training') || title.includes('トレーニング')) return 'Training';
    
    return 'Meeting';
  }

  /**
   * Get activity status from event
   */
  getActivityStatusFromEvent(event) {
    const now = new Date();
    const eventStart = new Date(event.start.dateTime || event.start.date);
    
    if (eventStart > now) return 'Scheduled';
    if (event.status === 'cancelled') return 'Cancelled';
    
    return 'Completed';
  }

  /**
   * Calculate end time if not provided
   */
  calculateEndTime(startTime, duration = 60) {
    const start = new Date(startTime);
    return new Date(start.getTime() + duration * 60 * 1000).toISOString();
  }

  /**
   * Should create preparation tasks
   */
  shouldCreatePreparationTasks(event) {
    // Create tasks for important meetings
    const importantKeywords = ['商談', 'demo', 'デモ', 'proposal', '提案'];
    const title = (event.summary || '').toLowerCase();
    
    return importantKeywords.some(keyword => title.includes(keyword));
  }

  /**
   * Create preparation tasks for meeting
   */
  async createPreparationTasks(activity, customer, event) {
    const tasks = [
      {
        title: `${customer.name}様の情報を確認`,
        description: '過去の活動履歴、案件状況、メモを確認する',
        due_date: new Date(new Date(event.start.dateTime).getTime() - 24 * 60 * 60 * 1000), // 1 day before
        priority: 'Medium',
        activity_id: activity.id,
        customer_id: customer.id
      },
      {
        title: 'ミーティング資料の準備',
        description: 'プレゼンテーション、提案書、デモ環境の準備',
        due_date: new Date(new Date(event.start.dateTime).getTime() - 4 * 60 * 60 * 1000), // 4 hours before
        priority: 'High',
        activity_id: activity.id,
        customer_id: customer.id
      }
    ];
    
    for (const task of tasks) {
      await this.larkAPI.createRecord('tasks', task);
    }
  }

  /**
   * Find deal from event title/description
   */
  async findDealFromEvent(event) {
    // Extract deal references from event
    const content = `${event.summary} ${event.description || ''}`;
    const dealPatterns = [
      /案件[#:\s]*([\w\-]+)/,
      /deal[#:\s]*([\w\-]+)/i,
      /プロジェクト[#:\s]*([\w\-]+)/
    ];
    
    for (const pattern of dealPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        const deals = await this.larkAPI.searchRecords('deals', {
          filter: {
            or: [
              { deal_number: match[1] },
              { title: { contains: match[1] } }
            ]
          }
        });
        
        if (deals.length > 0) {
          return deals[0];
        }
      }
    }
    
    return null;
  }

  /**
   * Set up webhook listener for real-time calendar updates
   */
  async setupWebhookListener() {
    // Implementation depends on your webhook infrastructure
    console.log('Setting up calendar webhook listener...');
    
    // Register webhook with Lark
    const webhook = await this.larkAPI.registerWebhook({
      url: `${this.config.webhookBaseUrl}/calendar-updates`,
      events: [
        'calendar.event.created',
        'calendar.event.updated',
        'calendar.event.deleted'
      ]
    });
    
    return webhook;
  }

  /**
   * Handle webhook event
   */
  async handleWebhookEvent(event) {
    console.log('Received calendar webhook:', event.type);
    
    switch (event.type) {
      case 'calendar.event.created':
        await this.handleEventCreated(event.data);
        break;
      case 'calendar.event.updated':
        await this.handleEventUpdated(event.data);
        break;
      case 'calendar.event.deleted':
        await this.handleEventDeleted(event.data);
        break;
    }
  }

  /**
   * Handle event created webhook
   */
  async handleEventCreated(eventData) {
    if (this.isRelevantEvent(eventData)) {
      await this.createActivityFromEvent(eventData);
    }
  }

  /**
   * Handle event updated webhook
   */
  async handleEventUpdated(eventData) {
    const activities = await this.larkAPI.searchRecords('activities', {
      filter: { calendar_event_id: eventData.id }
    });
    
    if (activities.length > 0) {
      await this.updateActivityFromEvent(activities[0].id, eventData);
    }
  }

  /**
   * Handle event deleted webhook
   */
  async handleEventDeleted(eventData) {
    const activities = await this.larkAPI.searchRecords('activities', {
      filter: { calendar_event_id: eventData.id }
    });
    
    if (activities.length > 0) {
      await this.larkAPI.updateRecord('activities', activities[0].id, {
        status: 'Cancelled',
        cancelled_at: new Date().toISOString()
      });
    }
  }
}

module.exports = { LarkCalendarSync };