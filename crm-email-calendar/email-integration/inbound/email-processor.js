/**
 * Email Processor - Inbound Email Processing System
 * Handles incoming emails, analyzes content, and integrates with CRM
 */

const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const { LarkAPI } = require('../../../src/utils/lark-api');
const { AIAnalyzer } = require('./ai-analyzer');
const { EmailTracker } = require('./email-tracker');

class EmailProcessor {
  constructor(config) {
    this.config = config;
    this.larkAPI = new LarkAPI(config.lark);
    this.aiAnalyzer = new AIAnalyzer(config.ai);
    this.emailTracker = new EmailTracker(config.tracking);
    this.client = null;
  }

  /**
   * Initialize IMAP connection
   */
  async connect() {
    this.client = new ImapFlow({
      host: this.config.imap.host,
      port: this.config.imap.port,
      secure: this.config.imap.secure,
      auth: {
        user: this.config.imap.user,
        pass: this.config.imap.password
      }
    });

    await this.client.connect();
    console.log('Connected to IMAP server');
  }

  /**
   * Process incoming emails
   */
  async processIncomingEmails() {
    try {
      await this.client.mailboxOpen('INBOX');
      
      // Search for unprocessed emails
      const messages = await this.client.search({
        seen: false,
        since: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      });

      for (const uid of messages) {
        await this.processEmail(uid);
      }
    } catch (error) {
      console.error('Error processing emails:', error);
      throw error;
    }
  }

  /**
   * Process individual email
   */
  async processEmail(uid) {
    try {
      // Fetch email
      const message = await this.client.fetchOne(uid, {
        source: true,
        flags: true,
        bodyStructure: true
      });

      // Parse email
      const parsed = await simpleParser(message.source);
      
      // Extract email data
      const emailData = {
        messageId: parsed.messageId,
        from: parsed.from.value[0],
        to: parsed.to.value,
        subject: parsed.subject,
        date: parsed.date,
        text: parsed.text,
        html: parsed.html,
        attachments: parsed.attachments
      };

      // AI Analysis
      const analysis = await this.aiAnalyzer.analyzeEmail(emailData);
      
      // Find or create customer
      const customer = await this.findOrCreateCustomer(emailData.from);
      
      // Link to deal if applicable
      const deal = await this.linkToDeal(emailData, analysis);
      
      // Create activity record
      const activity = await this.createActivityRecord({
        emailData,
        analysis,
        customer,
        deal
      });

      // Process attachments
      if (emailData.attachments && emailData.attachments.length > 0) {
        await this.processAttachments(emailData.attachments, activity);
      }

      // Mark email as processed
      await this.client.messageFlagsAdd(uid, ['\\Seen', '\\Flagged']);
      
      // Track email engagement
      await this.emailTracker.trackInboundEmail(emailData, activity);

      console.log(`Processed email: ${emailData.subject}`);
      return activity;
    } catch (error) {
      console.error(`Error processing email ${uid}:`, error);
      throw error;
    }
  }

  /**
   * Find or create customer based on email
   */
  async findOrCreateCustomer(fromData) {
    try {
      // Search for existing customer
      const customers = await this.larkAPI.searchRecords('customers', {
        filter: {
          email: fromData.address
        }
      });

      if (customers.length > 0) {
        return customers[0];
      }

      // Create new customer
      const newCustomer = await this.larkAPI.createRecord('customers', {
        name: fromData.name || fromData.address,
        email: fromData.address,
        source: 'Email',
        status: 'Active',
        created_date: new Date().toISOString()
      });

      return newCustomer;
    } catch (error) {
      console.error('Error finding/creating customer:', error);
      throw error;
    }
  }

  /**
   * Link email to existing deal based on AI analysis
   */
  async linkToDeal(emailData, analysis) {
    try {
      // Check if email references a deal
      if (!analysis.dealReferences || analysis.dealReferences.length === 0) {
        return null;
      }

      // Search for deals based on references
      for (const reference of analysis.dealReferences) {
        const deals = await this.larkAPI.searchRecords('deals', {
          filter: {
            or: [
              { deal_number: reference },
              { title: { contains: reference } }
            ]
          }
        });

        if (deals.length > 0) {
          return deals[0];
        }
      }

      return null;
    } catch (error) {
      console.error('Error linking to deal:', error);
      return null;
    }
  }

  /**
   * Create activity record in CRM
   */
  async createActivityRecord({ emailData, analysis, customer, deal }) {
    try {
      const activityData = {
        type: 'Email',
        subtype: 'Inbound',
        customer_id: customer.id,
        deal_id: deal ? deal.id : null,
        subject: emailData.subject,
        description: emailData.text || emailData.html,
        activity_date: emailData.date,
        status: 'Completed',
        
        // AI Analysis results
        sentiment: analysis.sentiment,
        urgency: analysis.urgency,
        topics: analysis.topics,
        action_items: analysis.actionItems,
        
        // Email metadata
        email_from: emailData.from.address,
        email_to: emailData.to.map(t => t.address).join(', '),
        message_id: emailData.messageId,
        
        // Tracking data
        processed_date: new Date().toISOString()
      };

      const activity = await this.larkAPI.createRecord('activities', activityData);
      
      // Create follow-up tasks if needed
      if (analysis.urgency === 'high' || analysis.actionItems.length > 0) {
        await this.createFollowUpTasks(activity, analysis);
      }

      return activity;
    } catch (error) {
      console.error('Error creating activity record:', error);
      throw error;
    }
  }

  /**
   * Process email attachments
   */
  async processAttachments(attachments, activity) {
    try {
      for (const attachment of attachments) {
        // Upload to Lark Drive
        const fileData = await this.larkAPI.uploadFile({
          filename: attachment.filename,
          content: attachment.content,
          contentType: attachment.contentType
        });

        // Create attachment record
        await this.larkAPI.createRecord('attachments', {
          activity_id: activity.id,
          filename: attachment.filename,
          file_url: fileData.url,
          file_size: attachment.size,
          content_type: attachment.contentType,
          uploaded_date: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error processing attachments:', error);
      // Non-critical error, continue processing
    }
  }

  /**
   * Create follow-up tasks based on AI analysis
   */
  async createFollowUpTasks(activity, analysis) {
    try {
      const tasks = [];

      // High urgency task
      if (analysis.urgency === 'high') {
        tasks.push({
          title: `Urgent: Follow up on ${activity.subject}`,
          description: `High urgency email requires immediate attention.\n\nSentiment: ${analysis.sentiment}\nKey topics: ${analysis.topics.join(', ')}`,
          due_date: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
          priority: 'High',
          activity_id: activity.id,
          assigned_to: activity.owner_id
        });
      }

      // Action items
      for (const actionItem of analysis.actionItems) {
        tasks.push({
          title: actionItem.title,
          description: actionItem.description,
          due_date: actionItem.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 24 hours
          priority: actionItem.priority || 'Medium',
          activity_id: activity.id,
          assigned_to: activity.owner_id
        });
      }

      // Create tasks in CRM
      for (const task of tasks) {
        await this.larkAPI.createRecord('tasks', task);
      }
    } catch (error) {
      console.error('Error creating follow-up tasks:', error);
      // Non-critical error, continue processing
    }
  }

  /**
   * Start email monitoring
   */
  async startMonitoring() {
    // Initial processing
    await this.processIncomingEmails();

    // Set up IDLE monitoring for real-time processing
    this.client.on('exists', async (data) => {
      console.log(`New emails detected: ${data.count}`);
      await this.processIncomingEmails();
    });

    await this.client.idle();
  }

  /**
   * Disconnect from IMAP server
   */
  async disconnect() {
    if (this.client) {
      await this.client.logout();
      console.log('Disconnected from IMAP server');
    }
  }
}

module.exports = { EmailProcessor };