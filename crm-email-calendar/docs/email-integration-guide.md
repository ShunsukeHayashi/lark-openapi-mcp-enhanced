# Email Integration Guide

## Overview

The YouTube CRM Email Integration system provides comprehensive email management capabilities, including inbound email processing, outbound automation, tracking, and analytics.

## Table of Contents

1. [Setup and Configuration](#setup-and-configuration)
2. [Inbound Email Processing](#inbound-email-processing)
3. [Outbound Email Automation](#outbound-email-automation)
4. [Email Tracking](#email-tracking)
5. [Email Templates](#email-templates)
6. [Analytics and Reporting](#analytics-and-reporting)
7. [Best Practices](#best-practices)

## Setup and Configuration

### 1. Email Server Configuration

Configure your email servers in the `.env` file:

```env
# IMAP Settings (for receiving emails)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASSWORD=your-app-password

# SMTP Settings (for sending emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 2. Email Tracking Setup

To enable email tracking, configure your tracking domain:

```env
TRACKING_DOMAIN=track.yourdomain.com
TRACKING_SECRET=generate-a-secure-secret-key
```

Set up DNS records for your tracking domain:
- A record pointing to your tracking server
- SPF record to authorize email sending

### 3. Initialize the Email System

```javascript
const { EmailProcessor } = require('./email-integration/inbound/email-processor');
const { EmailSender } = require('./email-integration/outbound/email-sender');
const config = require('./integration/config/email-calendar-config');

// Initialize email processor
const emailProcessor = new EmailProcessor(config);
await emailProcessor.connect();
await emailProcessor.startMonitoring();

// Initialize email sender
const emailSender = new EmailSender(config);
```

## Inbound Email Processing

### Features

1. **Automatic Email Capture**
   - Monitors inbox for new emails
   - Real-time processing via IMAP IDLE
   - Batch processing for efficiency

2. **AI-Powered Analysis**
   - Sentiment analysis (positive/negative/neutral)
   - Urgency detection (high/medium/low)
   - Topic extraction
   - Action item identification
   - Deal and YouTube video reference detection

3. **CRM Integration**
   - Automatic customer creation/matching
   - Deal linking based on content
   - Activity record creation
   - Attachment processing and storage

### Usage Example

```javascript
// Process incoming emails
await emailProcessor.processIncomingEmails();

// Handle specific email
const activity = await emailProcessor.processEmail(emailUid);
console.log(`Created activity: ${activity.id}`);
```

### Email Analysis Results

The AI analyzer provides detailed insights:

```javascript
{
  sentiment: 'positive',
  urgency: 'high',
  topics: ['proposal', 'pricing', 'implementation'],
  actionItems: [
    {
      title: 'Send updated proposal',
      description: 'Customer requested revised pricing',
      priority: 'high',
      dueDate: '2024-01-20T10:00:00Z'
    }
  ],
  dealReferences: ['DEAL-2024-001'],
  youtubeReferences: [
    {
      videoId: 'abc123',
      url: 'https://www.youtube.com/watch?v=abc123',
      context: 'Customer mentioned interest in demo video'
    }
  ],
  summary: 'Customer is interested in moving forward with the proposal...',
  language: 'ja',
  keyPhrases: ['価格調整', '実装期間', 'デモ動画']
}
```

## Outbound Email Automation

### Template-Based Sending

Create and use email templates:

```javascript
// Send templated email
const result = await emailSender.sendEmail({
  to: 'customer@example.com',
  templateId: 'deal_follow_up',
  variables: {
    meetingDate: '2024-01-15',
    discussionPoints: ['Pricing', 'Timeline', 'Support'],
    nextSteps: [
      { action: 'Send proposal', deadline: '2024-01-20' },
      { action: 'Schedule demo', deadline: '2024-01-22' }
    ],
    youtubeDemoVideo: 'https://youtube.com/watch?v=demo123'
  },
  customerId: 'cust_123',
  dealId: 'deal_456',
  scheduleTime: new Date('2024-01-16T10:00:00Z')
});
```

### Email Sequences

Automate multi-step email campaigns:

```javascript
// Start email sequence
await emailSender.sendEmailSequence({
  customerId: 'cust_123',
  sequenceId: 'new_lead_nurture',
  startingStep: 1
});
```

### A/B Testing

Test different email variations:

```javascript
// Create A/B test
const abTest = await abTestManager.createTest({
  name: 'Subject Line Test',
  variants: [
    { templateId: 'welcome_v1', weight: 50 },
    { templateId: 'welcome_v2', weight: 50 }
  ],
  metric: 'open_rate'
});

// Send with A/B test
await emailSender.sendEmail({
  to: 'customer@example.com',
  templateId: 'welcome_new_customer',
  abTestId: abTest.id,
  customerId: 'cust_123'
});
```

## Email Tracking

### Tracking Features

1. **Open Tracking**
   - Invisible pixel insertion
   - Open time recording
   - Device/client detection

2. **Link Click Tracking**
   - All links automatically tracked
   - Click-through rates
   - Link popularity analysis

3. **YouTube Video Tracking**
   - Special handling for YouTube links
   - Video engagement tracking
   - View duration monitoring

### Tracking Implementation

```javascript
// Generate tracking pixel
const pixel = emailTracker.generateTrackingPixel(emailId, recipientEmail);

// Generate tracked link
const trackedUrl = emailTracker.generateTrackedLink(
  'https://example.com/resource',
  emailId,
  recipientEmail,
  'resource_link'
);

// Generate YouTube tracking link
const youtubeUrl = emailTracker.generateYouTubeTrackingLink(
  'video123',
  emailId,
  recipientEmail
);
```

### Processing Tracking Events

```javascript
// Handle tracking webhook
app.post('/webhooks/tracking/:type/:token', async (req, res) => {
  const { type, token } = req.params;
  const event = await emailTracker.processTrackingEvent(type, token, {
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });
  
  res.redirect(event.originalUrl || '/');
});
```

## Email Templates

### Template Structure

Templates use Handlebars syntax for dynamic content:

```json
{
  "id": "deal_follow_up",
  "name": "商談フォローアップ",
  "subject": "{{deal.title}}に関するフォローアップ - {{customer.name}}様",
  "html": "<html>...</html>",
  "variables": [
    "customer.name",
    "deal.title",
    "meetingDate",
    "discussionPoints",
    "nextSteps"
  ]
}
```

### Creating Custom Templates

```javascript
const template = {
  id: 'custom_template',
  name: 'Custom Email Template',
  subject: '{{customer.name}}様への特別なお知らせ',
  html: `
    <h2>{{customer.name}}様</h2>
    <p>{{message}}</p>
    {{#if youtubeVideo}}
    <div>
      <a href="{{youtubeVideo}}">動画を見る</a>
    </div>
    {{/if}}
  `,
  variables: ['customer.name', 'message', 'youtubeVideo']
};

await templateEngine.saveTemplate(template);
```

## Analytics and Reporting

### Email Performance Metrics

Track key performance indicators:

```javascript
const metrics = await emailAnalytics.getMetrics({
  dateRange: {
    start: '2024-01-01',
    end: '2024-01-31'
  },
  metrics: [
    'sent_count',
    'open_rate',
    'click_rate',
    'reply_rate',
    'bounce_rate'
  ],
  groupBy: 'template'
});
```

### Engagement Scoring

Calculate customer engagement:

```javascript
const engagementScore = await emailTracker.calculateEngagementScore(
  emailId,
  recipientEmail
);

// Score breakdown:
// - Email open: 1 point
// - Link click: 3 points
// - YouTube video click: 5 points
// - Reply: 10 points
// - Forward: 8 points
```

### Campaign Analytics

```javascript
const campaignReport = await emailAnalytics.getCampaignReport(campaignId);
console.log(`
  Campaign: ${campaignReport.name}
  Sent: ${campaignReport.sentCount}
  Open Rate: ${campaignReport.openRate}%
  Click Rate: ${campaignReport.clickRate}%
  Conversion Rate: ${campaignReport.conversionRate}%
  ROI: ${campaignReport.roi}
`);
```

## Best Practices

### 1. Email Deliverability

- **Authentication**: Set up SPF, DKIM, and DMARC records
- **Reputation**: Monitor sender reputation and bounce rates
- **Content**: Avoid spam trigger words and maintain good text/image ratio
- **List Hygiene**: Regularly clean email lists and honor unsubscribes

### 2. Personalization

- Use customer data for relevant content
- Segment audiences based on behavior
- Time emails based on recipient preferences
- Include relevant YouTube content

### 3. Compliance

- Include unsubscribe links in all emails
- Respect user preferences and consent
- Maintain audit logs for compliance
- Follow GDPR/CAN-SPAM regulations

### 4. Performance Optimization

- Batch process emails for efficiency
- Use queues for reliable delivery
- Implement retry logic for failures
- Monitor and optimize send times

### 5. Integration Best Practices

- Sync email activities with CRM in real-time
- Create follow-up tasks automatically
- Link emails to relevant deals and customers
- Track YouTube video engagement from emails

## Troubleshooting

### Common Issues

1. **Emails not being received**
   - Check IMAP credentials
   - Verify firewall settings
   - Check email folder/label configuration

2. **Emails not sending**
   - Verify SMTP credentials
   - Check sending limits
   - Review bounce messages

3. **Tracking not working**
   - Verify tracking domain DNS
   - Check webhook endpoints
   - Review tracking pixel implementation

4. **Poor deliverability**
   - Check sender reputation
   - Review email content
   - Verify authentication records

### Debug Mode

Enable debug logging:

```javascript
const emailProcessor = new EmailProcessor({
  ...config,
  logging: {
    level: 'debug',
    includeRawEmails: true
  }
});
```

## API Reference

### EmailProcessor Methods

- `connect()`: Connect to IMAP server
- `processIncomingEmails()`: Process new emails
- `processEmail(uid)`: Process specific email
- `startMonitoring()`: Start real-time monitoring
- `disconnect()`: Close connection

### EmailSender Methods

- `sendEmail(options)`: Send single email
- `sendEmailSequence(options)`: Start email sequence
- `scheduleEmail(options)`: Schedule future email
- `cancelScheduledEmail(id)`: Cancel scheduled email

### EmailTracker Methods

- `generateTrackingPixel(emailId, recipient)`: Create tracking pixel
- `generateTrackedLink(url, emailId, recipient, linkId)`: Create tracked link
- `processTrackingEvent(type, token, data)`: Process tracking event
- `calculateEngagementScore(emailId, recipient)`: Calculate engagement