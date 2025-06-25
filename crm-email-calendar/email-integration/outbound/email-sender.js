/**
 * Email Sender - Outbound Email Automation System
 * Handles template-based email sending with tracking and personalization
 */

const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const { EmailTracker } = require('../inbound/email-tracker');
const { LarkAPI } = require('../../../src/utils/lark-api');
const { TemplateEngine } = require('./template-engine');
const { ABTestManager } = require('./ab-test-manager');

class EmailSender {
  constructor(config) {
    this.config = config;
    this.larkAPI = new LarkAPI(config.lark);
    this.emailTracker = new EmailTracker(config.tracking);
    this.templateEngine = new TemplateEngine(config.templates);
    this.abTestManager = new ABTestManager(config.abTesting);
    
    // Initialize SMTP transporter
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.password
      }
    });
  }

  /**
   * Send email with template
   */
  async sendEmail({
    to,
    templateId,
    variables,
    customerId,
    dealId,
    campaignId,
    scheduleTime,
    abTestId
  }) {
    try {
      // Get customer data
      const customer = await this.larkAPI.getRecord('customers', customerId);
      
      // Get deal data if provided
      const deal = dealId ? await this.larkAPI.getRecord('deals', dealId) : null;
      
      // Merge variables
      const mergedVariables = {
        ...variables,
        customer,
        deal,
        currentDate: new Date().toLocaleDateString('ja-JP'),
        companyName: this.config.company.name,
        senderName: this.config.sender.name
      };

      // Get template (with A/B testing if applicable)
      const template = await this.getTemplate(templateId, abTestId);
      
      // Determine optimal send time
      const sendTime = scheduleTime || await this.calculateOptimalSendTime(customer.email);
      
      // Schedule or send immediately
      if (sendTime > new Date()) {
        return await this.scheduleEmail({
          to,
          template,
          variables: mergedVariables,
          customerId,
          dealId,
          campaignId,
          sendTime
        });
      } else {
        return await this.sendEmailNow({
          to,
          template,
          variables: mergedVariables,
          customerId,
          dealId,
          campaignId
        });
      }
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send email immediately
   */
  async sendEmailNow({
    to,
    template,
    variables,
    customerId,
    dealId,
    campaignId
  }) {
    try {
      // Generate unique email ID
      const emailId = this.generateEmailId();
      
      // Compile template
      const compiledSubject = handlebars.compile(template.subject)(variables);
      const compiledHtml = handlebars.compile(template.html)(variables);
      const compiledText = handlebars.compile(template.text || '')(variables);
      
      // Add tracking
      const trackedHtml = await this.addTrackingToEmail(
        compiledHtml,
        emailId,
        to,
        variables
      );
      
      // Prepare email options
      const mailOptions = {
        from: `${this.config.sender.name} <${this.config.sender.email}>`,
        to: to,
        subject: compiledSubject,
        text: compiledText,
        html: trackedHtml,
        headers: {
          'X-Campaign-ID': campaignId || '',
          'X-Customer-ID': customerId || '',
          'X-Deal-ID': dealId || '',
          'X-Email-ID': emailId
        }
      };

      // Add attachments if any
      if (template.attachments && template.attachments.length > 0) {
        mailOptions.attachments = await this.prepareAttachments(
          template.attachments,
          variables
        );
      }

      // Send email
      const info = await this.transporter.sendMail(mailOptions);
      
      // Record sent email
      const sentEmail = await this.recordSentEmail({
        emailId,
        messageId: info.messageId,
        to,
        subject: compiledSubject,
        template: template.id,
        customerId,
        dealId,
        campaignId,
        sentAt: new Date().toISOString(),
        status: 'sent'
      });

      // Create activity record
      await this.createEmailActivity({
        type: 'Email',
        subtype: 'Outbound',
        customerId,
        dealId,
        subject: compiledSubject,
        description: `Sent email using template: ${template.name}`,
        emailId,
        status: 'Completed'
      });

      return {
        success: true,
        emailId,
        messageId: info.messageId,
        sentEmail
      };
    } catch (error) {
      console.error('Error sending email now:', error);
      
      // Record failed email
      await this.recordFailedEmail({
        to,
        template: template.id,
        error: error.message,
        customerId,
        dealId,
        campaignId
      });
      
      throw error;
    }
  }

  /**
   * Add tracking elements to email
   */
  async addTrackingToEmail(html, emailId, recipientEmail, variables) {
    // Add tracking pixel
    const trackingPixel = this.emailTracker.generateTrackingPixel(emailId, recipientEmail);
    html = html.replace('</body>', `${trackingPixel}</body>`);
    
    // Track all links
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
    let match;
    let linkId = 0;
    
    while ((match = linkRegex.exec(html)) !== null) {
      const originalUrl = match[1];
      
      // Skip mailto and tel links
      if (originalUrl.startsWith('mailto:') || originalUrl.startsWith('tel:')) {
        continue;
      }
      
      // Special handling for YouTube links
      if (this.isYouTubeUrl(originalUrl)) {
        const videoId = this.extractYouTubeVideoId(originalUrl);
        if (videoId) {
          const trackedUrl = this.emailTracker.generateYouTubeTrackingLink(
            videoId,
            emailId,
            recipientEmail
          );
          html = html.replace(originalUrl, trackedUrl);
        }
      } else {
        // Regular link tracking
        const trackedUrl = this.emailTracker.generateTrackedLink(
          originalUrl,
          emailId,
          recipientEmail,
          `link_${linkId++}`
        );
        html = html.replace(originalUrl, trackedUrl);
      }
    }
    
    // Add unsubscribe link
    const unsubscribeUrl = this.emailTracker.generateTrackedLink(
      `${this.config.baseUrl}/unsubscribe`,
      emailId,
      recipientEmail,
      'unsubscribe'
    );
    
    html = html.replace(
      '{{unsubscribe_link}}',
      unsubscribeUrl
    );
    
    return html;
  }

  /**
   * Schedule email for later sending
   */
  async scheduleEmail({
    to,
    template,
    variables,
    customerId,
    dealId,
    campaignId,
    sendTime
  }) {
    const scheduledEmail = await this.larkAPI.createRecord('scheduled_emails', {
      to,
      templateId: template.id,
      variables: JSON.stringify(variables),
      customerId,
      dealId,
      campaignId,
      scheduledFor: sendTime.toISOString(),
      status: 'scheduled',
      createdAt: new Date().toISOString()
    });

    return {
      success: true,
      scheduled: true,
      scheduledEmail,
      sendTime
    };
  }

  /**
   * Send email sequence
   */
  async sendEmailSequence({
    customerId,
    sequenceId,
    startingStep = 1
  }) {
    try {
      // Get sequence definition
      const sequence = await this.larkAPI.getRecord('email_sequences', sequenceId);
      const customer = await this.larkAPI.getRecord('customers', customerId);
      
      // Get sequence steps
      const steps = sequence.steps.filter(step => step.stepNumber >= startingStep);
      
      // Schedule each step
      let currentDelay = 0;
      const scheduledEmails = [];
      
      for (const step of steps) {
        const sendTime = new Date(Date.now() + currentDelay);
        
        const result = await this.sendEmail({
          to: customer.email,
          templateId: step.templateId,
          variables: {
            sequenceStep: step.stepNumber,
            sequenceName: sequence.name
          },
          customerId,
          scheduleTime: sendTime
        });
        
        scheduledEmails.push(result);
        currentDelay += step.delayHours * 60 * 60 * 1000;
      }
      
      // Record sequence enrollment
      await this.larkAPI.createRecord('sequence_enrollments', {
        customerId,
        sequenceId,
        enrolledAt: new Date().toISOString(),
        currentStep: startingStep,
        status: 'active'
      });
      
      return {
        success: true,
        sequence,
        scheduledEmails
      };
    } catch (error) {
      console.error('Error sending email sequence:', error);
      throw error;
    }
  }

  /**
   * Get template with A/B testing
   */
  async getTemplate(templateId, abTestId) {
    if (abTestId) {
      // Get variant from A/B test
      const variant = await this.abTestManager.getVariant(abTestId);
      return await this.templateEngine.getTemplate(variant.templateId);
    } else {
      // Get regular template
      return await this.templateEngine.getTemplate(templateId);
    }
  }

  /**
   * Calculate optimal send time based on recipient behavior
   */
  async calculateOptimalSendTime(recipientEmail) {
    try {
      // Get recipient's email engagement history
      const engagementHistory = await this.getEngagementHistory(recipientEmail);
      
      if (engagementHistory.length === 0) {
        // Default to business hours if no history
        return this.getNextBusinessHour();
      }
      
      // Analyze open times
      const openTimes = engagementHistory
        .filter(e => e.type === 'open')
        .map(e => new Date(e.timestamp).getHours());
      
      if (openTimes.length === 0) {
        return this.getNextBusinessHour();
      }
      
      // Find most common open hour
      const hourCounts = {};
      openTimes.forEach(hour => {
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      
      const optimalHour = Object.keys(hourCounts)
        .reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b);
      
      // Schedule for next occurrence of optimal hour
      const now = new Date();
      const sendTime = new Date();
      sendTime.setHours(parseInt(optimalHour), 0, 0, 0);
      
      if (sendTime <= now) {
        sendTime.setDate(sendTime.getDate() + 1);
      }
      
      // Skip weekends
      if (sendTime.getDay() === 0) sendTime.setDate(sendTime.getDate() + 1);
      if (sendTime.getDay() === 6) sendTime.setDate(sendTime.getDate() + 2);
      
      return sendTime;
    } catch (error) {
      console.error('Error calculating optimal send time:', error);
      return this.getNextBusinessHour();
    }
  }

  /**
   * Get next business hour
   */
  getNextBusinessHour() {
    const now = new Date();
    const sendTime = new Date();
    
    // Set to next business hour (9 AM - 5 PM)
    if (now.getHours() < 9) {
      sendTime.setHours(9, 0, 0, 0);
    } else if (now.getHours() >= 17) {
      sendTime.setDate(sendTime.getDate() + 1);
      sendTime.setHours(9, 0, 0, 0);
    } else {
      sendTime.setHours(now.getHours() + 1, 0, 0, 0);
    }
    
    // Skip weekends
    if (sendTime.getDay() === 0) sendTime.setDate(sendTime.getDate() + 1);
    if (sendTime.getDay() === 6) sendTime.setDate(sendTime.getDate() + 2);
    
    return sendTime;
  }

  /**
   * Prepare attachments
   */
  async prepareAttachments(attachmentDefs, variables) {
    const attachments = [];
    
    for (const def of attachmentDefs) {
      if (def.condition && !this.evaluateCondition(def.condition, variables)) {
        continue;
      }
      
      attachments.push({
        filename: def.filename,
        path: def.path,
        contentType: def.contentType
      });
    }
    
    return attachments;
  }

  /**
   * Helper methods
   */
  generateEmailId() {
    return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  isYouTubeUrl(url) {
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  extractYouTubeVideoId(url) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w\-]+)/);
    return match ? match[1] : null;
  }

  evaluateCondition(condition, variables) {
    // Simple condition evaluation
    try {
      return new Function('vars', `with(vars) { return ${condition}; }`)(variables);
    } catch (error) {
      return false;
    }
  }

  async getEngagementHistory(email) {
    // Implementation to get engagement history from database
    return [];
  }

  async recordSentEmail(emailData) {
    return await this.larkAPI.createRecord('sent_emails', emailData);
  }

  async recordFailedEmail(errorData) {
    return await this.larkAPI.createRecord('failed_emails', {
      ...errorData,
      failedAt: new Date().toISOString()
    });
  }

  async createEmailActivity(activityData) {
    return await this.larkAPI.createRecord('activities', {
      ...activityData,
      activityDate: new Date().toISOString()
    });
  }
}

module.exports = { EmailSender };