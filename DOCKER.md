# Docker Guide for Lark OpenAPI MCP

## 🐳 Overview

This project uses a multi-stage Docker build to optimize both development and production environments.

## 🏗️ Architecture

### Multi-Stage Build
- **deps**: Dependencies installation
- **builder**: TypeScript compilation
- **production**: Optimized production image
- **development**: Development environment with hot reload

### Services
- **Production**: `lark-mcp-stdio`, `lark-mcp-sse`
- **Development**: `lark-mcp-stdio-dev`, `lark-mcp-sse-dev`
- **Genesis**: `lark-genesis` (development only)

## 🚀 Quick Start

### Prerequisites
```bash
# Set environment variables
export APP_ID="your_lark_app_id"
export APP_SECRET="your_lark_app_secret"
```

### Production Mode

#### Using Docker Compose
```bash
# Build and run production services
docker-compose --profile production up lark-mcp-sse

# Or run STDIO mode
docker-compose --profile production up lark-mcp-stdio
```

#### Using Scripts
```bash
# Build production image
./scripts/docker-build.sh

# Run STDIO mode
./scripts/docker-run.sh --mode stdio --target production

# Run SSE mode
./scripts/docker-run.sh --mode sse --target production --port 3000
```

### Development Mode

#### Using Docker Compose
```bash
# Build and run development services
docker-compose --profile development up lark-mcp-sse-dev

# Or run STDIO mode
docker-compose --profile development up lark-mcp-stdio-dev
```

#### Using Scripts
```bash
# Build development image
./scripts/docker-build.sh 0.3.1 development

# Run development mode with hot reload
./scripts/docker-run.sh --mode sse --target development --port 3000
```

## 📦 Image Management

### Build Images
```bash
# Production image
docker build --target production -t lark-mcp:latest .

# Development image
docker build --target development -t lark-mcp:development .

# Both images
docker build --target production -t lark-mcp:latest . && \
docker build --target development -t lark-mcp:development .
```

### List Images
```bash
docker images lark-mcp
```

### Clean Up
```bash
# Remove unused images
docker image prune -f

# Remove specific images
docker rmi lark-mcp:latest lark-mcp:development
```

## 🔧 Configuration

### Environment Variables
```bash
# Required
APP_ID=your_lark_app_id
APP_SECRET=your_lark_app_secret

# Optional
LARK_DOMAIN=https://open.feishu.cn
LARK_LANGUAGE=en
LARK_TOKEN_MODE=auto
GEMINI_API_KEY=your_gemini_api_key  # For Genesis
```

### Docker Compose Profiles
- `production`: Production services
- `development`: Development services with hot reload
- `genesis`: Genesis CLI service

## 🛠️ Development Workflow

### 1. Start Development Environment
```bash
# Start SSE development server
docker-compose --profile development up lark-mcp-sse-dev

# Or use script
./scripts/docker-run.sh --mode sse --target development
```

### 2. Make Changes
- Source code is mounted as volume
- Changes are automatically detected
- Hot reload enabled in development mode

### 3. Test Changes
```bash
# Test in development
curl http://localhost:3000/sse

# Build production image
./scripts/docker-build.sh

# Test production
./scripts/docker-run.sh --mode sse --target production
```

## 🔍 Monitoring

### Health Checks
- Production services include health checks
- SSE endpoint: `http://localhost:3000/sse`
- Health check interval: 30s

### Logs
```bash
# View logs
docker-compose logs lark-mcp-sse

# Follow logs
docker-compose logs -f lark-mcp-sse-dev
```

## 🚨 Troubleshooting

### Common Issues

#### Build Fails
```bash
# Clean build cache
docker builder prune

# Rebuild without cache
docker build --no-cache --target production .
```

#### Container Won't Start
```bash
# Check environment variables
echo $APP_ID $APP_SECRET

# Check container logs
docker logs lark-mcp-sse
```

#### Port Already in Use
```bash
# Check what's using the port
lsof -i :3000

# Use different port
./scripts/docker-run.sh --mode sse --port 3001
```

### Debug Mode
```bash
# Run with debug logging
docker run -e DEBUG=* lark-mcp:latest

# Attach to running container
docker exec -it lark-mcp-sse sh
```

## 📊 Performance

### Image Sizes
- Production: ~150MB
- Development: ~200MB
- Base Node.js: ~100MB

### Build Times
- Production: ~2-3 minutes
- Development: ~1-2 minutes
- With cache: ~30 seconds

## 🔒 Security

### Best Practices
- Non-root user (`lark:1001`)
- Signal handling with `dumb-init`
- Minimal base image (`node:18-alpine`)
- Production dependencies only in production stage

### Security Scanning
```bash
# Scan for vulnerabilities
docker scan lark-mcp:latest

# Update base image
docker pull node:18-alpine
```

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Multi-stage Builds](https://docs.docker.com/develop/dev-best-practices/multistage-build/)
- [Lark OpenAPI Documentation](https://open.feishu.cn/document/)
- [MCP Protocol](https://modelcontextprotocol.io/) 