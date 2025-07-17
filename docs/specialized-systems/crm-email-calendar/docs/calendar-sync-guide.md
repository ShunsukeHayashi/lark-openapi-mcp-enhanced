# Calendar Synchronization Guide

## Overview

The Calendar Synchronization system provides seamless integration between Lark Calendar, external calendars (Google, Outlook), and the CRM system, with intelligent scheduling capabilities powered by AI.

## Table of Contents

1. [Setup and Configuration](#setup-and-configuration)
2. [Lark Calendar Integration](#lark-calendar-integration)
3. [External Calendar Support](#external-calendar-support)
4. [Smart Scheduling](#smart-scheduling)
5. [Meeting Intelligence](#meeting-intelligence)
6. [Conflict Resolution](#conflict-resolution)
7. [Best Practices](#best-practices)

## Setup and Configuration

### 1. Calendar Configuration

Configure calendar settings in `.env`:

```env
# Default timezone
DEFAULT_TIMEZONE=Asia/Tokyo

# Lark Calendar
LARK_APP_ID=your-app-id
LARK_APP_SECRET=your-app-secret

# Google Calendar (Optional)
GOOGLE_CALENDAR_ENABLED=true
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Outlook Calendar (Optional)
OUTLOOK_CALENDAR_ENABLED=true
OUTLOOK_CLIENT_ID=your-client-id
OUTLOOK_CLIENT_SECRET=your-client-secret
```

### 2. Initialize Calendar Sync

```javascript
const { LarkCalendarSync } = require('./calendar-sync/lark/lark-calendar-sync');
const { SmartScheduler } = require('./calendar-sync/scheduling/smart-scheduler');
const config = require('./integration/config/email-calendar-config');

// Initialize Lark Calendar sync
const calendarSync = new LarkCalendarSync(config);
await calendarSync.startSync();

// Initialize Smart Scheduler
const scheduler = new SmartScheduler(config);
```

## Lark Calendar Integration

### Bi-directional Synchronization

The system maintains real-time synchronization between Lark Calendar and CRM:

```javascript
// Manual sync trigger
const syncStats = await calendarSync.performSync();
console.log(`
  Synced to CRM: ${syncStats.syncedToCRM}
  Synced to Calendar: ${syncStats.syncedToCalendar}
  Duration: ${syncStats.duration}ms
`);
```

### Event Mapping

Calendar events are automatically mapped to CRM activities:

| Calendar Event | CRM Activity Type | Auto-Actions |
|----------------|-------------------|--------------|
| Meeting with customers | Meeting | Create prep tasks, link to deals |
| Demo scheduled | Demo | Prepare demo environment |
| Training session | Training | Create materials checklist |
| Sales call | Call | Load customer history |

### Creating Calendar Events from CRM

```javascript
// Create meeting from CRM activity
const activity = {
  type: 'Meeting',
  subject: '商談: 新規プロジェクト提案',
  customer_id: 'cust_123',
  deal_id: 'deal_456',
  activity_date: '2024-01-20T14:00:00Z',
  duration: 60,
  location: '会議室A',
  agenda: [
    'プロジェクト概要説明',
    '予算と timeline',
    'YouTube動画マーケティング戦略'
  ]
};

const event = await calendarSync.createEventFromActivity(activity);
```

### Webhook Integration

Real-time updates via webhooks:

```javascript
// Handle calendar webhook events
app.post('/webhooks/calendar/updates', async (req, res) => {
  const event = req.body;
  await calendarSync.handleWebhookEvent(event);
  res.status(200).send('OK');
});
```

## External Calendar Support

### Google Calendar Integration

```javascript
const { GoogleCalendarSync } = require('./calendar-sync/external/google-calendar');

// Initialize Google Calendar sync
const googleSync = new GoogleCalendarSync({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET
});

// Authorize user
const authUrl = googleSync.generateAuthUrl();
// Redirect user to authUrl

// Handle callback
const tokens = await googleSync.handleCallback(authorizationCode);

// Sync events
await googleSync.syncEvents(tokens);
```

### Outlook Calendar Integration

```javascript
const { OutlookCalendarSync } = require('./calendar-sync/external/outlook-calendar');

// Initialize Outlook sync
const outlookSync = new OutlookCalendarSync({
  clientId: process.env.OUTLOOK_CLIENT_ID,
  clientSecret: process.env.OUTLOOK_CLIENT_SECRET
});

// Similar auth flow as Google
```

### iCal Feed Support

```javascript
// Subscribe to external iCal feeds
await calendarSync.subscribeToICalFeed({
  url: 'https://example.com/calendar.ics',
  name: 'External Events',
  refreshInterval: 3600000 // 1 hour
});
```

## Smart Scheduling

### Finding Optimal Meeting Times

The AI-powered scheduler considers multiple factors:

```javascript
const result = await scheduler.findOptimalMeetingTime({
  participants: [
    { id: 'user1', email: 'user1@company.com', timezone: 'Asia/Tokyo' },
    { id: 'cust1', email: 'customer@example.com', timezone: 'America/New_York' }
  ],
  duration: 60, // minutes
  preferredTimeRange: {
    start: '2024-01-20T00:00:00Z',
    end: '2024-01-27T00:00:00Z'
  },
  meetingType: 'Demo',
  customerId: 'cust_123',
  urgency: 'normal',
  constraints: {
    minAdvanceHours: 24,
    maxDaysAhead: 7,
    preferredDays: [2, 3, 4], // Tue, Wed, Thu
    bufferMinutes: 15
  }
});

// Get recommendations
result.recommendations.forEach(slot => {
  console.log(`
    Time: ${slot.start} - ${slot.end}
    Score: ${slot.score}
    Reasoning: ${slot.reasoning}
  `);
});
```

### Scheduling Factors

The scheduler evaluates:

1. **Time of Day Optimization**
   - Morning productivity peaks (10-12)
   - Afternoon focus times (14-16)
   - Post-lunch energy dips (13-14)

2. **Day of Week Preferences**
   - Tuesday-Thursday preferred
   - Monday/Friday less optimal
   - Weekend avoidance

3. **Customer History Analysis**
   - Previous meeting times
   - Response patterns
   - Timezone considerations

4. **Meeting Type Optimization**
   - Demos: Mid-morning or mid-afternoon
   - Training: Morning when fresh
   - Reviews: Late afternoon

5. **Travel Time Calculation**
   - Buffer between locations
   - Transit time estimation
   - Remote vs in-person

### Batch Scheduling

Schedule multiple meetings efficiently:

```javascript
const meetings = [
  { customerId: 'cust_1', type: 'Demo', duration: 60 },
  { customerId: 'cust_2', type: 'Review', duration: 30 },
  { customerId: 'cust_3', type: 'Training', duration: 120 }
];

const schedule = await scheduler.batchSchedule({
  meetings,
  dateRange: {
    start: '2024-01-20',
    end: '2024-01-26'
  },
  optimizer: 'minimize_travel'
});
```

## Meeting Intelligence

### Pre-Meeting Automation

Automatic preparation tasks:

```javascript
// Meeting preparation triggered 24 hours before
const meetingPrep = {
  customerSummary: {
    name: '株式会社Example',
    lastInteraction: '2024-01-10',
    dealStage: 'Proposal',
    keyContacts: [...],
    preferences: {...}
  },
  activityHistory: [...],
  recommendedContent: [
    {
      type: 'youtube',
      title: 'Product Demo Video',
      url: 'https://youtube.com/watch?v=...',
      relevance: 'Customer interested in this feature'
    }
  ],
  talkingPoints: [
    'Follow up on pricing discussion',
    'Address implementation timeline concerns',
    'Show new YouTube integration features'
  ],
  documentsToReview: [...]
};
```

### Meeting Templates

Create meeting agendas automatically:

```javascript
const agenda = await meetingIntelligence.generateAgenda({
  meetingType: 'Demo',
  customer: customer,
  deal: deal,
  duration: 60,
  previousMeetings: [...],
  includeYouTubeDemo: true
});

// Generated agenda:
{
  sections: [
    { title: 'Introduction', duration: 5, points: [...] },
    { title: 'Product Demo', duration: 30, points: [...] },
    { title: 'YouTube Integration Demo', duration: 15, points: [...] },
    { title: 'Q&A and Next Steps', duration: 10, points: [...] }
  ],
  materials: [...],
  preparationTasks: [...]
}
```

### Post-Meeting Automation

Automatic follow-up actions:

```javascript
// After meeting ends
const postMeetingActions = await meetingIntelligence.processPostMeeting({
  meetingId: 'meet_123',
  notes: 'Customer interested in YouTube analytics features...',
  outcomes: ['schedule_demo', 'send_proposal'],
  nextSteps: [
    { action: 'Send proposal', assignee: 'sales_rep', due: '2024-01-22' },
    { action: 'Prepare YouTube demo', assignee: 'tech_team', due: '2024-01-24' }
  ]
});

// Automatically creates:
// - Follow-up tasks
// - Thank you email
// - Next meeting suggestion
// - Activity summary in CRM
```

## Conflict Resolution

### Detecting Conflicts

```javascript
const conflicts = await scheduler.checkForConflicts({
  participants: ['user1', 'user2'],
  proposedTime: {
    start: '2024-01-20T14:00:00Z',
    end: '2024-01-20T15:00:00Z'
  }
});

if (conflicts.length > 0) {
  // Handle conflicts
  const resolutions = await scheduler.suggestConflictResolution(
    conflicts,
    proposedMeeting
  );
}
```

### Resolution Strategies

1. **Priority-Based Resolution**
   ```javascript
   const priority = await scheduler.calculateMeetingPriority({
     attendees: meeting.attendees,
     dealValue: deal.amount,
     customerTier: customer.tier,
     meetingType: meeting.type
   });
   ```

2. **Alternative Time Suggestions**
   ```javascript
   const alternatives = await scheduler.findAlternativeTimes({
     originalMeeting: meeting,
     searchWindow: 48, // hours
     maxSuggestions: 5
   });
   ```

3. **Smart Rescheduling**
   ```javascript
   await scheduler.rescheduleConflictingMeetings({
     newHighPriorityMeeting: meeting,
     strategy: 'minimize_disruption'
   });
   ```

## Best Practices

### 1. Calendar Hygiene

- **Accurate Time Zones**: Always specify timezones
- **Buffer Times**: Include preparation and travel time
- **Clear Titles**: Use descriptive meeting titles
- **Complete Information**: Include location, agenda, attendees

### 2. Synchronization

- **Regular Sync**: Enable automatic 5-minute sync
- **Webhook Priority**: Use webhooks for real-time updates
- **Conflict Prevention**: Check availability before creating events
- **Error Handling**: Implement retry logic for sync failures

### 3. Meeting Optimization

- **Batch Similar Meetings**: Group by type or location
- **Respect Preferences**: Honor customer time preferences
- **Energy Management**: Avoid back-to-back intense meetings
- **Preparation Time**: Schedule prep time for important meetings

### 4. Integration Patterns

```javascript
// Good: Check availability first
const availability = await scheduler.checkAvailability(participants, timeRange);
if (availability.allAvailable) {
  await calendarSync.createEvent(eventData);
}

// Good: Include CRM context
const event = {
  ...baseEventData,
  metadata: {
    customerId: customer.id,
    dealId: deal.id,
    activityId: activity.id
  }
};

// Good: Handle timezone properly
const localTime = moment.tz(time, participant.timezone);
const utcTime = localTime.utc();
```

### 5. Performance Optimization

- **Batch Operations**: Process multiple events together
- **Caching**: Cache frequently accessed calendar data
- **Pagination**: Handle large event lists with pagination
- **Selective Sync**: Only sync relevant calendars

## Troubleshooting

### Common Issues

1. **Events Not Syncing**
   - Check API credentials
   - Verify calendar permissions
   - Review sync filters
   - Check webhook configuration

2. **Timezone Mismatches**
   - Ensure all times include timezone
   - Use UTC for storage
   - Convert for display

3. **Duplicate Events**
   - Check sync identifiers
   - Implement idempotency
   - Review sync frequency

4. **Performance Issues**
   - Enable caching
   - Optimize sync queries
   - Use incremental sync

### Debug Tools

```javascript
// Enable debug logging
const calendarSync = new LarkCalendarSync({
  ...config,
  debug: true,
  logLevel: 'verbose'
});

// Test specific sync
await calendarSync.testSync({
  dryRun: true,
  calendars: ['primary'],
  dateRange: { days: 7 }
});

// Validate event data
const validation = await calendarSync.validateEvent(eventData);
if (!validation.valid) {
  console.error('Invalid event:', validation.errors);
}
```

## API Reference

### LarkCalendarSync Methods

- `startSync()`: Begin automatic synchronization
- `stopSync()`: Stop synchronization
- `performSync()`: Manual sync trigger
- `createEventFromActivity(activity)`: Create calendar event
- `updateEventFromActivity(id, activity)`: Update event
- `handleWebhookEvent(event)`: Process webhook

### SmartScheduler Methods

- `findOptimalMeetingTime(options)`: Find best meeting times
- `checkForConflicts(meeting)`: Detect scheduling conflicts
- `suggestConflictResolution(conflicts)`: Resolve conflicts
- `batchSchedule(meetings)`: Schedule multiple meetings
- `calculateMeetingPriority(meeting)`: Determine priority

### Meeting Intelligence Methods

- `generateAgenda(options)`: Create meeting agenda
- `prepareForMeeting(meetingId)`: Pre-meeting automation
- `processPostMeeting(data)`: Post-meeting actions
- `analyzeAttendance(meetingId)`: Meeting analytics