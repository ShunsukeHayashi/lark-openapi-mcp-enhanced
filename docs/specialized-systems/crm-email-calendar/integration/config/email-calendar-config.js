/**
 * Email and Calendar Integration Configuration
 */

module.exports = {
  // Email Configuration
  email: {
    // IMAP Configuration for receiving emails
    imap: {
      host: process.env.IMAP_HOST || 'imap.gmail.com',
      port: process.env.IMAP_PORT || 993,
      secure: true,
      user: process.env.IMAP_USER,
      password: process.env.IMAP_PASSWORD,
      tls: {
        rejectUnauthorized: false
      }
    },
    
    // SMTP Configuration for sending emails
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    },
    
    // Email Processing
    processing: {
      checkInterval: 60000, // Check for new emails every minute
      batchSize: 10, // Process up to 10 emails at a time
      retryAttempts: 3,
      retryDelay: 5000
    },
    
    // Email Tracking
    tracking: {
      enabled: true,
      trackingDomain: process.env.TRACKING_DOMAIN || 'track.yourdomain.com',
      secretKey: process.env.TRACKING_SECRET,
      pixelEndpoint: '/pixel',
      linkEndpoint: '/link',
      youtubeEndpoint: '/youtube'
    },
    
    // Sender Information
    sender: {
      name: process.env.SENDER_NAME || 'CRM System',
      email: process.env.SENDER_EMAIL || 'noreply@yourdomain.com'
    },
    
    // Company Information
    company: {
      name: process.env.COMPANY_NAME || 'Your Company',
      domain: process.env.COMPANY_DOMAIN || 'yourdomain.com',
      website: process.env.COMPANY_WEBSITE || 'https://yourdomain.com'
    }
  },
  
  // Calendar Configuration
  calendar: {
    // Lark Calendar
    lark: {
      syncEnabled: true,
      syncInterval: 300000, // 5 minutes
      webhookEnabled: true,
      calendarsToSync: ['primary', 'team'] // or specific calendar IDs
    },
    
    // External Calendar Integration
    external: {
      google: {
        enabled: process.env.GOOGLE_CALENDAR_ENABLED === 'true',
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
        scopes: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events'
        ]
      },
      
      outlook: {
        enabled: process.env.OUTLOOK_CALENDAR_ENABLED === 'true',
        clientId: process.env.OUTLOOK_CLIENT_ID,
        clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
        redirectUri: process.env.OUTLOOK_REDIRECT_URI,
        authority: 'https://login.microsoftonline.com/common',
        scopes: [
          'calendars.readwrite',
          'user.read'
        ]
      },
      
      ical: {
        enabled: true,
        refreshInterval: 3600000 // 1 hour
      }
    },
    
    // Scheduling Configuration
    scheduling: {
      defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Asia/Tokyo',
      businessHours: {
        start: 9,
        end: 18,
        workDays: [1, 2, 3, 4, 5] // Monday to Friday
      },
      bufferTime: {
        before: 15, // minutes
        after: 15   // minutes
      },
      defaultMeetingDuration: 60, // minutes
      maxDaysAhead: 30,
      minAdvanceHours: 24
    }
  },
  
  // AI Configuration
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
    emailAnalysis: {
      enabled: true,
      sentimentAnalysis: true,
      urgencyDetection: true,
      topicExtraction: true,
      actionItemExtraction: true,
      languageDetection: true
    },
    scheduling: {
      enabled: true,
      optimizationFactors: [
        'time_of_day',
        'day_of_week',
        'customer_preference',
        'meeting_type',
        'travel_time',
        'energy_levels'
      ]
    }
  },
  
  // Lark API Configuration
  lark: {
    appId: process.env.LARK_APP_ID,
    appSecret: process.env.LARK_APP_SECRET,
    tenantKey: process.env.LARK_TENANT_KEY,
    baseUrl: process.env.LARK_API_URL || 'https://open.larksuite.com',
    baseTableId: process.env.LARK_BASE_TABLE_ID,
    tables: {
      customers: process.env.LARK_CUSTOMERS_TABLE,
      deals: process.env.LARK_DEALS_TABLE,
      activities: process.env.LARK_ACTIVITIES_TABLE,
      tasks: process.env.LARK_TASKS_TABLE,
      emails: process.env.LARK_EMAILS_TABLE,
      attachments: process.env.LARK_ATTACHMENTS_TABLE
    }
  },
  
  // Database Configuration (for tracking and cache)
  database: {
    type: process.env.DB_TYPE || 'sqlite',
    sqlite: {
      filename: process.env.DB_FILE || './crm-email-calendar.db'
    },
    postgres: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    }
  },
  
  // Webhook Configuration
  webhooks: {
    baseUrl: process.env.WEBHOOK_BASE_URL || 'https://api.yourdomain.com',
    endpoints: {
      emailIncoming: '/webhooks/email/incoming',
      calendarUpdates: '/webhooks/calendar/updates',
      trackingEvents: '/webhooks/tracking/events'
    },
    security: {
      verifySignature: true,
      secret: process.env.WEBHOOK_SECRET
    }
  },
  
  // Queue Configuration
  queue: {
    type: process.env.QUEUE_TYPE || 'memory', // memory, redis, rabbitmq
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD
    },
    jobs: {
      emailProcessing: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      },
      calendarSync: {
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 5000
        }
      }
    }
  },
  
  // Security Configuration
  security: {
    encryption: {
      algorithm: 'aes-256-gcm',
      keyDerivation: 'pbkdf2',
      iterations: 100000
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }
  },
  
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    transports: ['console', 'file'],
    file: {
      filename: 'crm-email-calendar.log',
      maxSize: '10m',
      maxFiles: 5
    }
  },
  
  // Feature Flags
  features: {
    emailIntegration: true,
    calendarSync: true,
    aiAnalysis: true,
    smartScheduling: true,
    youtubeTracking: true,
    abTesting: true,
    automatedFollowUp: true
  }
};