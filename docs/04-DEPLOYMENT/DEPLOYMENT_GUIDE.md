# Chat Agent System - Deployment Guide

**Version**: 1.0.0  
**Target Audience**: DevOps, System Administrators  
**Last Updated**: 2025-06-24

## 🚀 Quick Start

### Prerequisites
- Node.js ≥16.20.0
- Yarn or npm
- Lark app with proper permissions
- Valid App ID and App Secret

### Installation
```bash
# Clone repository
git clone https://github.com/your-org/lark-openapi-mcp.git
cd lark-openapi-mcp

# Install dependencies
yarn install

# Build project
yarn build
```

### Configuration
```bash
# Set environment variables
export APP_ID="cli_your_app_id"
export APP_SECRET="your_app_secret"

# Or create config file
cp config.sample.json config.json
# Edit config.json with your credentials
```

### Run MCP Server
```bash
# Standard I/O mode (for AI tool integration)
node dist/cli.js mcp --mode stdio

# SSE mode (HTTP server)
node dist/cli.js mcp --mode sse --port 3000
```

## 🏗️ Production Deployment

### Environment Setup

#### System Requirements
- **CPU**: 2+ cores
- **Memory**: 4GB+ RAM
- **Storage**: 10GB+ available space
- **Network**: HTTPS endpoint for webhooks

#### Dependencies
```bash
# Production dependencies only
yarn install --production

# Build for production
NODE_ENV=production yarn build
```

### Configuration Management

#### Environment Variables
```bash
# Required
export APP_ID="cli_your_app_id"
export APP_SECRET="your_app_secret"

# Optional
export NODE_ENV="production"
export PORT="3000"
export LOG_LEVEL="info"
export MAX_CONVERSATION_HISTORY="50"
export CACHE_TTL_MINUTES="5"
```

#### Production Config
```json
{
  "app": {
    "id": "cli_your_app_id",
    "secret": "your_app_secret"
  },
  "server": {
    "port": 3000,
    "host": "0.0.0.0",
    "timeout": 30000
  },
  "agent": {
    "defaultLanguage": "ja",
    "temperature": 0.7,
    "maxTokens": 2048,
    "maxConversationHistory": 50
  },
  "rateLimiting": {
    "enabled": true,
    "requestsPerMinute": 50,
    "writeRequestsPerMinute": 10
  },
  "cache": {
    "ttlMinutes": 5,
    "maxSize": 1000
  }
}
```

### Docker Deployment

#### Dockerfile
```dockerfile
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile --production

# Copy source code
COPY . .

# Build application
RUN yarn build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S agent -u 1001

# Change ownership
USER agent

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/health-check.js

# Start application
CMD ["node", "dist/cli.js", "mcp", "--mode", "sse", "--port", "3000"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  lark-chat-agent:
    build: .
    ports:
      - "3000:3000"
    environment:
      - APP_ID=${APP_ID}
      - APP_SECRET=${APP_SECRET}
      - NODE_ENV=production
    volumes:
      - ./config:/app/config:ro
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "dist/health-check.js"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - lark-chat-agent
    restart: unless-stopped
```

### Kubernetes Deployment

#### Deployment YAML
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: lark-chat-agent
  labels:
    app: lark-chat-agent
spec:
  replicas: 3
  selector:
    matchLabels:
      app: lark-chat-agent
  template:
    metadata:
      labels:
        app: lark-chat-agent
    spec:
      containers:
      - name: chat-agent
        image: lark-chat-agent:latest
        ports:
        - containerPort: 3000
        env:
        - name: APP_ID
          valueFrom:
            secretKeyRef:
              name: lark-credentials
              key: app-id
        - name: APP_SECRET
          valueFrom:
            secretKeyRef:
              name: lark-credentials
              key: app-secret
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: lark-chat-agent-service
spec:
  selector:
    app: lark-chat-agent
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

### Process Management (PM2)

#### PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'lark-chat-agent',
    script: 'dist/cli.js',
    args: 'mcp --mode sse --port 3000',
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log'
  }]
};
```

#### PM2 Commands
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit

# View logs
pm2 logs

# Restart
pm2 restart lark-chat-agent

# Stop
pm2 stop lark-chat-agent
```

## 🔧 Lark Bot Integration

### Webhook Setup

#### Configure Webhook URL
```
https://your-domain.com/webhook
```

#### Webhook Handler
```typescript
import express from 'express';
import { AgentRunner } from './dist/agents/agent';
import { getOrCreateAgent } from './dist/mcp-tool/tools/en/builtin-tools/system/lark-chat-agent';

const app = express();
app.use(express.json());

app.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    
    // Verify webhook signature
    if (!verifySignature(req)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Handle message events
    if (event.type === 'im.message.receive_v1') {
      const message = event.event.message;
      const sender = event.event.sender;
      
      // Get agent
      const agent = await getOrCreateAgent('LarkAssistant', 'ja', larkClient);
      
      // Process message
      const result = await AgentRunner.runWithLarkClient(
        agent,
        message.content.text,
        message.chat_id,
        larkClient,
        sender.sender_id.user_id
      );
      
      console.log('Agent response sent:', result.success);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function verifySignature(req) {
  // Implement Lark webhook signature verification
  const signature = req.headers['x-lark-signature'];
  const timestamp = req.headers['x-lark-request-timestamp'];
  // ... verification logic
  return true;
}
```

### Required Permissions

#### Lark App Permissions
```json
{
  "permissions": [
    "im:message",
    "im:message:send_as_bot",
    "im:chat",
    "im:chat:readonly",
    "contact:user.base:readonly",
    "contact:user.id:readonly",
    "bitable:app",
    "drive:drive",
    "docs:doc"
  ]
}
```

#### API Scopes
- **Messaging**: Send and receive messages
- **Chat Management**: Manage chat groups
- **User Information**: Access user profiles
- **Base Operations**: Read and write Lark Base data
- **Document Access**: Search and access documents

## 📊 Monitoring & Logging

### Health Checks

#### Health Check Endpoint
```typescript
// health-check.js
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
```

### Logging Configuration

#### Winston Logger
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'lark-chat-agent' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### Metrics Collection

#### Prometheus Metrics
```typescript
import prometheus from 'prom-client';

// Create metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const agentResponseTime = new prometheus.Histogram({
  name: 'agent_response_time_seconds',
  help: 'Agent response time in seconds',
  labelNames: ['agent_name', 'intent_type']
});

const toolExecutionCount = new prometheus.Counter({
  name: 'tool_executions_total',
  help: 'Total number of tool executions',
  labelNames: ['tool_name', 'status']
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(prometheus.register.metrics());
});
```

## 🔒 Security

### HTTPS Configuration

#### Nginx SSL Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Rate Limiting

#### Express Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/webhook', limiter);
```

### Environment Security

#### Secret Management
```bash
# Use environment-specific secrets
export APP_SECRET=$(cat /run/secrets/lark_app_secret)

# Or use cloud secret managers
export APP_SECRET=$(aws secretsmanager get-secret-value --secret-id lark-app-secret --query SecretString --output text)
```

## 🔄 Backup & Recovery

### Database Backup (if using persistent storage)
```bash
# Backup conversation data
mongodump --host localhost --db lark_agent --out /backup/$(date +%Y%m%d)

# Restore
mongorestore --host localhost --db lark_agent /backup/20250624
```

### Configuration Backup
```bash
# Backup configuration
tar -czf config-backup-$(date +%Y%m%d).tar.gz config/ .env ecosystem.config.js

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backup/lark-agent"
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/config-$DATE.tar.gz config/ .env
find $BACKUP_DIR -name "config-*.tar.gz" -mtime +7 -delete
```

## 📈 Scaling

### Horizontal Scaling
```yaml
# Kubernetes horizontal pod autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: lark-chat-agent-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: lark-chat-agent
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Load Balancing
```yaml
# Application Load Balancer (AWS)
apiVersion: v1
kind: Service
metadata:
  name: lark-chat-agent
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: nlb
    service.beta.kubernetes.io/aws-load-balancer-scheme: internet-facing
spec:
  type: LoadBalancer
  ports:
  - port: 443
    targetPort: 3000
    protocol: TCP
  selector:
    app: lark-chat-agent
```

---

**Next Steps:**
1. Set up monitoring and alerting
2. Configure backup procedures
3. Implement CI/CD pipeline
4. Performance testing and optimization

**Support:** For deployment issues, see the troubleshooting section in `docs/CHAT_AGENT_GUIDE.md`