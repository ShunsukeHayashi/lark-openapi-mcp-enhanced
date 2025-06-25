/**
 * CRM Email & Calendar Integration System
 * Main entry point
 */

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const winston = require('winston');

// Import components
const { EmailProcessor } = require('./email-integration/inbound/email-processor');
const { EmailSender } = require('./email-integration/outbound/email-sender');
const { LarkCalendarSync } = require('./calendar-sync/lark/lark-calendar-sync');
const { SmartScheduler } = require('./calendar-sync/scheduling/smart-scheduler');
const config = require('./integration/config/email-calendar-config');

// Import routes
const webhookRoutes = require('./integration/webhooks/webhook-routes');
const trackingRoutes = require('./integration/webhooks/tracking-routes');
const apiRoutes = require('./integration/api/routes');

// Logger configuration
const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new winston.transports.File({
      filename: 'error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'combined.log'
    })
  ]
});

// Express app setup
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      email: emailProcessor ? 'active' : 'inactive',
      calendar: calendarSync ? 'active' : 'inactive',
      scheduler: scheduler ? 'active' : 'inactive'
    }
  });
});

// Routes
app.use('/webhooks', webhookRoutes);
app.use('/track', trackingRoutes);
app.use('/api', apiRoutes);

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialize services
let emailProcessor, emailSender, calendarSync, scheduler;

async function initializeServices() {
  try {
    logger.info('Initializing CRM Email & Calendar Integration System...');

    // Initialize Email Processor
    if (config.features.emailIntegration) {
      emailProcessor = new EmailProcessor(config);
      await emailProcessor.connect();
      await emailProcessor.startMonitoring();
      logger.info('Email processor initialized and monitoring started');
    }

    // Initialize Email Sender
    if (config.features.emailIntegration) {
      emailSender = new EmailSender(config);
      logger.info('Email sender initialized');
    }

    // Initialize Calendar Sync
    if (config.features.calendarSync) {
      calendarSync = new LarkCalendarSync(config);
      await calendarSync.startSync();
      logger.info('Calendar synchronization started');
    }

    // Initialize Smart Scheduler
    if (config.features.smartScheduling) {
      scheduler = new SmartScheduler(config);
      logger.info('Smart scheduler initialized');
    }

    // Make services available globally
    app.locals.emailProcessor = emailProcessor;
    app.locals.emailSender = emailSender;
    app.locals.calendarSync = calendarSync;
    app.locals.scheduler = scheduler;

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    throw error;
  }
}

// Graceful shutdown
async function gracefulShutdown() {
  logger.info('Starting graceful shutdown...');

  try {
    // Stop email monitoring
    if (emailProcessor) {
      await emailProcessor.disconnect();
      logger.info('Email processor disconnected');
    }

    // Stop calendar sync
    if (calendarSync) {
      calendarSync.stopSync();
      logger.info('Calendar sync stopped');
    }

    // Close server
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
      logger.info('HTTP server closed');
    }

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

// Start server
const PORT = process.env.PORT || 3000;
let server;

async function start() {
  try {
    // Initialize services
    await initializeServices();

    // Start HTTP server
    server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info('CRM Email & Calendar Integration System is ready');
    });
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Start the application
start();

// Export for testing
module.exports = { app, initializeServices, gracefulShutdown };