# YouTube CRM Email & Calendar Integration System

## Overview
This comprehensive system provides email integration and calendar synchronization capabilities for the YouTube CRM system on Lark Base, enabling seamless communication tracking and scheduling management.

## Table of Contents
1. [Email Integration System](#email-integration-system)
2. [Calendar Synchronization](#calendar-synchronization)
3. [Integration Architecture](#integration-architecture)
4. [Setup & Configuration](#setup--configuration)
5. [API Reference](#api-reference)

## Email Integration System

### Features
- **Inbound Email Processing**: Automatic email capture and analysis
- **Outbound Email Automation**: Template-based sending with tracking
- **Email Analytics**: Comprehensive metrics and reporting
- **YouTube Video Tracking**: Monitor engagement from email campaigns

### Calendar Synchronization

### Features
- **Bi-directional Sync**: Lark Calendar ↔ CRM synchronization
- **External Calendar Support**: Google, Outlook, iCal
- **Smart Scheduling**: AI-powered meeting optimization
- **Meeting Intelligence**: Automated preparation and follow-up

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Initialize database
npm run db:init

# Start services
npm run start
```

## Documentation
- [Email Integration Guide](./docs/email-integration-guide.md)
- [Calendar Sync Guide](./docs/calendar-sync-guide.md)
- [API Documentation](./docs/api-reference.md)
- [Configuration Guide](./docs/configuration-guide.md)