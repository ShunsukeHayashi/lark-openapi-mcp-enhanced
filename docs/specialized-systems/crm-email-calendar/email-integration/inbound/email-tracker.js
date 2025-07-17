/**
 * Email Tracker
 * Tracks email engagement metrics and YouTube video interactions
 */

const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class EmailTracker {
  constructor(config) {
    this.config = config;
    this.trackingDomain = config.trackingDomain || 'track.yourdomain.com';
    this.secretKey = config.secretKey || crypto.randomBytes(32).toString('hex');
  }

  /**
   * Track inbound email
   */
  async trackInboundEmail(emailData, activity) {
    const trackingData = {
      id: uuidv4(),
      type: 'inbound',
      messageId: emailData.messageId,
      activityId: activity.id,
      from: emailData.from.address,
      to: emailData.to.map(t => t.address),
      subject: emailData.subject,
      receivedAt: emailData.date,
      processedAt: new Date().toISOString(),
      hasAttachments: emailData.attachments && emailData.attachments.length > 0,
      attachmentCount: emailData.attachments ? emailData.attachments.length : 0
    };

    // Store tracking data
    await this.storeTrackingData(trackingData);
    
    return trackingData;
  }

  /**
   * Generate tracking pixel for outbound emails
   */
  generateTrackingPixel(emailId, recipientEmail) {
    const trackingId = this.generateTrackingId(emailId, recipientEmail);
    const pixelUrl = `https://${this.trackingDomain}/pixel/${trackingId}.gif`;
    
    return `<img src="${pixelUrl}" width="1" height="1" style="display:none;" alt="" />`;
  }

  /**
   * Generate tracked link
   */
  generateTrackedLink(originalUrl, emailId, recipientEmail, linkId) {
    const trackingData = {
      emailId,
      recipientEmail,
      linkId,
      originalUrl,
      timestamp: Date.now()
    };

    const token = this.encryptTrackingData(trackingData);
    return `https://${this.trackingDomain}/link/${token}`;
  }

  /**
   * Generate YouTube video tracking link
   */
  generateYouTubeTrackingLink(videoId, emailId, recipientEmail) {
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const trackingData = {
      emailId,
      recipientEmail,
      videoId,
      type: 'youtube',
      originalUrl: youtubeUrl,
      timestamp: Date.now()
    };

    const token = this.encryptTrackingData(trackingData);
    return `https://${this.trackingDomain}/youtube/${token}`;
  }

  /**
   * Process tracking event
   */
  async processTrackingEvent(type, token, additionalData = {}) {
    try {
      const trackingData = this.decryptTrackingData(token);
      
      const event = {
        id: uuidv4(),
        type,
        emailId: trackingData.emailId,
        recipientEmail: trackingData.recipientEmail,
        timestamp: new Date().toISOString(),
        ...additionalData
      };

      // Handle different event types
      switch (type) {
        case 'open':
          await this.handleEmailOpen(event, trackingData);
          break;
        case 'click':
          await this.handleLinkClick(event, trackingData);
          break;
        case 'youtube':
          await this.handleYouTubeClick(event, trackingData);
          break;
        case 'unsubscribe':
          await this.handleUnsubscribe(event, trackingData);
          break;
      }

      // Store event
      await this.storeTrackingEvent(event);
      
      // Update engagement score
      await this.updateEngagementScore(trackingData.emailId, trackingData.recipientEmail, type);

      return event;
    } catch (error) {
      console.error('Error processing tracking event:', error);
      throw error;
    }
  }

  /**
   * Handle email open event
   */
  async handleEmailOpen(event, trackingData) {
    // Update email status
    await this.updateEmailStatus(trackingData.emailId, {
      opened: true,
      firstOpenedAt: event.timestamp,
      openCount: { $inc: 1 }
    });

    // Create activity
    await this.createTrackingActivity({
      type: 'Email Opened',
      emailId: trackingData.emailId,
      recipientEmail: trackingData.recipientEmail,
      timestamp: event.timestamp
    });
  }

  /**
   * Handle link click event
   */
  async handleLinkClick(event, trackingData) {
    // Update link click stats
    await this.updateLinkStats(trackingData.emailId, trackingData.linkId, {
      clicked: true,
      clickCount: { $inc: 1 },
      lastClickedAt: event.timestamp
    });

    // Create activity
    await this.createTrackingActivity({
      type: 'Link Clicked',
      emailId: trackingData.emailId,
      recipientEmail: trackingData.recipientEmail,
      linkId: trackingData.linkId,
      originalUrl: trackingData.originalUrl,
      timestamp: event.timestamp
    });
  }

  /**
   * Handle YouTube video click
   */
  async handleYouTubeClick(event, trackingData) {
    // Special handling for YouTube videos
    const videoData = {
      videoId: trackingData.videoId,
      clicked: true,
      clickedAt: event.timestamp,
      emailId: trackingData.emailId,
      recipientEmail: trackingData.recipientEmail
    };

    // Store YouTube engagement
    await this.storeYouTubeEngagement(videoData);

    // Create activity with video context
    await this.createTrackingActivity({
      type: 'YouTube Video Clicked',
      emailId: trackingData.emailId,
      recipientEmail: trackingData.recipientEmail,
      videoId: trackingData.videoId,
      videoUrl: trackingData.originalUrl,
      timestamp: event.timestamp
    });

    // Trigger video view tracking
    await this.initializeVideoTracking(trackingData.videoId, trackingData.recipientEmail);
  }

  /**
   * Calculate engagement score
   */
  async calculateEngagementScore(emailId, recipientEmail) {
    const events = await this.getTrackingEvents(emailId, recipientEmail);
    
    let score = 0;
    const weights = {
      open: 1,
      click: 3,
      youtube: 5,
      reply: 10,
      forward: 8
    };

    for (const event of events) {
      score += weights[event.type] || 0;
    }

    // Time decay factor
    const daysSinceSent = this.calculateDaysSince(emailId);
    const decayFactor = Math.max(0.5, 1 - (daysSinceSent * 0.1));
    
    return Math.round(score * decayFactor);
  }

  /**
   * Update engagement score
   */
  async updateEngagementScore(emailId, recipientEmail, eventType) {
    const score = await this.calculateEngagementScore(emailId, recipientEmail);
    
    // Update customer engagement profile
    await this.updateCustomerEngagement(recipientEmail, {
      lastEngagementDate: new Date().toISOString(),
      engagementScore: score,
      totalEvents: { $inc: 1 },
      [`eventCounts.${eventType}`]: { $inc: 1 }
    });
  }

  /**
   * Generate tracking ID
   */
  generateTrackingId(emailId, recipientEmail) {
    const data = `${emailId}:${recipientEmail}:${Date.now()}`;
    return crypto.createHash('sha256').update(data + this.secretKey).digest('hex');
  }

  /**
   * Encrypt tracking data
   */
  encryptTrackingData(data) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc', 
      Buffer.from(this.secretKey.slice(0, 32)), 
      iv
    );
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt tracking data
   */
  decryptTrackingData(token) {
    try {
      const parts = token.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedData = parts[1];
      
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc', 
        Buffer.from(this.secretKey.slice(0, 32)), 
        iv
      );
      
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error('Invalid tracking token');
    }
  }

  /**
   * Initialize YouTube video tracking
   */
  async initializeVideoTracking(videoId, recipientEmail) {
    // This would integrate with YouTube Analytics API
    // to track video watch time, engagement, etc.
    console.log(`Initializing video tracking for ${videoId} - ${recipientEmail}`);
  }

  /**
   * Store tracking data (implement based on your database)
   */
  async storeTrackingData(data) {
    // Implementation depends on your database
    console.log('Storing tracking data:', data);
  }

  /**
   * Store tracking event (implement based on your database)
   */
  async storeTrackingEvent(event) {
    // Implementation depends on your database
    console.log('Storing tracking event:', event);
  }

  /**
   * Create tracking activity in CRM
   */
  async createTrackingActivity(activityData) {
    // Implementation to create activity in Lark Base
    console.log('Creating tracking activity:', activityData);
  }

  /**
   * Helper methods (implement based on your database)
   */
  async updateEmailStatus(emailId, updates) {
    console.log('Updating email status:', emailId, updates);
  }

  async updateLinkStats(emailId, linkId, updates) {
    console.log('Updating link stats:', emailId, linkId, updates);
  }

  async storeYouTubeEngagement(videoData) {
    console.log('Storing YouTube engagement:', videoData);
  }

  async getTrackingEvents(emailId, recipientEmail) {
    // Return tracking events from database
    return [];
  }

  async updateCustomerEngagement(recipientEmail, updates) {
    console.log('Updating customer engagement:', recipientEmail, updates);
  }

  calculateDaysSince(emailId) {
    // Calculate days since email was sent
    return 1;
  }

  /**
   * Handle unsubscribe
   */
  async handleUnsubscribe(event, trackingData) {
    await this.updateCustomerPreferences(trackingData.recipientEmail, {
      subscribed: false,
      unsubscribedAt: event.timestamp
    });
  }

  async updateCustomerPreferences(email, preferences) {
    console.log('Updating customer preferences:', email, preferences);
  }
}

module.exports = { EmailTracker };