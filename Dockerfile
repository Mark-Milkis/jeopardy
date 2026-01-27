# Multi-stage build for Jeopardy Pro
# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/client

# Copy client package files
COPY client/src/package*.json ./

# Install client dependencies (including dev deps for building)
RUN npm ci

# Copy client source
COPY client/src/ ./

# Build frontend (Vite)
RUN npm run build

# Stage 2: Setup backend and assemble final image
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./

# Install backend dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy backend source
COPY server/ ./server/
COPY games/ ./games/

# Copy version script and generate version info
COPY scripts/sync-version.js ./scripts/
COPY client/src/package.json ./client/src/package.json

# Generate version information (production build)
RUN node scripts/sync-version.js

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/client/dist ./public

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/src/app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the server
CMD ["node", "server/index.js"]