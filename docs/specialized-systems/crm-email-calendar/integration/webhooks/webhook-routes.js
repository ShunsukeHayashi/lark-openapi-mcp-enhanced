/**
 * Webhook Routes
 * Handles incoming webhooks for email and calendar events
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(req, res, next) {
  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];
  const body = JSON.stringify(req.body);
  
  if (!signature || !timestamp) {
    return res.status(401).json({ error: 'Missing signature or timestamp' });
  }
  
  // Check timestamp to prevent replay attacks
  const currentTime = Date.now();
  const webhookTime = parseInt(timestamp);
  if (Math.abs(currentTime - webhookTime) > 300000) { // 5 minutes
    return res.status(401).json({ error: 'Timestamp too old' });
  }
  
  // Verify signature
  const secret = process.env.WEBHOOK_SECRET;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  next();
}

/**
 * Handle Lark calendar webhook events
 */
router.post('/calendar/updates', verifyWebhookSignature, async (req, res) => {
  const { calendarSync } = req.app.locals;
  const event = req.body;
  
  try {
    console.log('Received calendar webhook:', event.type);
    
    if (!calendarSync) {
      console.warn('Calendar sync not initialized');
      return res.status(503).json({ error: 'Service unavailable' });
    }
    
    await calendarSync.handleWebhookEvent(event);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling calendar webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Handle email webhook events (e.g., from email service provider)
 */
router.post('/email/incoming', async (req, res) => {
  const { emailProcessor } = req.app.locals;
  const emailData = req.body;
  
  try {
    console.log('Received email webhook');
    
    if (!emailProcessor) {
      console.warn('Email processor not initialized');
      return res.status(503).json({ error: 'Service unavailable' });
    }
    
    // Process email through webhook data
    const activity = await emailProcessor.processEmailFromWebhook(emailData);
    
    res.status(200).json({ 
      success: true,
      activityId: activity.id 
    });
  } catch (error) {
    console.error('Error handling email webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Handle email bounce notifications
 */
router.post('/email/bounce', async (req, res) => {
  const { emailSender } = req.app.locals;
  const bounceData = req.body;
  
  try {
    console.log('Received bounce notification:', bounceData.recipient);
    
    // Update email status and customer record
    await emailSender.handleBounce(bounceData);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling bounce:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Handle email complaint notifications
 */
router.post('/email/complaint', async (req, res) => {
  const { emailSender } = req.app.locals;
  const complaintData = req.body;
  
  try {
    console.log('Received complaint:', complaintData.recipient);
    
    // Handle spam complaint
    await emailSender.handleComplaint(complaintData);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling complaint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Handle YouTube webhook events
 */
router.post('/youtube/events', async (req, res) => {
  const { youtubeTracker } = req.app.locals;
  const event = req.body;
  
  try {
    console.log('Received YouTube event:', event.type);
    
    // Process YouTube analytics events
    if (youtubeTracker) {
      await youtubeTracker.handleWebhookEvent(event);
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling YouTube webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Test webhook endpoint
 */
router.post('/test', (req, res) => {
  console.log('Test webhook received:', req.body);
  res.status(200).json({ 
    success: true,
    received: req.body,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;