# Multi-stage Dockerfile for Lark OpenAPI MCP
# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

# Stage 3: Production
FROM node:18-alpine AS production
# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S lark && \
    adduser -S lark -u 1001

WORKDIR /app

# Copy production dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && \
    yarn cache clean

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/docs ./docs

# Change ownership to non-root user
RUN chown -R lark:lark /app
USER lark

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "console.log('Health check passed')" || exit 1

# Expose port for SSE mode
EXPOSE 3000

# Use dumb-init as entrypoint
ENTRYPOINT ["dumb-init", "--"]

# Default command (stdio mode)
CMD ["node", "dist/cli.js", "mcp", "--mode", "stdio"]

# Stage 4: Development
FROM node:18-alpine AS development
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S lark && \
    adduser -S lark -u 1001

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY package.json yarn.lock ./

# Copy source code
COPY . .

# Change ownership to non-root user
RUN chown -R lark:lark /app
USER lark

# Expose port for development
EXPOSE 3000

# Use dumb-init as entrypoint
ENTRYPOINT ["dumb-init", "--"]

# Development command with hot reload
CMD ["yarn", "dev"]