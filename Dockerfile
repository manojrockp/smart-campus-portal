# Multi-stage build for production
FROM node:18-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./
RUN npx prisma generate

FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Production image
FROM node:18-alpine AS production
WORKDIR /app

# Install PM2 globally
RUN npm install -g pm2

# Copy backend
COPY --from=backend-build /app/backend ./backend
COPY --from=frontend-build /app/frontend/build ./frontend/build

# Create logs directory
RUN mkdir -p /app/backend/logs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start with PM2
CMD ["pm2-runtime", "start", "/app/backend/ecosystem.config.js", "--env", "production"]