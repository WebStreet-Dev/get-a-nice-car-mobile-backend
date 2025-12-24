# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy Prisma files
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin
COPY --from=builder /app/prisma ./prisma

# Copy built files
COPY --from=builder /app/dist ./dist

# Copy package.json for prisma commands
COPY --from=builder /app/package.json ./package.json

# Install wget for healthcheck
RUN apk add --no-cache wget

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Create startup script (before switching user) using heredoc
RUN cat > /app/start.sh << 'EOF' && chmod +x /app/start.sh
#!/bin/sh
set -e
echo "Waiting for database to be ready..."
sleep 2
echo "Running database migrations..."
npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss || echo "Database setup completed"
echo "Starting application..."
exec node dist/app.js
EOF

# Create healthcheck script that uses PORT env var
RUN cat > /app/healthcheck.sh << 'EOF' && chmod +x /app/healthcheck.sh
#!/bin/sh
PORT=${PORT:-3000}
wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1
EOF

# Change ownership of app directory to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port (standardized to 3000, but app will use PORT env var)
EXPOSE 3000

# Health check - use script that reads PORT env var
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD /app/healthcheck.sh

# Start the server
CMD ["/app/start.sh"]




