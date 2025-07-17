/**
 * Email Tracking Routes
 * Handles tracking pixels, link clicks, and engagement metrics
 */

const express = require('express');
const router = express.Router();
const path = require('path');

// 1x1 transparent GIF
const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

/**
 * Handle tracking pixel requests
 */
router.get('/pixel/:token.gif', async (req, res) => {
  const { emailTracker } = req.app.locals;
  const { token } = req.params;
  
  try {
    // Process tracking event
    if (emailTracker) {
      await emailTracker.processTrackingEvent('open', token, {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
    }
    
    // Return tracking pixel
    res.set({
      'Content-Type': 'image/gif',
      'Content-Length': TRACKING_PIXEL.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.send(TRACKING_PIXEL);
  } catch (error) {
    console.error('Error processing tracking pixel:', error);
    // Still return pixel even on error
    res.type('gif').send(TRACKING_PIXEL);
  }
});

/**
 * Handle tracked link clicks
 */
router.get('/link/:token', async (req, res) => {
  const { emailTracker } = req.app.locals;
  const { token } = req.params;
  
  try {
    // Process click event
    const event = await emailTracker.processTrackingEvent('click', token, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      referer: req.headers.referer,
      timestamp: new Date().toISOString()
    });
    
    // Redirect to original URL
    if (event && event.originalUrl) {
      res.redirect(event.originalUrl);
    } else {
      res.redirect('/');
    }
  } catch (error) {
    console.error('Error processing link click:', error);
    res.redirect('/');
  }
});

/**
 * Handle YouTube video tracking
 */
router.get('/youtube/:token', async (req, res) => {
  const { emailTracker } = req.app.locals;
  const { token } = req.params;
  
  try {
    // Process YouTube click event
    const event = await emailTracker.processTrackingEvent('youtube', token, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    // Redirect to YouTube video
    if (event && event.originalUrl) {
      // Add tracking parameters to YouTube URL
      const url = new URL(event.originalUrl);
      url.searchParams.append('utm_source', 'email');
      url.searchParams.append('utm_medium', 'crm');
      url.searchParams.append('utm_campaign', event.emailId || 'unknown');
      
      res.redirect(url.toString());
    } else {
      res.redirect('https://youtube.com');
    }
  } catch (error) {
    console.error('Error processing YouTube tracking:', error);
    res.redirect('https://youtube.com');
  }
});

/**
 * Handle unsubscribe requests
 */
router.get('/unsubscribe/:token', async (req, res) => {
  const { emailTracker, emailSender } = req.app.locals;
  const { token } = req.params;
  
  try {
    // Process unsubscribe event
    const event = await emailTracker.processTrackingEvent('unsubscribe', token, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    // Show unsubscribe confirmation page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Unsubscribe Confirmation</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            text-align: center;
          }
          .success {
            color: #28a745;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .message {
            color: #666;
            line-height: 1.6;
          }
          .button {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <div class="success">✓ 配信停止が完了しました</div>
        <div class="message">
          メールの配信を停止しました。<br>
          この変更は即座に反映されます。<br><br>
          ご利用ありがとうございました。
        </div>
        <a href="/" class="button">ホームに戻る</a>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    res.status(500).send('エラーが発生しました。後でもう一度お試しください。');
  }
});

/**
 * Email preview endpoint (for testing)
 */
router.get('/preview/:emailId', async (req, res) => {
  const { emailSender } = req.app.locals;
  const { emailId } = req.params;
  
  try {
    // Get email content
    const email = await emailSender.getEmailPreview(emailId);
    
    if (!email) {
      return res.status(404).send('Email not found');
    }
    
    // Return HTML preview
    res.send(email.html);
  } catch (error) {
    console.error('Error getting email preview:', error);
    res.status(500).send('Error loading preview');
  }
});

/**
 * Analytics endpoint for email performance
 */
router.get('/analytics/:emailId', async (req, res) => {
  const { emailTracker } = req.app.locals;
  const { emailId } = req.params;
  
  try {
    const analytics = await emailTracker.getEmailAnalytics(emailId);
    
    res.json({
      emailId,
      metrics: {
        sent: analytics.sentCount,
        opened: analytics.openCount,
        clicked: analytics.clickCount,
        unsubscribed: analytics.unsubscribeCount,
        openRate: `${analytics.openRate}%`,
        clickRate: `${analytics.clickRate}%`,
        clickToOpenRate: `${analytics.clickToOpenRate}%`
      },
      linkPerformance: analytics.linkPerformance,
      deviceBreakdown: analytics.deviceBreakdown,
      timeline: analytics.timeline
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

/**
 * Batch tracking endpoint
 */
router.post('/batch', async (req, res) => {
  const { emailTracker } = req.app.locals;
  const { events } = req.body;
  
  try {
    const results = [];
    
    for (const event of events) {
      try {
        const result = await emailTracker.processTrackingEvent(
          event.type,
          event.token,
          event.data
        );
        results.push({ success: true, event: result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    
    res.json({ results });
  } catch (error) {
    console.error('Error processing batch tracking:', error);
    res.status(500).json({ error: 'Failed to process batch' });
  }
});

module.exports = router;